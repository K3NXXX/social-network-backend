import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class AccountDto {
	@Trim()
	@IsOptional()
	@IsEmail({}, { message: 'Email must be valid' })
	newEmail?: string;

	@IsOptional()
	@MinLength(8)
	newPassword?: string;

	@Trim()
	@IsOptional()
	@IsString()
	@MinLength(3)
	newUsername?: string;

	@IsOptional()
	@IsString()
	currentPassword: string;
}
