import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The password reset token received via email.',
    example: 'xyz123abc456',
    required: true,
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The new password for the account (minimum 6 characters).',
    example: 'newStrongPassword',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of the new password (must match newPassword).',
    example: 'newStrongPassword',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
