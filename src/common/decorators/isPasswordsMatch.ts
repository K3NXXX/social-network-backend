import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { SignupDto } from '../../modules/auth/dto/auth.dto';

@ValidatorConstraint({ name: 'isPasswordsMatch', async: false })
export class IsPasswordsMatch implements ValidatorConstraintInterface {
  public validate(passwordConfirm: string, args: ValidationArguments): boolean {
    const obj = args.object as SignupDto;
    return obj.password === passwordConfirm;
  }

  public defaultMessage(): string {
    return 'Passwords do not match';
  }
}
