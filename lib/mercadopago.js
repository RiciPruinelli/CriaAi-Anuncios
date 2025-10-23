// /lib/mercadopago.js

import mercadopago from 'mercadopago';
import { NextResponse } from 'next/server';

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (MP_ACCESS_TOKEN) {
    mercadopago.configure({
        access_token: MP_ACCESS_TOKEN,
    });
} else {
    console.warn("❌ MP_ACCESS_TOKEN não configurada. A integração com Mercado Pago não funcionará.");
}

const mpService = {
    /**
     * Cria uma preferência de pagamento para o plano Premium.
     * @param {object} user - Objeto do usuário (para metadados).
     * @returns {Promise<string>} O URL de checkout para o usuário.
     */
    createPreference: async (user) => {
        if (!MP_ACCESS_TOKEN) {
            throw new Error("MP_ACCESS_TOKEN não configurada.");
        }

        const planTitle = process.env.MP_PLAN_TITLE || "Plano Premium";
        const planPrice = parseFloat(process.env.MP_PLAN_PRICE) || 29.90;
        
        const preference = {
            items: [
                {
                    title: planTitle,
                    unit_price: planPrice,
                    quantity: 1,
                    currency_id: 'BRL',
                },
            ],
            payer: {
                name: user.name || 'Cliente',
                email: user.email,
            },
            back_urls: {
                success: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
                failure: `${process.env.NEXTAUTH_URL}/dashboard?payment=failure`,
                pending: `${process.env.NEXTAUTH_URL}/dashboard?payment=pending`,
            },
            auto_return: 'approved',
            external_reference: user.id, // ID do usuário para identificar no webhook
            notification_url: process.env.MP_WEBHOOK_URL,
            metadata: {
                user_id: user.id,
                plan: 'PAID',
            },
        };

        try {
            const response = await mercadopago.preferences.create(preference);
            // Retorna o URL de checkout, que pode ser o sandbox_init_point (para testes) ou init_point (para produção)
            return response.body.init_point || response.body.sandbox_init_point;
        } catch (error) {
            console.error('Erro ao criar preferência de pagamento:', error.message);
            throw new Error('Falha ao iniciar o checkout do Mercado Pago.');
        }
    },

    /**
     * Processa a notificação de webhook do Mercado Pago.
     * @param {object} body - O corpo da requisição do webhook.
     * @returns {Promise<boolean>} Se o processamento foi bem-sucedido.
     */
    processWebhook: async (body) => {
        // A lógica de webhook é complexa e deve ser implementada na rota de API
        // Esta função servirá apenas como um placeholder para a rota.
        console.log("Webhook recebido:", body);
        
        // Exemplo de como obter o pagamento (requer o ID da notificação)
        // if (body.type === 'payment' && body.data?.id) {
        //     const paymentId = body.data.id;
        //     const payment = await mercadopago.payment.get(paymentId);
        //     console.log("Detalhes do pagamento:", payment.body);
        //     // Lógica para atualizar o usuário no banco de dados
        // }

        return true;
    }
};

export default mpService;

