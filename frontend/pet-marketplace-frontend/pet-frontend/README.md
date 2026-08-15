# Pet Marketplace — Frontend

A minimalist React + Vite frontend for the `PetMarketplaceAPI` ASP.NET Core backend.

## What's included
- Auth (register/login) with Buyer/Seller roles
- Browse & filter pet listings, geolocation distance search
- Pet detail page with gallery, vaccination history, offers
- Seller dashboard: create/edit/delete listings, image upload, mark-adopted, vaccination records
- Buyer dashboard: my pets, pending confirmations, my offers
- Real-time chat (SignalR) with REST fallback
- Nearby services finder (vets, pet care, pharmacy)

---

## 1. Run the backend (PetMarketplaceAPI)

You need **.NET SDK 10** and **SQL Server** (LocalDB is fine) installed.

```bash
cd PetMarketplaceAPI
dotnet restore
dotnet run
```

By default it starts on **http://localhost:5102** (see `Properties/launchSettings.json`).
The database is created automatically on first run (`dbContext.Database.EnsureCreated()`).

Confirm it's running by opening **http://localhost:5102/swagger** in your browser — you should
see the Swagger UI listing all endpoints.

> If your backend runs on a different port, update the frontend's `.env` in step 2 to match.

### CORS
The backend already has an `AllowAll` CORS policy enabled in `Program.cs`, so the frontend
can call it from any origin/port during development — no backend changes needed.

---

## 2. Run the frontend

You need **Node.js 18+**.

```bash
cd pet-frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser.

The `.env` file points the frontend at the backend:

```
VITE_API_BASE_URL=http://localhost:5102/api
VITE_HUB_URL=http://localhost:5102/chatHub
VITE_FILE_BASE_URL=http://localhost:5102
```

If your backend runs elsewhere (different port, HTTPS, deployed URL), edit these three
lines in `.env` and restart `npm run dev`.

---

## 3. Try it end-to-end

1. Go to **http://localhost:5173/register**, create a **Seller** account.
2. From the Seller Dashboard, click **+ New listing**, fill in the pet's details, upload a
   couple of photos, and publish.
3. Open a second browser (or an incognito window) and register a **Buyer** account.
4. As the buyer, browse the listing, open it, and click **Make an offer** — this creates a
   negotiation and starts a chat with the seller.
5. Switch back to the seller's window → **Messages** to see the offer come in (real-time via
   SignalR if both tabs are open).
6. From the Seller Dashboard, click **Mark adopted** on that listing and pick the buyer.
7. As the buyer, go to **Dashboard → Pending confirmations** and click **Confirm** — the pet
   moves to **My pets** with its vaccination history.

---

## Building for production

```bash
npm run build
```

Outputs static files to `dist/`. Serve them with any static host, and make sure
`VITE_API_BASE_URL` etc. in `.env` point at your deployed backend before building
(Vite bakes `VITE_*` variables in at build time).

---

## Project structure

```
src/
  api/            axios client + one module per backend resource (auth, pets, chat, ...)
  components/     shared UI: Navbar, PetCard, Modal, ImageUploader, StatusPill
  context/        AuthContext (session, token, SignalR lifecycle)
  pages/          one file per route; seller/ holds seller-only modals
  styles/         tokens.css — the whole design system (colors, type, spacing)
```

## Known limitations (matching the current API)
- There's no `GET /api/Pets/{id}` endpoint, so the pet detail page reuses the list
  response (passed via router state, or re-fetched from `/api/Pets` as a fallback).
- "Mark as adopted" needs a buyer ID; the UI pulls this from negotiation offers on that
  pet, or lets you type one in if no offer exists yet (e.g. a deal made over chat only).
- The JWT signing key is hardcoded in `Program.cs` for local development — move it to
  a secret/config value before deploying.
