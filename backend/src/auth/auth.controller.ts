import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IsEmail, IsString, MinLength } from 'class-validator';
class AuthDto { @IsEmail() email: string; @IsString() @MinLength(6) password: string; }
class ChangePwDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') register(@Body() dto: AuthDto) { return this.auth.register(dto.email, dto.password); }
  @Post('login')    login(@Body() dto: AuthDto)    { return this.auth.login(dto.email, dto.password); }
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Body() dto: ChangePwDto, @Request() req: any) {
    return this.auth.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
