// /app/api/mercadopago/webhook/route.js (Usa import normal, lógica a revisar para SDK V3)
import { NextResponse } from 'next/server';
// Importa o serviço que já tem a instância do cliente configurada
import mpService from '../../../../lib/mercadopago';
// O prisma é necessário se/quando a lógica de update for reativada
import prisma from '../../../../lib/prisma'; // Confirme o caminho

// A configuração da SDK agora é feita dentro do lib/mercadopago.js

export async function POST(request) {
    console.log("==== API Webhook MP: Requisição recebida ====");
    try {
        const body = await request.json();
        console.log("==== API WEBHOOK MP RECEBIDO ====", JSON.stringify(body, null, 2));

        // Chama a função processWebhook do serviço para lidar com a lógica
        // (Lembre-se que a lógica interna dela precisa ser adaptada para SDK V3)
        await mpService.processWebhook(body);

        // Resposta obrigatória para o Mercado Pago confirmando recebimento
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error('==== API Webhook MP: ERRO CRÍTICO no processamento ====', error);
        // Em caso de erro DENTRO da processWebhook (se ela lançar erro),
        // ou ao ler o body, retornar 500 para que o MP tente novamente
        return NextResponse.json(
            { error: 'Erro interno do servidor ao processar webhook.' },
            { status: 500 }
        );
    }
}

// Handler GET básico
export async function GET() {
    return NextResponse.json({ message: "Webhook endpoint is active" }, { status: 200 });
}