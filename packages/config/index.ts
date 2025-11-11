export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://eth-sepolia.g.alchemy.com/v2/demo';

export const CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || '11155111',
  10
);

