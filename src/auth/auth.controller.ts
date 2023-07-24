import { Controller, Get, Post, Body, UseGuards, Headers, Header } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { AuthGuard } from '@nestjs/passport';

import { Auth, GetRawHeaders, GetUser, RoleProtected } from './decorators';
import { AuthService } from './auth.service';
import { User } from './entities/users.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { UseRoleGuard } from './guards/use-role/use-role.guard';
import { ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(
    @Headers() headers: IncomingHttpHeaders,
    @GetUser() user: User,
  ) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser(['email']) email: string,
    @GetRawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return { ok: true, message: 'Hola ROUTE PRIVATE', user, email, rawHeaders, headers };
  }

  @Get('private2')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UseRoleGuard)
  testingPrivateRole(@GetUser() user: User) {
    return { ok: true, user }
  }

  @Get('private3')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  testingPrivateRole3(@GetUser() user: User) {
    return { ok: true, user }
  }

}
