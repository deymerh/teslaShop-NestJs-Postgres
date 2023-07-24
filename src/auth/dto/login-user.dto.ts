import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W+).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number'
  })
  password: string;

}
