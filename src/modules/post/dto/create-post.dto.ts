import {
    IsNotEmpty,
    IsString,
    IsOptional,
  } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  photo?: string;  
}
