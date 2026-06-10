import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body('email') email: string, @Body('password') password: string) {
    return this.usersService.register(email, password);
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.usersService.login(email, password);
  }

  @Get('me')
  me(@Query('email') email: string) {
    return this.usersService.getMe(email);
  }
}
