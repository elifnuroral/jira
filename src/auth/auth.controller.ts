import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Handles user login.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'User logged in successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid credentials.',
  })
  async signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registers a new user.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. User with this email already exists or invalid data.',
  })
  async register(@Body() registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  //Şifre sıfırlama bağlantısı isteyen kullanıcıyı işler
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Requests a password reset link for the user.' })
  @ApiBody({ type: ForgetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent to the user’s email.',
  })
  @ApiResponse({
    status: 404,
    description: 'User with this email not found.',
  })
  async requestPasswordRes(@Body() dto: ForgetPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  // Kullanıcının şifresini sıfırlamasını sağlar
  @Post('reset-password')
  @ApiOperation({ summary: 'Resets the user’s password using a token.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. Invalid or expired token, or passwords do not match.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
