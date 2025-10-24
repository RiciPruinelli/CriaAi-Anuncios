// /app/api/mercadopago/checkout/route.js (Usa import normal do serviço atualizado)
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth'; // Confirme se este caminho está correto
import mpService from '../../../../lib/mercadopago'; // Usa import normal

export async function POST(request) {
    console.log("==== API Mercado Pago Checkout: Requisição recebida ====");
    try {
        const authUser = await getUserFromRequest(request);
        // Log completo do usuário para depuração
        console.log("==== API Mercado Pago Checkout: Resultado getUserFromRequest:", JSON.stringify(authUser, null, 2));

        if (!authUser || !authUser.id || !authUser.email) { // Verifica email também
            console.error("==== API Mercado Pago Checkout: Erro de autenticação ou faltam dados do usuário (id, email). ====", authUser);
            return NextResponse.json({ error: 'Não autenticado ou dados de usuário incompletos.' }, { status: 401 });
        }

        // Dados do usuário para o checkout
        const user = {
            id: authUser.id,
            name: authUser.name || 'Cliente', // Garanta que 'name' existe ou use um padrão
            email: authUser.email,
        };
        console.log("==== API Mercado Pago Checkout: Dados do usuário para checkout:", user);

        console.log("==== API Mercado Pago Checkout: Chamando mpService.createPreference... ====");
        const checkoutUrl = await mpService.createPreference(user);
        console.log("==== API Mercado Pago Checkout: URL de checkout recebido:", checkoutUrl);

        // A verificação de URL nulo agora é feita dentro do mpService
        return NextResponse.json({ checkoutUrl });

    } catch (error) {
        console.error('==== API Mercado Pago Checkout: ERRO CRÍTICO ====', error?.message, error?.cause);
        // Retorna a mensagem de erro específica que veio do mpService
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor ao iniciar o checkout.' },
            { status: 500 }
        );
    }
}