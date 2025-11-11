import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ethers } from 'ethers';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':address/balance')
  async handleRetrieveBalance(@Param('address') address: string) {
    if (!ethers.isAddress(address)) {
      throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
    }

    const balance = await this.walletService.retrieveWalletBalance(address);
    return {
      address,
      balance,
    };
  }

  @Get(':address/transactions')
  async handleListTransactions(
    @Param('address') address: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'sent' | 'received'
  ) {
    if (!ethers.isAddress(address)) {
      throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (isNaN(pageNum) || pageNum < 1) {
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new HttpException('Invalid limit (1-100)', HttpStatus.BAD_REQUEST);
    }
    console.log({ address, pageNum, limitNum, type });

    return this.walletService.deriveWalletTransactions(address, pageNum, limitNum, type);
  }
}
