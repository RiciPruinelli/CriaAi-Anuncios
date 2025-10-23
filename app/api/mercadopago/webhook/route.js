// /app/api/mercadopago/webhook/route.js
import { NextResponse } from 'next/server';
import mercadopago from 'mercadopago';
import prisma from '../../../../lib/prisma';

// Configuração do Mercado Pago (para garantir que o SDK esteja configurado)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (MP_ACCESS_TOKEN) {
    mercadopago.configure({
        access_token: MP_ACCESS_TOKEN,
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log("==== WEBHOOK MP RECEBIDO ====", body);

        // O Mercado Pago envia o ID da notificação ou o ID do pagamento
        const { type, data } = body;

        if (type === 'payment' && data && data.id) {
            const paymentId = data.id;

            // Busca os detalhes do pagamento
            const payment = await mercadopago.payment.get(paymentId);
            const paymentStatus = payment.body.status;
            const externalReference = payment.body.external_reference; // É o userId

            console.log(`Pagamento ID: ${paymentId}, Status: ${paymentStatus}, User ID: ${externalReference}`);

            if (paymentStatus === 'approved') {
                // Atualiza o plano do usuário no banco de dados
                await prisma.user.update({
                    where: { id: externalReference },
                    data: { plan: 'PAID' },
                });
                console.log(`Usuário ${externalReference} atualizado para o plano PAID.`);
            } else {
                console.log(`Pagamento não aprovado. Status: ${paymentStatus}`);
            }
        }

        // Resposta obrigatória para o Mercado Pago
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error('Erro no webhook do Mercado Pago:', error);
        // Em caso de erro, retornar 500 para que o MP tente novamente
        return NextResponse.json(
            { error: 'Erro interno do servidor ao processar webhook.' },
            { status: 500 }
        );
    }
}

