import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filtere.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/response/user-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new user.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or validation error.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Retrieves a paginated list of all users.' })
  @ApiQuery({ type: GetUsersFilterDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of users.',
  })
  async getUser(@Query() filterDto: GetUsersFilterDto) {
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 5;

    return this.userService.findAllUser(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieves a single user by ID.' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the user.',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'User found and returned.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOneUser(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a user by ID.' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the user to delete.',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  remove(@Param('id') id: string) {
    return this.userService.removeUser(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a user by ID.' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the user to update.',
    example: 1,
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }
}
