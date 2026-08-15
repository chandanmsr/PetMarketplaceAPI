using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PetMarketplaceAPI.Data;
using PetMarketplaceAPI.Models;
using System.Security.Claims;

namespace PetMarketplaceAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (userId.HasValue)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId.Value}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            if (userId.HasValue)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId.Value}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(int receiverId, string content, int? petId = null)
        {
            var senderId = GetUserId();
            if (!senderId.HasValue) return;

            var message = new ChatMessage
            {
                SenderId = senderId.Value,
                ReceiverId = receiverId,
                Content = content,
                PetId = petId,
                IsRead = false,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // Send to receiver
            await Clients.Group($"user_{receiverId}").SendAsync("ReceiveMessage", new
            {
                message.Id,
                message.Content,
                message.SenderId,
                message.ReceiverId,
                message.PetId,
                message.IsRead,
                message.SentAt,
                SenderName = await GetUserName(senderId.Value)
            });

            // Send back to sender
            await Clients.Caller.SendAsync("MessageSent", new
            {
                message.Id,
                message.Content,
                message.SenderId,
                message.ReceiverId,
                message.PetId,
                message.IsRead,
                message.SentAt
            });

            // Update unread count for receiver
            var unreadCount = await _context.ChatMessages
                .CountAsync(m => m.ReceiverId == receiverId && !m.IsRead);
            await Clients.Group($"user_{receiverId}").SendAsync("UnreadCountUpdated", unreadCount);
        }

        public async Task MarkAsRead(int messageId)
        {
            var userId = GetUserId();
            if (!userId.HasValue) return;

            var message = await _context.ChatMessages.FindAsync(messageId);
            if (message != null && message.ReceiverId == userId.Value)
            {
                message.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        private int? GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }

        private async Task<string> GetUserName(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user != null ? $"{user.FirstName} {user.LastName}" : "Unknown";
        }
    }
}