import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import { Gender } from '@prisma/client';

export class UserDto {
	@Trim()
	@IsString()
	@IsOptional()
	firstName?: string;

	@Trim()
	@IsString()
	@IsOptional()
	lastName?: string;

	@IsDateString({}, { message: 'Date must be a valid ISO date' })
	@IsOptional()
	dateOfBirth?: string;

	@IsEnum(Gender, { message: 'Gender must be one of the allowed values' })
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
