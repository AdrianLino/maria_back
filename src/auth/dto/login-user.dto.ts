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
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La contraseña no puede exceder 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, 
        {
            message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número o carácter especial'
        }
    )
    password: string;
}