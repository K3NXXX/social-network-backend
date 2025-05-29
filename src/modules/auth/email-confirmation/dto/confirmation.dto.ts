import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}