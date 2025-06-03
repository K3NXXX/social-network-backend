import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChatDto {
  @IsString()
  chatId: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  lastMessage?: {
    id: string;
    content?: string;
    imageUrl?: string | null;
    createdAt: Date;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  } | null;

  @IsArray()
  @ArrayNotEmpty()
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
  }[];
}
