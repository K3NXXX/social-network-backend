import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class NewPasswordDto {
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty()
  password: string;
}
