import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageDto {
  @IsOptional()
  @IsUUID()
  chatId?: string;

  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
