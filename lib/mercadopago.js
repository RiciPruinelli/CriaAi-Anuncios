// /lib/mercadopago.js (CORRIGIDO - Configuração movida para runtime)
import mercadopago from 'mercadopago';

// A CONFIGURAÇÃO FOI MOVIDA DAQUI...

const mpService = {
    /**
     * Cria uma preferência de pagamento para o plano Premium.
     * @param {object} user - Objeto do usuário (para metadados).
     * @returns {Promise<string>} O URL de checkout para o usuário.
     */
    createPreference: async (user) => {
        // ...PARA CÁ!
        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (MP_ACCESS_TOKEN) {
            mercadopago.configure({
                access_token: MP_ACCESS_TOKEN,
            });
            console.log("==== MP Service: SDK configurado com Access Token. ===="); // Log para confirmar
        } else {
            console.warn("❌ MP_ACCESS_TOKEN não configurada. A integração com Mercado Pago não funcionará.");
        }
        // FIM DA CONFIGURAÇÃO MOVIDA

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
            notification_url: process.env.MP_WEBHOOK_URL, // Garanta que esta URL está correta nas vars de ambiente do Vercel!
            metadata: {
                user_id: user.id,
                plan: 'PAID',
            },
        };

        try {
            console.log("==== MP Service: Criando preferência... ====");
            const response = await mercadopago.preferences.create(preference);
            console.log("==== MP Service: Preferência criada. ====");
            // Retorna o URL de checkout, que pode ser o sandbox_init_point (para testes) ou init_point (para produção)
            return response.body.init_point || response.body.sandbox_init_point;
        } catch (error) {
            console.error('==== MP Service: Erro ao criar preferência de pagamento:', error.message, error?.cause); // Log mais detalhado
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
        // Você moverá a lógica da rota /api/mercadopago/webhook/route.js para cá no futuro, se quiser
        // if (body.type === 'payment' && body.data?.id) {
        //     const paymentId = body.data.id;
        //     const payment = await mercadopago.payment.get(paymentId);
        //     console.log("Detalhes do pagamento:", payment.body);
        //     // Lógica para atualizar o usuário no banco de dados
        // }

        return true;
    }
};

export default mpService;