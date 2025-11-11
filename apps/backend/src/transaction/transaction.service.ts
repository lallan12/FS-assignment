import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private configService: ConfigService
  ) {
    const rpcUrl = this.configService.get<string>('ETHEREUM_RPC_URL');
    this.provider = new ethers.JsonRpcProvider(
      rpcUrl || 'https://eth-sepolia.g.alchemy.com/v2/demo'
    );
  }

  async lookupTransactionByHash(hash: string) {
    try {
      // Check cache first
      const cached = await this.prisma.transaction.findUnique({
        where: { hash },
      });

      if (cached) {
        return {
          ...cached,
          blockNumber: cached.blockNumber.toString(),
          gasUsed: cached.gasUsed?.toString() || null,
          gasPrice: cached.gasPrice?.toString() || null,
        };
      }

      // Fetch from blockchain
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(hash),
        this.provider.getTransactionReceipt(hash),
      ]);

      if (!tx) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      const block = await this.provider.getBlock(tx.blockNumber || 0);

      const transactionData = {
        hash: tx.hash,
        fromAddress: tx.from?.toLowerCase() || '',
        toAddress: tx.to?.toLowerCase() || '',
        amount: ethers.formatEther(tx.value || 0n),
        blockNumber: BigInt(tx.blockNumber || 0),
        gasUsed: receipt ? BigInt(receipt.gasUsed.toString()) : null,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice.toString()) : null,
        timestamp: block ? new Date((block.timestamp || 0) * 1000) : new Date(),
        status: receipt?.status === 1 ? 'success' : 'failed',
      };

      // Cache the transaction
      const wallet = await this.walletService.ensureWalletRecord(transactionData.fromAddress);

      const saved = await this.prisma.transaction.upsert({
        where: { hash },
        update: transactionData,
        create: {
          ...transactionData,
          walletId: wallet.id,
        },
      });

      return {
        ...saved,
        blockNumber: saved.blockNumber.toString(),
        gasUsed: saved.gasUsed?.toString() || null,
        gasPrice: saved.gasPrice?.toString() || null,
      };
    } catch (error) {
      this.logger.error(`Error fetching transaction ${hash}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch transaction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async synchronizeWalletTransactions(address: string, limit: number = 20) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
      }

      const normalizedAddress = address.toLowerCase();
      const wallet = await this.walletService.ensureWalletRecord(normalizedAddress);

      // Fetch transactions from blockchain
      const blockchainTxs = await this.walletService.collectBlockchainTransactions(address, limit);

      let synced = 0;
      let newCount = 0;

      for (const tx of blockchainTxs) {
        const existing = await this.prisma.transaction.findUnique({
          where: { hash: tx.hash },
        });

        if (existing) {
          // Update existing transaction
          await this.prisma.transaction.update({
            where: { hash: tx.hash },
            data: {
              ...tx,
              walletId: wallet.id,
            },
          });
          synced++;
        } else {
          // Create new transaction
          await this.prisma.transaction.create({
            data: {
              ...tx,
              walletId: wallet.id,
            },
          });
          newCount++;
          synced++;
        }
      }

      return {
        synced,
        new: newCount,
      };
    } catch (error) {
      this.logger.error(`Error syncing transactions for ${address}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to sync transactions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
