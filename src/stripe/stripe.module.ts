import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { User } from '../auth/entities/user.entity';
import { WebhookLog } from './entities/webhook-log.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User, WebhookLog]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [StripeController],
    providers: [StripeService],
    exports: [StripeService],
})
export class StripeModule { }
