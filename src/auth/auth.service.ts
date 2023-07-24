import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/users.entity';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...newUserData } = createUserDto;

      const newUser = await this.userRepository.create({ ...newUserData, password: bcrypt.hashSync(password, 10) });

      await this.userRepository.save(newUser);
      delete newUser.password;

      return { ...newUser, token: this.getJwtToken({ email: newUser.email, id: newUser.id }) };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const userLogin = await this.userRepository.findOne({ where: { email }, select: { email: true, password: true, id: true } });

    if (!userLogin) throw new UnauthorizedException('Credentials are not valid (emial)');

    if (!bcrypt.compareSync(password, userLogin.password)) throw new UnauthorizedException('Credentials are not valid (password)');

    return { ...userLogin, token: this.getJwtToken({ email, id: userLogin.id }) };
  }

  async checkAuthStatus(user: User) {
    return { ...user, token: this.getJwtToken({ email: user.email, id: user.id }) };
  }

  private getJwtToken(jwtPayload: JwtPayload) {
    return this.jwtService.sign(jwtPayload);
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    throw new InternalServerErrorException('Please check server logs');
  }

}
