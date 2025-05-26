import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageDto {
  @IsOptional()
  @IsUUID()
  chatId?: string;

  @IsOptional()
  @IsUUID()
  participantId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
