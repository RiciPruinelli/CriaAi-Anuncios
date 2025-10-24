// /lib/mercadopago.js (VERSÃO FINAL PARA TESTE - auto_return COMENTADO)
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'; // Importa da forma correta para SDK v3

// Instancia o cliente FORA das funções
// Certifique-se que MP_ACCESS_TOKEN está correto no seu .env
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);
const payment = new Payment(client); // Instancia para uso futuro no webhook

const mpService = {
    /**
     * Cria uma preferência de pagamento para o plano Premium.
     * @param {object} user - Objeto do usuário (para metadados).
     * @returns {Promise<string|null>} O URL de checkout (init_point) ou null em caso de erro.
     */
    createPreference: async (user) => {
        // Verifica se a variável de ambiente NEXTAUTH_URL está definida
        const nextAuthUrl = process.env.NEXTAUTH_URL;
        if (!nextAuthUrl) {
            console.error("❌ NEXTAUTH_URL não configurada no .env.");
            throw new Error("Configuração de URL de retorno ausente.");
        }
        console.log("==== MP Service: Verificando NEXTAUTH_URL:", nextAuthUrl);

        const planTitle = process.env.MP_PLAN_TITLE || "Plano Premium";
        const planPrice = parseFloat(process.env.MP_PLAN_PRICE) || 29.90;
        const webhookUrl = process.env.MP_WEBHOOK_URL;

        if (!webhookUrl) {
             console.warn("⚠️ MP_WEBHOOK_URL não configurada no .env. Notificações de pagamento podem não funcionar.");
        }

        const preferenceData = {
            body: {
                items: [
                    {
                        id: 'plan_premium_monthly',
                        title: planTitle,
                        unit_price: planPrice,
                        quantity: 1,
                        currency_id: 'BRL',
                        description: 'Assinatura mensal do Plano Premium Cria.AI',
                        category_id: 'services',
                    },
                ],
                payer: {
                    name: user.name || 'Cliente',
                    surname: '', // Opcional
                    email: user.email,
                },
                back_urls: {
                    success: `${nextAuthUrl}/dashboard?payment=success`,
                    failure: `${nextAuthUrl}/dashboard?payment=failure`,
                    pending: `${nextAuthUrl}/dashboard?payment=pending`,
                },
                // auto_return: 'approved', // <<--- LINHA COMENTADA PARA TESTE LOCAL
                external_reference: user.id,
                notification_url: webhookUrl,
                metadata: {
                    user_id: user.id,
                    plan: 'PAID',
                },
                // statement_descriptor: "CRIAAI PREMIUM",
            }
        };

        console.log("==== MP Service: Enviando preferenceData (sem auto_return):", JSON.stringify(preferenceData, null, 2));

        try {
            console.log("==== MP Service: Criando preferência com nova SDK... ====");
            const result = await preference.create(preferenceData);
            console.log("==== MP Service: Preferência criada:", JSON.stringify(result, null, 2));

            const checkoutUrl = result.init_point || result.sandbox_init_point;

            if (!checkoutUrl) {
                console.error("==== MP Service: init_point ou sandbox_init_point não encontrado na resposta:", result);
                throw new Error("Não foi possível obter o URL de checkout da resposta do Mercado Pago.");
            }
            return checkoutUrl;

        } catch (error) {
            console.error('==== MP Service: Erro ao criar preferência de pagamento:', error?.message || error);
            if (error.cause) {
                console.error('==== MP Service: Causa do erro:', JSON.stringify(error.cause, null, 2));
            }
            const apiErrorMessage = error?.cause?.error?.message || error?.message || 'Falha ao iniciar o checkout do Mercado Pago.';
            throw new Error(apiErrorMessage);
        }
    },

    /**
     * Processa a notificação de webhook do Mercado Pago (LÓGICA PRECISA SER AJUSTADA PARA SDK V3).
     * @param {object} body - O corpo da requisição do webhook.
     * @returns {Promise<boolean>} Se o processamento foi bem-sucedido.
     */
    processWebhook: async (body) => {
        console.log("==== Webhook MP Service: Notificação recebida (Lógica antiga):", body);
        console.warn("==== Webhook MP Service: Lógica de processamento precisa ser implementada/ajustada para SDK v3 ====");
        // ... (A lógica antiga precisa ser adaptada usando o 'payment' instanciado no topo) ...
        return true;
    }
};

export default mpService;