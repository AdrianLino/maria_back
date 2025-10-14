import { 
    Controller, Get, Post, Body, HttpCode, HttpStatus 
} from '@nestjs/common';
import { 
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody 
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginUserDto, CreateUserDto } from './dto';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Auth } from './decorators';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Registrar nuevo usuario',
        description: 'Crea una nueva cuenta de usuario en el sistema. El email debe ser único y la contraseña debe cumplir con los requisitos de seguridad (mayúscula, minúscula, número/carácter especial). Retorna el usuario creado y un token JWT.',
    })
    @ApiBody({
        type: CreateUserDto,
        description: 'Datos requeridos para crear un nuevo usuario',
        examples: {
            ejemplo1: {
                summary: 'Usuario estándar',
                value: {
                    email: 'juan.perez@example.com',
                    password: 'Secure@2025',
                    fullName: 'Juan Pérez López'
                }
            },
            ejemplo2: {
                summary: 'Usuario administrativo',
                value: {
                    email: 'admin@company.com',
                    password: 'Admin@2025',
                    fullName: 'Administrador Sistema'
                }
            }
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Usuario registrado exitosamente. Retorna datos del usuario y token JWT',
        type: User,
        schema: {
            example: {
                id: '7d98767c-3e37-4b4a-9987-8e05a778b8b2',
                email: 'juan.perez@example.com',
                fullName: 'Juan Pérez López',
                isActive: true,
                roles: ['user'],
                createdAt: '2024-03-20T10:30:00.000Z',
                updatedAt: '2024-03-20T10:30:00.000Z',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Datos inválidos o email ya registrado',
        schema: {
            example: {
                statusCode: 400,
                message: 'duplicate key value violates unique constraint',
                error: 'Bad Request'
            }
        }
    })
    @ApiResponse({
        status: 500,
        description: 'Error interno del servidor',
        schema: {
            example: {
                statusCode: 500,
                message: 'Unexpected error, check server logs',
                error: 'Internal Server Error'
            }
        }
    })
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.authService.create(createUserDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión',
        description: 'Autentica un usuario existente mediante email y contraseña. Valida las credenciales y retorna un token JWT válido para acceder a recursos protegidos.',
    })
    @ApiBody({
        type: LoginUserDto,
        description: 'Credenciales de acceso del usuario',
        examples: {
            ejemplo1: {
                summary: 'Login estándar',
                value: {
                    email: 'juan.perez@example.com',
                    password: 'Secure@2025'
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Inicio de sesión exitoso. Retorna usuario y token JWT',
        type: User,
        schema: {
            example: {
                id: '7d98767c-3e37-4b4a-9987-8e05a778b8b2',
                email: 'juan.perez@example.com',
                fullName: 'Juan Pérez López',
                isActive: true,
                roles: ['user'],
                createdAt: '2024-03-20T10:30:00.000Z',
                updatedAt: '2024-03-20T10:30:00.000Z',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Credenciales inválidas - Email no encontrado',
        schema: {
            example: {
                statusCode: 400,
                message: 'Credentials are not valid (email)',
                error: 'Bad Request'
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales inválidas - Contraseña incorrecta',
        schema: {
            example: {
                statusCode: 400,
                message: 'Credentials are not valid (password)',
                error: 'Bad Request'
            }
        }
    })
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }

    @Get('check-auth-status')
    @HttpCode(HttpStatus.OK)
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Verificar estado de autenticación',
        description: 'Valida el token JWT actual del usuario autenticado. Útil para refrescar tokens, verificar sesiones activas y obtener información actualizada del usuario. Requiere token JWT válido en el header Authorization.',
    })
    @ApiResponse({
        status: 200,
        description: 'Token válido - Retorna usuario autenticado con nuevo token refrescado',
        type: User,
        schema: {
            example: {
                id: '7d98767c-3e37-4b4a-9987-8e05a778b8b2',
                email: 'juan.perez@example.com',
                fullName: 'Juan Pérez López',
                isActive: true,
                roles: ['user'],
                createdAt: '2024-03-20T10:30:00.000Z',
                updatedAt: '2024-03-20T10:30:00.000Z',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'No autorizado - Token inválido, expirado o no proporcionado',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized',
                error: 'Unauthorized'
            }
        }
    })
    @ApiResponse({
        status: 403,
        description: 'Acceso prohibido - Usuario sin permisos suficientes',
        schema: {
            example: {
                statusCode: 403,
                message: 'Forbidden resource',
                error: 'Forbidden'
            }
        }
    })
    checkAuthStatus(
        @GetUser() user: User
    ) {
        return this.authService.checkAuthStatus(user);
    }
}