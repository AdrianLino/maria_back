import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class StripeService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger('StripeService');
    private readonly priceId = 'price_1SsUZoK9IDDOq1wQSiSiLv8o'; // Suscripción Premium 100 MXN/mes

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!);
    }

    /**
     * Crea un cliente en Stripe si no existe
     */
    async getOrCreateCustomer(user: User): Promise<string> {
        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        const customer = await this.stripe.customers.create({
            email: user.email,
            name: user.fullName,
            metadata: {
                userId: user.id,
            },
        });

        await this.userRepository.update(user.id, {
            stripeCustomerId: customer.id,
        });

        this.logger.log(`Created Stripe customer ${customer.id} for user ${user.id}`);
        return customer.id;
    }

    /**
     * Crea un link de pago para la suscripción
     */
    async createPaymentLink(user: User): Promise<string> {
        const customerId = await this.getOrCreateCustomer(user);

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [
                {
                    price: this.priceId,
                    quantity: 1,
                },
            ],
            success_url: `${this.configService.get<string>('HOST_API')}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get<string>('HOST_API')}/stripe/cancel`,
            metadata: {
                userId: user.id,
            },
        });

        this.logger.log(`Created checkout session ${session.id} for user ${user.id}`);
        return session.url!;
    }

    /**
     * Procesa eventos de webhook de Stripe
     */
    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        this.logger.log(`Processing webhook event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await this.handleCheckoutCompleted(session);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionUpdated(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionDeleted(subscription);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await this.handlePaymentFailed(invoice);
                break;
            }
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }
    }

    /**
     * Procesa checkout completado - activa la suscripción
     */
    private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const userId = session.metadata?.userId;
        if (!userId) {
            this.logger.warn('Checkout session without userId in metadata');
            return;
        }

        await this.userRepository.update(userId, {
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
        });

        this.logger.log(`Activated subscription for user ${userId}`);
    }

    /**
     * Procesa actualizaciones de suscripción
     */
    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
            this.logger.warn(`User not found for subscription ${subscription.id}`);
            return;
        }

        await this.userRepository.update(user.id, {
            subscriptionStatus: subscription.status,
        });

        this.logger.log(`Updated subscription status to ${subscription.status} for user ${user.id}`);
    }

    /**
     * Procesa eliminación de suscripción
     */
    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
            this.logger.warn(`User not found for subscription ${subscription.id}`);
            return;
        }

        await this.userRepository.update(user.id, {
            stripeSubscriptionId: null,
            subscriptionStatus: 'canceled',
        });

        this.logger.log(`Canceled subscription for user ${user.id}`);
    }

    /**
     * Procesa fallo de pago
     */
    private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const user = await this.userRepository.findOne({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            this.logger.warn(`User not found for customer ${customerId}`);
            return;
        }

        await this.userRepository.update(user.id, {
            subscriptionStatus: 'past_due',
        });

        this.logger.log(`Marked subscription as past_due for user ${user.id}`);
    }

    /**
     * Construye y verifica un evento de webhook
     */
    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
