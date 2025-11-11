import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class SyncTransactionsDto {
  @IsString()
  address: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

