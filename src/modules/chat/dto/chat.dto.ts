import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ChatDto {
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  participantIds: string[];
}
