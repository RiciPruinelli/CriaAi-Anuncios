// /app/api/mercadopago/checkout/route.js (CORRIGIDO - Import dinâmico)
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
// REMOVA o import daqui: import mpService from '../../../../lib/mercadopago';

export async function POST(request) {
    console.log("==== API Mercado Pago Checkout: Requisição recebida ===="); // Log inicial
    try {
        const authUser = await getUserFromRequest(request);
        console.log("==== API Mercado Pago Checkout: Resultado getUserFromRequest:", authUser); // Log do usuário

        if (!authUser || !authUser.id) {
            console.error("==== API Mercado Pago Checkout: Erro de autenticação ====");
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // IMPORTE AQUI DENTRO:
        // Usamos require para garantir que funcione no build
        console.log("==== API Mercado Pago Checkout: Tentando importar mpService... ====");
        const mpService = require('../../../../lib/mercadopago').default;
        console.log("==== API Mercado Pago Checkout: mpService importado com sucesso. ====");


        // 1. Busca os dados mais recentes do usuário para o checkout
        // Usamos o authUser que já deve ter os campos necessários
        const user = {
            id: authUser.id,
            // Certifique-se de que seu getUserFromRequest retorna 'name' e 'email' ou busque no DB aqui
            name: authUser.name || 'Cliente',
            email: authUser.email,
        };
        console.log("==== API Mercado Pago Checkout: Dados do usuário para checkout:", user);

        // 2. Cria a preferência de pagamento
        console.log("==== API Mercado Pago Checkout: Chamando mpService.createPreference... ====");
        const checkoutUrl = await mpService.createPreference(user);
        console.log("==== API Mercado Pago Checkout: URL de checkout recebido:", checkoutUrl);

        if (!checkoutUrl) {
           console.error("==== API Mercado Pago Checkout: createPreference retornou URL nulo ou vazio ====");
           throw new Error("Não foi possível obter o URL de checkout.");
        }

        return NextResponse.json({ checkoutUrl });

    } catch (error) {
        console.error('==== API Mercado Pago Checkout: ERRO CRÍTICO ====', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor ao iniciar o checkout.' },
            { status: 500 }
        );
    }
}