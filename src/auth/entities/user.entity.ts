import { ApiProperty } from "@nestjs/swagger";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {

    @ApiProperty({
        example: '7d98767c-3e37-4b4a-9987-8e05a778b8b2',
        description: 'Identificador único del usuario (UUID v4)',
        uniqueItems: true,
        format: 'uuid',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 'juan.perez@example.com',
        description: 'Correo electrónico del usuario',
        uniqueItems: true,
        format: 'email',
    })
    @Column('text', {
        unique: true
    })
    email: string;

    @ApiProperty({
        example: '$2b$10$X6YGFj.YqJ9y9Y8kFZ5.xOvHx7fK8H2',
        description: 'Contraseña hasheada con bcrypt (no se expone en respuestas)',
        writeOnly: true,
    })
    @Column('text', {
        select: false
    })
    password: string;

    @ApiProperty({
        example: 'Juan Pérez López',
        description: 'Nombre completo del usuario',
        minLength: 1,
        maxLength: 100,
    })
    @Column('text', {
        name: 'full_name'
    })
    fullName: string;

    @ApiProperty({
        example: true,
        description: 'Indica si la cuenta del usuario está activa',
        default: true,
    })
    @Column('bool', {
        default: true
    })
    isActive: boolean;

    @ApiProperty({
        example: ['user'],
        description: 'Roles asignados al usuario para control de acceso',
        isArray: true,
        enum: ['admin', 'super-user', 'user'],
        default: ['user'],
    })
    @Column('text', {
        array: true,
        default: ['user']
    })
    roles: string[];

    @ApiProperty({
        example: '2024-01-15T10:30:00.000Z',
        description: 'Fecha y hora de creación del usuario',
        type: String,
        format: 'date-time',
    })
    @Column('timestamp', {
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-03-20T14:45:00.000Z',
        description: 'Fecha y hora de última actualización del usuario',
        type: String,
        format: 'date-time',
    })
    @Column('timestamp', {
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt: Date;

    @ApiProperty({
        example: 'cus_1234567890',
        description: 'ID del cliente en Stripe',
        nullable: true,
    })
    @Column('text', {
        name: 'stripe_customer_id',
        nullable: true
    })
    stripeCustomerId: string | null;

    @ApiProperty({
        example: 'sub_1234567890',
        description: 'ID de la suscripción activa en Stripe',
        nullable: true,
    })
    @Column('text', {
        name: 'stripe_subscription_id',
        nullable: true
    })
    stripeSubscriptionId: string | null;

    @ApiProperty({
        example: 'active',
        description: 'Estado de la suscripción del usuario',
        enum: ['inactive', 'active', 'past_due', 'canceled'],
        default: 'inactive',
    })
    @Column('text', {
        name: 'subscription_status',
        default: 'inactive'
    })
    subscriptionStatus: string;

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }
}