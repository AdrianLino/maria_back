import {
    Controller,
    Get,
    Post,
    Req,
    Res,
    Headers,
    HttpStatus,
    UseGuards,
    Query,
    BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    @Get('products')
    @ApiOperation({ summary: 'Obtener planes de suscripción disponibles' })
    async getProducts() {
        return this.stripeService.getProducts();
    }

    @Post('portal')
    @UseGuards(AuthGuard())
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Obtener link al portal de clientes' })
    async getPortalSession(@GetUser() user: User) {
        const url = await this.stripeService.createCustomerPortalSession(user);
        return { url };
    }

    @Get('payment-link')
    @UseGuards(AuthGuard())
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Obtener link de pago para suscripción' })
    @ApiResponse({ status: 200, description: 'URL de checkout de Stripe' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    async getPaymentLink(
        @GetUser() user: User,
        @Query('priceId') priceId: string,
    ) {
        if (!priceId) {
            throw new BadRequestException('priceId is required');
        }
        const paymentUrl = await this.stripeService.createPaymentLink(user, priceId);
        return {
            paymentUrl,
            message: 'Redirige al usuario a esta URL para completar el pago',
        };
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Webhook para recibir eventos de Stripe' })
    @ApiResponse({ status: 200, description: 'Evento procesado correctamente' })
    @ApiResponse({ status: 400, description: 'Error en la verificación del webhook' })
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string,
    ) {
        try {
            const event = this.stripeService.constructWebhookEvent(
                req.rawBody!,
                signature,
            );
            await this.stripeService.handleWebhookEvent(event);
            return res.status(HttpStatus.OK).json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error.message);
            return res.status(HttpStatus.BAD_REQUEST).json({
                error: `Webhook Error: ${error.message}`,
            });
        }
    }

    @Get('success')
    @ApiOperation({ summary: 'Página de éxito después del pago' })
    @ApiResponse({ status: 200, description: 'Pago exitoso' })
    async handleSuccess() {
        return {
            success: true,
            message: '¡Gracias por tu suscripción! Tu cuenta ya está activa.',
        };
    }

    @Get('cancel')
    @ApiOperation({ summary: 'Página de cancelación del pago' })
    @ApiResponse({ status: 200, description: 'Pago cancelado' })
    async handleCancel() {
        return {
            success: false,
            message: 'El pago fue cancelado. Puedes intentar de nuevo cuando quieras.',
        };
    }
}
