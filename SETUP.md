# Quick Setup Guide

This guide will help you install dependencies and run the Crypto Wallet Tracker project.

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18 or higher installed
- **pnpm** 8 or higher installed
- **PostgreSQL** (or use SQLite for simpler setup)
- **MetaMask** browser extension (for testing)

### Check Prerequisites

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check if pnpm is installed
pnpm --version  # Should be >= 8.0.0
```

### Install pnpm (if not installed)

```bash
# Using npm
npm install -g pnpm

# Or using Homebrew (macOS)
brew install pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## Step-by-Step Installation

### Step 1: Install Dependencies

From the project root directory, run:

```bash
pnpm install
```

This will install all dependencies for:

- Root workspace
- Frontend app
- Backend app
- Shared packages (types, config)

**Expected output:** All packages should install successfully. This may take a few minutes.

### Step 2: Set Up Environment Variables

#### Backend Environment Variables

Create `apps/backend/.env` file:

```bash
cd apps/backend
touch .env
```

Add the following content to `apps/backend/.env`:

```env
# Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/wallet_tracker"

# Or for SQLite (simpler for development):
# DATABASE_URL="file:./dev.db"

# Ethereum RPC URL (get free API key from Alchemy or Infura)
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Backend port
PORT=3001

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

**Note:** Replace `YOUR_KEY` with your actual Alchemy or Infura API key:

- [Get Alchemy API Key](https://www.alchemy.com/)
- [Get Infura API Key](https://www.infura.io/)

#### Frontend Environment Variables

Create `apps/frontend/.env.local` file:

```bash
cd apps/frontend
touch .env.local
```

Add the following content to `apps/frontend/.env.local`:

```env
# Ethereum RPC URL (same as backend or different)
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Chain ID for Sepolia testnet
NEXT_PUBLIC_CHAIN_ID=11155111

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 3: Set Up Database

#### Option A: PostgreSQL (Recommended)

1. **Create PostgreSQL database:**

```bash
# Using psql
createdb wallet_tracker

# Or using SQL command
psql -U postgres
CREATE DATABASE wallet_tracker;
\q
```

2. **Update `apps/backend/.env`** with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/wallet_tracker"
```

3. **Run migrations:**

```bash
# From project root
pnpm --filter backend prisma migrate dev
```

#### Option B: SQLite (Simpler for Development)

1. **Update Prisma schema** (`apps/backend/prisma/schema.prisma`):

Change the datasource from:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

To:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. **Update `apps/backend/.env`:**

```env
DATABASE_URL="file:./dev.db"
```

3. **Run migrations:**

```bash
pnpm --filter backend prisma migrate dev
```

### Step 4: Generate Prisma Client

```bash
pnpm --filter backend prisma generate
```

This generates the Prisma Client that the backend uses to interact with the database.

## Running the Project

### Option 1: Run Both Frontend and Backend Together

From the project root:

```bash
pnpm dev
```

This will start:

- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:3000`

### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Backend:**

```bash
pnpm dev:backend
```

**Terminal 2 - Frontend:**

```bash
pnpm dev:frontend
```

### Option 3: Run Individual Apps

**Backend only:**

```bash
cd apps/backend
pnpm dev
```

**Frontend only:**

```bash
cd apps/frontend
pnpm dev
```

## Verify Installation

1. **Check Backend:** Open `http://localhost:3001/api` - You should see a 404 (which is expected, as there's no root endpoint)

2. **Check Frontend:** Open `http://localhost:3000` - You should see the wallet connection page

3. **Test API Endpoint:**

```bash
# Test wallet balance endpoint (replace with a valid address)
curl http://localhost:3001/api/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/balance
```

## Troubleshooting

### Issue: `pnpm: command not found`

**Solution:** Install pnpm globally:

```bash
npm install -g pnpm
```

### Issue: Database connection error

**Solution:**

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` is correct
- Ensure database exists: `psql -l | grep wallet_tracker`

### Issue: Prisma client not generated

**Solution:**

```bash
pnpm --filter backend prisma generate
```

### Issue: Port already in use

**Solution:**

- Change PORT in `apps/backend/.env`
- Or kill the process using the port:
  ```bash
  # Find process on port 3001
  lsof -ti:3001
  # Kill it
  kill -9 $(lsof -ti:3001)
  ```

### Issue: CORS errors

**Solution:**

- Verify `FRONTEND_URL` in `apps/backend/.env` matches your frontend URL
- Check that frontend is running on the correct port

### Issue: RPC errors

**Solution:**

- Verify your Alchemy/Infura API key is correct
- Check you have sufficient API quota
- Ensure you're using the correct network (Sepolia testnet)

## Next Steps

Once everything is running:

1. **Open the frontend:** `http://localhost:3000`
2. **Connect MetaMask:** Click "Connect Wallet" and approve the connection
3. **Switch to Sepolia testnet:** Ensure MetaMask is on Sepolia (Chain ID: 11155111)
4. **View transactions:** Click "View Transactions" to see your transaction history
5. **Sync transactions:** Use the "Sync Transactions" button to fetch latest transactions

## Useful Commands

```bash
# Install dependencies
pnpm install

# Run both apps
pnpm dev

# Run only frontend
pnpm dev:frontend

# Run only backend
pnpm dev:backend

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean

# Database commands (from project root)
pnpm --filter backend prisma migrate dev    # Run migrations
pnpm --filter backend prisma generate       # Generate Prisma client
pnpm --filter backend prisma studio         # Open Prisma Studio (database GUI)
```

## Production Build

To build for production:

```bash
# Build all apps
pnpm build

# Start production servers
# Terminal 1 - Backend
cd apps/backend
pnpm start

# Terminal 2 - Frontend
cd apps/frontend
pnpm start
```

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review [VERIFICATION.md](./VERIFICATION.md) to see what's implemented
- Check the troubleshooting section above
