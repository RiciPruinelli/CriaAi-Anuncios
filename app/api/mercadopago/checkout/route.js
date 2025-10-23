// /app/api/mercadopago/checkout/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import mpService from '../../../../lib/mercadopago';

export async function POST(request) {
    try {
        const authUser = await getUserFromRequest(request);

        if (!authUser || !authUser.id) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // 1. Busca os dados mais recentes do usuário para o checkout
        // Usamos o authUser que já deve ter os campos necessários
        const user = {
            id: authUser.id,
            name: authUser.name || 'Cliente',
            email: authUser.email,
        };

        // 2. Cria a preferência de pagamento
        const checkoutUrl = await mpService.createPreference(user);

        return NextResponse.json({ checkoutUrl });

    } catch (error) {
        console.error('Erro na rota /api/mercadopago/checkout:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor ao iniciar o checkout.' },
            { status: 500 }
        );
    }
}

