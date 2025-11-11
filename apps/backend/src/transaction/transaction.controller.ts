import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { SyncTransactionsDto } from './dto/sync-transactions.dto';
import { ethers } from 'ethers';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get(':hash')
  async fetchTransactionDetails(@Param('hash') hash: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      throw new HttpException('Invalid transaction hash', HttpStatus.BAD_REQUEST);
    }

    return this.transactionService.lookupTransactionByHash(hash);
  }
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('sync')
  async initiateTransactionSync(@Body() dto: SyncTransactionsDto) {
    if (!ethers.isAddress(dto.address)) {
      throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
    }
    //
    const limit = dto.limit && dto.limit > 0 && dto.limit <= 100 ? dto.limit : 20;

    return this.transactionService.synchronizeWalletTransactions(dto.address, limit);
  }
}
