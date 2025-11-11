# Crypto Wallet Transaction Tracker

A full-stack web application that allows users to connect their Ethereum wallet, view their balance, and track their transaction history. Built with Next.js, NestJS, Prisma, and Web3 technologies.

## Features

- 🔗 **Wallet Connection**: Connect MetaMask wallet with automatic network detection
- 💰 **Balance Display**: View real-time Ethereum wallet balance
- 📊 **Transaction History**: Browse recent transactions with filtering (sent/received)
- 🔍 **Transaction Details**: View comprehensive transaction information
- 🔄 **Transaction Sync**: Sync transactions from blockchain to local database
- 📱 **Responsive Design**: Modern, clean UI built with Tailwind CSS
- 🚀 **Monorepo Architecture**: Turborepo-powered monorepo with shared packages

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **ethers.js v6** - Web3 wallet integration
- **Tailwind CSS** - Styling
- **Custom UI Components** - No external UI libraries

### Backend
- **NestJS** - Node.js framework
- **TypeScript**
- **Prisma ORM** - Database management
- **PostgreSQL** - Database (or SQLite for development)
- **ethers.js v6** - Blockchain interaction
- **class-validator** - Input validation

### Infrastructure
- **Turborepo** - Monorepo tooling
- **pnpm** - Package manager
- **PostgreSQL/SQLite** - Database

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ 
- **pnpm** 8+ (or npm/yarn)
- **PostgreSQL** (or use SQLite for simplicity)
- **MetaMask** browser extension (for testing)

## Project Structure

```
crypto-wallet-tracker/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── page.tsx              # Wallet connection page
│   │   │       ├── transactions/
│   │   │       │   └── page.tsx         # Transaction list page
│   │   │       └── transaction/
│   │   │           └── [hash]/
│   │   │               └── page.tsx      # Transaction detail page
│   │   └── package.json
│   └── backend/           # NestJS API
│       ├── src/
│       │   ├── wallet/    # Wallet module
│       │   ├── transaction/  # Transaction module
│       │   └── prisma/    # Prisma service
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
├── packages/
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── package.json          # Root package.json
├── turbo.json           # Turborepo configuration
└── pnpm-workspace.yaml  # pnpm workspace config
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crypto-wallet-tracker
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

#### Backend Environment Variables

Create `apps/backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wallet_tracker"
# Or for SQLite (simpler for development):
# DATABASE_URL="file:./dev.db"

ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment Variables

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Note**: 
- Replace `YOUR_KEY` with your Alchemy or Infura API key
- For Sepolia testnet, use Chain ID `11155111`
- You can get a free API key from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)

### 4. Database Setup

#### Option A: PostgreSQL (Recommended for Production)

1. Create a PostgreSQL database:
```bash
createdb wallet_tracker
```

2. Update `DATABASE_URL` in `apps/backend/.env`

3. Run migrations:
```bash
pnpm --filter backend prisma migrate dev
```

#### Option B: SQLite (Simpler for Development)

1. Update `apps/backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `apps/backend/.env`:
```env
DATABASE_URL="file:./dev.db"
```

3. Run migrations:
```bash
pnpm --filter backend prisma migrate dev
```

### 5. Generate Prisma Client

```bash
pnpm --filter backend prisma generate
```

### 6. Run Database Migrations

```bash
pnpm --filter backend prisma migrate dev
```

## Running the Application

### Development Mode

#### Run Both Frontend and Backend

```bash
pnpm dev
```

#### Run Frontend Only

```bash
pnpm dev:frontend
```

#### Run Backend Only

```bash
pnpm dev:backend
```

### Production Build

```bash
pnpm build
```

### Start Production Servers

```bash
# Backend
pnpm --filter backend start

# Frontend (in another terminal)
pnpm --filter frontend start
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## API Endpoints

### Wallet Endpoints

#### Get Wallet Balance
```
GET /api/wallet/:address/balance
```

**Response:**
```json
{
  "address": "0x...",
  "balance": "1.2345"
}
```

