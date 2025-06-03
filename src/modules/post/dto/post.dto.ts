import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Privacy } from '@prisma/client';

export class CreatePostDto {
	@IsOptional()
	@IsString()
	content?: string;

	@IsOptional()
	@IsEnum(Privacy)
	privacy?: Privacy;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
	@IsOptional()
	@IsBoolean()
	removePhoto?: boolean;
}
