import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	Validate,
} from 'class-validator';
import { IsPasswordsMatch } from '../../../common/decorators/isPasswordsMatch';

export class SignupDto {
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@IsNotEmpty()
	lastName: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	password: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8, {
		message: 'The password for confirmation must be at least 8 characters',
	})
	@Validate(IsPasswordsMatch, {
		message: 'Passwords do not match',
	})
	confirmPassword: string;
}

export type SignupMeta = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

export class LoginDto {
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	password: string;
}
