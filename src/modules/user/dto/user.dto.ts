import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class UpdateUserDto {
  @Trim()
  @IsString()
  @IsOptional()
  username?: string;

  @Trim()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword?: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @Trim()
  @IsString()
  @IsOptional()
  firstName?: string;

  @Trim()
  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Trim()
  @IsString()
  @IsOptional()
  bio?: string;

  @Trim()
  @IsString()
  @IsOptional()
  location?: string;
}

export class UploadAvatarDto {
  @IsString()
  avatarUrl?: string;
}
