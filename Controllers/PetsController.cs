using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetMarketplaceAPI.Data;
using PetMarketplaceAPI.Models;
using System.Security.Claims;

namespace PetMarketplaceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PetsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Pets
        [HttpGet]
        public async Task<ActionResult> GetPets(
            [FromQuery] double? latitude = null,
            [FromQuery] double? longitude = null,
            [FromQuery] double? radiusKm = 50,
            [FromQuery] string? species = null)
        {
            var query = _context.Pets
                .Include(p => p.Images)
                .Include(p => p.Seller)
                .Where(p => p.Status == "Available");

            if (!string.IsNullOrEmpty(species))
                query = query.Where(p => p.Species == species);

            var pets = await query.ToListAsync();

            var result = pets.Select(p => new
            {
                p.Id,
                p.Name,
                p.Species,
                p.Breed,
                p.Age,
                p.Price,
                p.Description,
                p.Status,
                p.IsVaccinated,
                p.LastVaccinationDate,
                p.NextVaccinationDate,
                p.LocationDescription,
                p.Latitude,
                p.Longitude,
                SellerName = p.Seller != null ? $"{p.Seller.FirstName} {p.Seller.LastName}" : "Unknown",
                SellerId = p.SellerId,
                Images = p.Images?.Select(i => i.ImageUrl).ToList(),
                DistanceKm = CalculateDistance(latitude, longitude, p.Latitude, p.Longitude)
            })
            .Where(p => !radiusKm.HasValue || p.DistanceKm <= radiusKm.Value)
            .OrderBy(p => p.DistanceKm)
            .ToList();

            return Ok(result);
        }

        // GET: api/Pets/my-listings
        [Authorize]
        [HttpGet("my-listings")]
        public async Task<ActionResult> GetMyListings()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                Console.WriteLine($"Fetching listings for seller ID: {userId}");

                var listings = await _context.Pets
                    .Include(p => p.Images)
                    .Include(p => p.Buyer)
                    .Where(p => p.SellerId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                Console.WriteLine($"Found {listings.Count} listings");

                var result = listings.Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Species,
                    p.Breed,
                    p.Age,
                    p.Price,
                    p.Status,
                    p.NegotiatedPrice,
                    BuyerName = p.Buyer != null ? $"{p.Buyer.FirstName} {p.Buyer.LastName}" : null,
                    BuyerId = p.BuyerId,
                    Images = p.Images?.Select(i => i.ImageUrl).ToList(),
                    p.CreatedAt
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMyListings: {ex.Message}");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        // GET: api/Pets/my-pets
        [Authorize]
        [HttpGet("my-pets")]
        public async Task<ActionResult> GetMyPets()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                Console.WriteLine($"Fetching my pets for user ID: {userId}");

                // Remove the AdoptionConfirmed filter - just check BuyerId and Status
                var pets = await _context.Pets
                    .Include(p => p.Images)
                    .Include(p => p.Seller)
                    .Include(p => p.Vaccinations)
                    .Where(p => p.BuyerId == userId && p.Status == "Adopted")
                    .ToListAsync();

                Console.WriteLine($"Found {pets.Count} adopted pets");

                var result = pets.Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Species,
                    p.Breed,
                    p.Age,
                    p.Price,
                    p.Description,
                    p.Status,
                    p.IsVaccinated,
                    p.LastVaccinationDate,
                    p.NextVaccinationDate,
                    SellerName = p.Seller != null ? $"{p.Seller.FirstName} {p.Seller.LastName}" : "Unknown",
                    Images = p.Images?.Select(i => i.ImageUrl).ToList(),
                    Vaccinations = p.Vaccinations?.Select(v => new VaccinationDto
                    {
                        Id = v.Id,
                        VaccineName = v.VaccineName,
                        VaccinationDate = v.VaccinationDate,
                        NextDueDate = v.NextDueDate,
                        VeterinarianName = v.VeterinarianName,
                        ClinicName = v.ClinicName,
                        Notes = v.Notes
                    }).OrderByDescending(v => v.VaccinationDate).ToList()
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMyPets: {ex.Message}");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        // GET: api/Pets/pending-adoptions
        [Authorize]
        [HttpGet("pending-adoptions")]
        public async Task<ActionResult> GetPendingAdoptions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var pets = await _context.Pets
                .Include(p => p.Images)
                .Include(p => p.Seller)
                .Where(p => p.BuyerId == userId && p.Status == "PendingConfirmation" && !p.AdoptionConfirmed)
                .ToListAsync();
            return Ok(pets);
        }

        // POST: api/Pets
        [Authorize]
        [HttpPost]
        public async Task<ActionResult> CreatePet([FromBody] CreatePetRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var pet = new Pet
            {
                Name = request.Name,
                Species = request.Species,
                Breed = request.Breed,
                Age = request.Age,
                Price = request.Price,
                LastVaccinationDate = request.LastVaccinationDate,
                NextVaccinationDate = request.NextVaccinationDate,
                Description = request.Description,
                IsVaccinated = request.IsVaccinated,
                LocationDescription = request.LocationDescription,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                SellerId = userId,
                CreatedAt = DateTime.UtcNow,
                Status = "Available"
            };

            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            if (request.ImageUrls != null && request.ImageUrls.Any())
            {
                var images = request.ImageUrls.Take(5).Select((url, index) => new PetImage
                {
                    ImageUrl = url,
                    PetId = pet.Id,
                    IsPrimary = index == 0,
                    DisplayOrder = index
                });
                _context.PetImages.AddRange(images);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Pet listed successfully", petId = pet.Id });
        }
        // Add this method to PetsController.cs for adding vaccinations
        [Authorize]
        [HttpPost("{id}/add-vaccination")]
        public async Task<ActionResult> AddVaccination(int id, [FromBody] VaccinationRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var pet = await _context.Pets.FindAsync(id);

            if (pet == null) return NotFound(new { message = "Pet not found" });
            if (pet.BuyerId != userId && pet.SellerId != userId)
                return Forbid();

            var vaccination = new VaccinationRecord
            {
                PetId = id,
                VaccineName = request.VaccineName,
                VaccinationDate = request.VaccinationDate,
                NextDueDate = request.NextDueDate,
                VeterinarianName = request.VeterinarianName,
                ClinicName = request.ClinicName,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.VaccinationRecords.Add(vaccination);

            // Update pet's vaccination status
            pet.IsVaccinated = true;
            pet.LastVaccinationDate = request.VaccinationDate;
            pet.NextVaccinationDate = request.NextDueDate;
            pet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Vaccination added successfully", vaccinationId = vaccination.Id });
        }
        // PUT: api/Pets/5
        [Authorize]
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePet(int id, [FromBody] UpdatePetRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var pet = await _context.Pets.FindAsync(id);

            if (pet == null) return NotFound();
            if (pet.SellerId != userId) return Forbid();

            if (request.Name != null) pet.Name = request.Name;
            if (request.Species != null) pet.Species = request.Species;
            if (request.Breed != null) pet.Breed = request.Breed;
            if (request.Age.HasValue) pet.Age = request.Age.Value;
            if (request.Price.HasValue) pet.Price = request.Price.Value;
            if (request.Description != null) pet.Description = request.Description;
            if (request.Status != null) pet.Status = request.Status;
            pet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Pet updated successfully" });
        }

        // DELETE: api/Pets/5
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePet(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var pet = await _context.Pets.FindAsync(id);

            if (pet == null) return NotFound();
            if (pet.SellerId != userId) return Forbid();

            _context.Pets.Remove(pet);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pet deleted successfully" });
        }

        // POST: api/Pets/5/mark-adopted
        [Authorize]
        [HttpPost("{id}/mark-adopted")]
        public async Task<ActionResult> MarkAdopted(int id, [FromBody] MarkAdoptedRequest request)
        {
            try
            {
                var sellerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var pet = await _context.Pets.FindAsync(id);

                if (pet == null) return NotFound(new { message = "Pet not found" });
                if (pet.SellerId != sellerId) return Forbid();

                Console.WriteLine($"MarkAdopted: PetId={id}, SellerId={sellerId}, BuyerId={request.BuyerId}");

                pet.BuyerId = request.BuyerId;
                pet.Status = "PendingConfirmation";
                pet.AdoptionRequestDate = DateTime.UtcNow;
                pet.NegotiatedPrice = request.FinalPrice ?? pet.Price;
                pet.UpdatedAt = DateTime.UtcNow;

                var chatMessage = new ChatMessage
                {
                    SenderId = sellerId,
                    ReceiverId = request.BuyerId,
                    PetId = pet.Id,
                    Content = $"🎉 Great news! I accept your adoption request for {pet.Name}. Please confirm the adoption.",
                    IsRead = false,
                    SentAt = DateTime.UtcNow
                };
                _context.ChatMessages.Add(chatMessage);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Pet marked for adoption" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in MarkAdopted: {ex.Message}");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        // POST: api/Pets/5/confirm-adoption
        [Authorize]
        [HttpPost("{id}/confirm-adoption")]
        public async Task<ActionResult> ConfirmAdoption(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var pet = await _context.Pets.FindAsync(id);

                if (pet == null) return NotFound(new { message = "Pet not found" });

                Console.WriteLine($"ConfirmAdoption: PetId={id}, UserId={userId}, PetBuyerId={pet.BuyerId}, PetStatus={pet.Status}");

                // Set BuyerId to current user (in case it wasn't set correctly before)
                pet.BuyerId = userId;
                pet.AdoptionConfirmed = true;
                pet.Status = "Adopted";
                pet.AdoptionConfirmedDate = DateTime.UtcNow;
                pet.UpdatedAt = DateTime.UtcNow;

                // Send confirmation message to seller
                var chatMessage = new ChatMessage
                {
                    SenderId = userId,
                    ReceiverId = pet.SellerId,
                    PetId = pet.Id,
                    Content = $"✅ I confirm that I have adopted {pet.Name}. Thank you!",
                    IsRead = false,
                    SentAt = DateTime.UtcNow
                };
                _context.ChatMessages.Add(chatMessage);

                await _context.SaveChangesAsync();

                Console.WriteLine($"Pet {id} confirmed as adopted by user {userId}");

                return Ok(new { message = "Adoption confirmed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ConfirmAdoption: {ex.Message}");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        // POST: api/Pets/5/reject-adoption
        [Authorize]
        [HttpPost("{id}/reject-adoption")]
        public async Task<ActionResult> RejectAdoption(int id)
        {
            var pet = await _context.Pets.FindAsync(id);
            if (pet == null) return NotFound();

            pet.Status = "Available";
            pet.BuyerId = null;
            pet.AdoptionConfirmed = false;
            pet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Adoption rejected" });
        }

        // PUT: api/Pets/5/rename
        [Authorize]
        [HttpPut("{id}/rename")]
        public async Task<ActionResult> RenamePet(int id, [FromBody] string newName)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var pet = await _context.Pets.FindAsync(id);

            if (pet == null) return NotFound();
            if (pet.BuyerId != userId && pet.SellerId != userId) return Forbid();

            pet.Name = newName;
            pet.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pet renamed successfully" });
        }

        // GET: api/Pets/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult> GetPet(int id)
        {
            var pet = await _context.Pets
                .Include(p => p.Images)
                .Include(p => p.Seller)
                .Include(p => p.Buyer)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pet == null) return NotFound(new { message = "Pet not found" });

            return Ok(new
            {
                pet.Id,
                pet.Name,
                pet.Species,
                pet.Breed,
                pet.Age,
                pet.Price,
                pet.Status,
                pet.IsVaccinated,
                pet.LastVaccinationDate,
                pet.NextVaccinationDate,
                pet.LocationDescription,
                pet.NegotiatedPrice,
                pet.BuyerId,
                pet.SellerId,
                pet.AdoptionConfirmed,
                Images = pet.Images?.Select(i => i.ImageUrl).ToList()
            });
        }

        private double CalculateDistance(double? lat1, double? lon1, double? lat2, double? lon2)
        {
            if (!lat1.HasValue || !lon1.HasValue || !lat2.HasValue || !lon2.HasValue)
                return 0;

            const double R = 6371;
            var dLat = (lat2.Value - lat1.Value) * Math.PI / 180;
            var dLon = (lon2.Value - lon1.Value) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1.Value * Math.PI / 180) * Math.Cos(lat2.Value * Math.PI / 180) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }

    public class CreatePetRequest
    {
        public string Name { get; set; }
        public string Species { get; set; }
        public string Breed { get; set; }
        public int Age { get; set; }
        public decimal Price { get; set; }
        public DateTime LastVaccinationDate { get; set; }
        public DateTime? NextVaccinationDate { get; set; }
        public string? Description { get; set; }
        public bool IsVaccinated { get; set; }
        public string? LocationDescription { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public List<string>? ImageUrls { get; set; }
        public List<VaccinationRequest>? Vaccinations { get; set; }
    }

    public class VaccinationRequest
    {
        public string VaccineName { get; set; }
        public DateTime VaccinationDate { get; set; }
        public DateTime? NextDueDate { get; set; }
        public string? VeterinarianName { get; set; }
        public string? ClinicName { get; set; }
        public string? Notes { get; set; }
    }

    public class VaccinationDto
    {
        public int Id { get; set; }
        public string VaccineName { get; set; }
        public DateTime VaccinationDate { get; set; }
        public DateTime? NextDueDate { get; set; }
        public string? VeterinarianName { get; set; }
        public string? ClinicName { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdatePetRequest
    {
        public string? Name { get; set; }
        public string? Species { get; set; }
        public string? Breed { get; set; }
        public int? Age { get; set; }
        public decimal? Price { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
    }

    public class MarkAdoptedRequest
    {
        public int BuyerId { get; set; }
        public decimal? FinalPrice { get; set; }
    }
}