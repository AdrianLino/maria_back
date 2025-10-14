import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    
    @ApiProperty({
        example: "juan.perez@example.com",
        description: "Correo electrónico válido del usuario. Debe ser único en el sistema",
        required: true,
        format: 'email',
        uniqueItems: true,
    })
    @IsString()
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    email: string;

    @ApiProperty({
        example: "Secure@2025",
        description: "Contraseña segura que debe contener al menos una mayúscula, una minúscula y un número o carácter especial",
        required: true,
        minLength: 6,
        maxLength: 50,
        format: 'password',
    })
    @IsString()
    password: string;

    @ApiProperty({
        example: "Juan Pérez López",
        description: "Nombre completo del usuario",
        required: true,
        minLength: 1,
        maxLength: 100,
    })
    @IsString()
    @MinLength(1, { message: 'El nombre completo no puede estar vacío' })
    @MaxLength(100, { message: 'El nombre completo no puede exceder 100 caracteres' })
    fullName: string;
}