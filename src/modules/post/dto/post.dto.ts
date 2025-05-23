import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Content must be at least 5 characters' })
  content: string;

  @IsOptional()
  @IsString()
  photo?: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
