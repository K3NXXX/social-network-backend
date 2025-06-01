import { IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePostDto {
	@IsOptional()
	@IsString()
	content?: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
