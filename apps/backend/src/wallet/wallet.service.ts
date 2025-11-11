import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ethers, TransactionResponse } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const rpcUrl = this.configService.get<string>('ETHEREUM_RPC_URL');
    if (!rpcUrl) {
      this.logger.warn('ETHEREUM_RPC_URL not set, using default Sepolia RPC');
    }
    this.provider = new ethers.JsonRpcProvider(
      rpcUrl || 'https://eth-sepolia.g.alchemy.com/v2/demo'
    );
  }

  async retrieveWalletBalance(address: string): Promise<string> {
    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Error fetching balance for ${address}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch wallet balance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async ensureWalletRecord(address: string) {
    const normalizedAddress = address.toLowerCase();
    let wallet = await this.prisma.wallet.findUnique({
      where: { address: normalizedAddress },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { address: normalizedAddress },
      });
    }

    return wallet;
  }

  async deriveWalletTransactions(
    address: string,
    page: number = 1,
    limit: number = 20,
    type?: 'sent' | 'received'
  ) {
    const normalizedAddress = address.toLowerCase();
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ fromAddress: normalizedAddress }, { toAddress: normalizedAddress }],
    };

    if (type === 'sent') {
      where.fromAddress = normalizedAddress;
      delete where.OR;
    } else if (type === 'received') {
      where.toAddress = normalizedAddress;
      delete where.OR;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((tx) => ({
        ...tx,
        blockNumber: tx.blockNumber.toString(),
        gasUsed: tx.gasUsed?.toString() || null,
        gasPrice: tx.gasPrice?.toString() || null,
      })),
      total,
      page,
      limit,
    };
  }

  async collectBlockchainTransactions(address: string, limit: number = 20) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
      }

      const normalizedAddress = address.toLowerCase();
      const transactions: any[] = [];

      // Get the latest block
      const latestBlock = await this.provider.getBlockNumber();

      // Fetch transactions from recent blocks
      const blocksToCheck = Math.min(limit * 10, 1000); // Check up to 1000 blocks
      let found = 0;

      for (let i = 0; i < blocksToCheck && found < limit; i++) {
        const blockNumber = latestBlock - i;
        try {
          const block = await this.provider.getBlock(blockNumber, true);
          if (!block || !block.transactions) continue;

          const transactionsInBlock = block.transactions as ReadonlyArray<
            string | TransactionResponse
          >;

          for (const tx of transactionsInBlock) {
            if (found >= limit) break;

            if (typeof tx === 'string') continue;
            const txHash = tx.hash;
            const from = tx.from?.toLowerCase();
            const to = tx.to?.toLowerCase();

            if (
              (from === normalizedAddress || to === normalizedAddress) &&
              tx.value &&
              tx.value > 0n
            ) {
              try {
                const receipt = await this.provider.getTransactionReceipt(txHash);
                const txResponse = await this.provider.getTransaction(txHash);

                transactions.push({
                  hash: txHash,
                  fromAddress: from || '',
                  toAddress: to || '',
                  amount: ethers.formatEther(tx.value || 0n),
                  blockNumber: BigInt(blockNumber),
                  gasUsed: receipt ? BigInt(receipt.gasUsed.toString()) : null,
                  gasPrice: txResponse?.gasPrice ? BigInt(txResponse.gasPrice.toString()) : null,
                  timestamp: new Date((block.timestamp || 0) * 1000),
                  status: receipt?.status === 1 ? 'success' : 'failed',
                });

                found++;
              } catch (err) {
                this.logger.warn(`Error fetching receipt for ${txHash}:`, err);
              }
            }
          }
        } catch (err) {
          this.logger.warn(`Error fetching block ${blockNumber}:`, err);
        }
      }

      return transactions;
    } catch (error) {
      this.logger.error(`Error fetching transactions for ${address}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch transactions from blockchain',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
