import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('stripe_webhook_logs')
export class WebhookLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    stripeEventId: string;

    @Column('text')
    type: string;

    @Column('jsonb')
    payload: any;

    @Column('text', { default: 'processed' })
    status: string; // 'processed', 'failed', 'ignored'

    @Column('text', { nullable: true })
    errorMessage: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