#### Get Wallet Transactions
```
GET /api/wallet/:address/transactions?page=1&limit=20&type=sent|received
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by `sent` or `received`

**Response:**
```json
{
  "transactions": [...],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### Transaction Endpoints

#### Get Transaction by Hash
```
GET /api/transaction/:hash
```

**Response:**
```json
{
  "id": "...",
  "hash": "0x...",
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "amount": "0.1",
  "blockNumber": "12345",
  "gasUsed": "21000",
  "gasPrice": "20000000000",
  "timestamp": "2024-01-01T00:00:00Z",
  "status": "success"
}
```

#### Sync Transactions
```
POST /api/transactions/sync
```

**Request Body:**
```json
{
  "address": "0x...",
  "limit": 20
}
```

**Response:**
```json
{
  "synced": 15,
  "new": 5
}
```

## Database Schema

### Wallet Model
```prisma
model Wallet {
  id          String        @id @default(cuid())
  address     String        @unique
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  transactions Transaction[]
}
```

### Transaction Model
```prisma
model Transaction {
  id          String    @id @default(cuid())
  hash        String    @unique
  fromAddress String
  toAddress   String
  amount      String
  blockNumber BigInt
  gasUsed     BigInt?
  gasPrice    BigInt?
  timestamp   DateTime
  status      String    // "success" or "failed"
  walletId    String?
  wallet      Wallet?   @relation(fields: [walletId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([fromAddress])
  @@index([toAddress])
  @@index([timestamp])
}
```

## Usage Guide

### 1. Connect Wallet

1. Open the application at http://localhost:3000
2. Click "Connect Wallet" button
3. Approve the connection in MetaMask
4. Ensure you're connected to Sepolia testnet (Chain ID: 11155111)
5. Your wallet address and balance will be displayed

### 2. View Transactions

1. Click "View Transactions" button on the home page
2. Browse your transaction history
3. Use filters to view only "Sent" or "Received" transactions
4. Click "Load More" to paginate through transactions

### 3. Sync Transactions

1. On the transactions page, click "Sync Transactions"
2. The app will fetch the latest transactions from the blockchain
3. New transactions will be cached in the database

### 4. View Transaction Details

1. Click on any transaction in the list
2. View comprehensive transaction details including:
   - Transaction hash
   - From/To addresses
   - Amount
   - Block number
   - Gas information
   - Timestamp
   - Status
3. Click "View on Etherscan" to see the transaction on the blockchain explorer

## Testing Scenarios

### Wallet Connection
- ✅ Connect MetaMask wallet
- ✅ Display wallet address and balance
- ✅ Disconnect and reconnect
- ✅ Switch accounts in MetaMask
- ✅ Handle network switching

### Transaction List
- ✅ View recent transactions
- ✅ Filter by sent/received
- ✅ Navigate to transaction detail
- ✅ Handle wallet with no transactions
- ✅ Pagination with "Load More"

### Transaction Details
- ✅ View full transaction details
- ✅ Navigate back to list
- ✅ Handle invalid transaction hash

### Error Handling
- ✅ Network errors
- ✅ Invalid wallet address
- ✅ RPC errors
- ✅ Database errors

## Troubleshooting

### Common Issues

#### 1. "MetaMask is not installed"
- Install the MetaMask browser extension
- Refresh the page

#### 2. "Please switch to the correct network"
- Ensure MetaMask is connected to Sepolia testnet
- Chain ID should be 11155111

#### 3. Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `apps/backend/.env`
- Ensure database exists

#### 4. RPC Errors
- Verify `ETHEREUM_RPC_URL` is correct
- Check your Alchemy/Infura API key
- Ensure you have sufficient API quota

#### 5. CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `apps/backend/src/main.ts`

## Development

### Code Structure

- **Frontend**: Follows Next.js App Router conventions
- **Backend**: Follows NestJS module structure
- **Shared Types**: Defined in `packages/types`
- **Shared Config**: Defined in `packages/config`

### Adding New Features

1. **Backend**: Add new modules/services in `apps/backend/src`
2. **Frontend**: Add new pages in `apps/frontend/src/app`
3. **Types**: Update shared types in `packages/types`
4. **Database**: Update Prisma schema and run migrations

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Environment Variables Reference

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `ETHEREUM_RPC_URL`: Ethereum RPC endpoint (Alchemy/Infura)
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

### Frontend (.env.local)
- `NEXT_PUBLIC_RPC_URL`: Ethereum RPC endpoint
- `NEXT_PUBLIC_CHAIN_ID`: Ethereum chain ID (11155111 for Sepolia)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Assumptions and Decisions

1. **Testnet Usage**: Application uses Sepolia testnet by default (not mainnet)
2. **Database**: Supports both PostgreSQL and SQLite (SQLite for simpler development)
3. **Transaction Fetching**: Fetches transactions by scanning recent blocks (up to 1000 blocks)
4. **Caching**: Transactions are cached in database to reduce RPC calls
5. **Pagination**: Uses offset-based pagination with "Load More" functionality
6. **Error Handling**: Comprehensive error handling with user-friendly messages
7. **UI Library**: Custom components built with Tailwind CSS (no external UI libraries)

## Future Enhancements

- [ ] Add WalletConnect support in addition to MetaMask
- [ ] Implement real-time transaction updates via WebSocket
- [ ] Add transaction export functionality (CSV/JSON)
- [ ] Support multiple wallet addresses
- [ ] Add transaction search functionality
- [ ] Implement rate limiting on backend
- [ ] Add API documentation with Swagger/OpenAPI
- [ ] Add unit and integration tests
- [ ] Docker setup for easy deployment
- [ ] Support for multiple blockchain networks

## License

This project is part of a technical assessment.

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

