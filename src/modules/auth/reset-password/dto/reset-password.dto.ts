import { IsNotEmpty, IsEmail } from "class-validator";

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
