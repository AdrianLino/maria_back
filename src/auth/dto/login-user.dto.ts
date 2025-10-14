import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class LoginUserDto {
    
    @ApiProperty({
        example: "juan.perez@example.com",
        description: "Correo electrónico registrado del usuario",
        required: true,
        format: 'email',
    })
    @IsString()
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    email: string;

    @ApiProperty({
        example: "Secure@2025",
        description: "Contraseña del usuario",
        required: true,
        minLength: 6,
        maxLength: 50,
        format: 'password',
    })
    @IsString()
    password: string;
}