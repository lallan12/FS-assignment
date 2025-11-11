export interface Wallet {
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  blockNumber: bigint | string;
  gasUsed: bigint | string | null;
  gasPrice: bigint | string | null;
  timestamp: Date;
  status: 'success' | 'failed';
  walletId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletBalanceResponse {
  address: string;
  balance: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionDetailResponse extends Transaction {}

export interface SyncTransactionsResponse {
  synced: number;
  new: number;
}

export type TransactionType = 'sent' | 'received' | 'all';

