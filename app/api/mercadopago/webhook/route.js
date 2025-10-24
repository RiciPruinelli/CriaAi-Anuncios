<<<<<<< HEAD
// /app/api/mercadopago/webhook/route.js (CORRIGIDO - Configuração movida para runtime)
=======
// /app/api/mercadopago/webhook/route.js (Usa import normal, lógica a revisar para SDK V3)
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
import { NextResponse } from 'next/server';
// Importa o serviço que já tem a instância do cliente configurada
import mpService from '../../../../lib/mercadopago';
// O prisma é necessário se/quando a lógica de update for reativada
import prisma from '../../../../lib/prisma'; // Confirme o caminho

<<<<<<< HEAD
// A CONFIGURAÇÃO FOI MOVIDA DAQUI...

export async function POST(request) {
    // ...PARA CÁ!
    // Configuração do Mercado Pago (movida para runtime)
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (MP_ACCESS_TOKEN) {
        mercadopago.configure({
            access_token: MP_ACCESS_TOKEN,
        });
        console.log("==== Webhook MP: SDK configurado ===="); // Log
    } else {
         console.warn("==== Webhook MP: MP_ACCESS_TOKEN não configurado! ====");
         // Retorna erro 500 pois o webhook não pode funcionar sem o token
         return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 });
    }
    // FIM DA CONFIGURAÇÃO MOVIDA

    try {
        const body = await request.json();
        console.log("==== WEBHOOK MP RECEBIDO ====", JSON.stringify(body, null, 2)); // Log mais detalhado
=======
// A configuração da SDK agora é feita dentro do lib/mercadopago.js

export async function POST(request) {
    console.log("==== API Webhook MP: Requisição recebida ====");
    try {
        const body = await request.json();
        console.log("==== API WEBHOOK MP RECEBIDO ====", JSON.stringify(body, null, 2));
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)

        // Chama a função processWebhook do serviço para lidar com a lógica
        // (Lembre-se que a lógica interna dela precisa ser adaptada para SDK V3)
        await mpService.processWebhook(body);

<<<<<<< HEAD
        if (type === 'payment' && data && data.id) {
            const paymentId = data.id;
            console.log(`==== Webhook MP: Recebido evento de pagamento ID: ${paymentId} ===`);

            // Busca os detalhes do pagamento
            console.log(`==== Webhook MP: Buscando detalhes do pagamento ${paymentId}... ===`);
            const payment = await mercadopago.payment.get(paymentId);
            const paymentInfo = payment.body; // Acessa o corpo da resposta

            if (!paymentInfo) {
                console.error(`==== Webhook MP: Não foi possível obter detalhes do pagamento ${paymentId} ===`);
                // Retorna 500 para o MP tentar novamente
                return NextResponse.json({ error: 'Falha ao buscar detalhes do pagamento.' }, { status: 500 });
            }

            const paymentStatus = paymentInfo.status;
            const externalReference = paymentInfo.external_reference; // É o userId

            console.log(`==== Webhook MP: Pagamento ID: ${paymentId}, Status: ${paymentStatus}, User ID (External Ref): ${externalReference} ===`);

            if (paymentStatus === 'approved') {
                if (!externalReference) {
                     console.error(`==== Webhook MP: Pagamento ${paymentId} aprovado, mas sem external_reference (userId)! ===`);
                     // Retornar 200 OK para MP não reenviar, mas logar o erro gravemente
                     return NextResponse.json({ received: true, warning: "Missing external reference" }, { status: 200 });
                }

                // Atualiza o plano do usuário no banco de dados
                console.log(`==== Webhook MP: Atualizando usuário ${externalReference} para plano PAID... ===`);
                await prisma.user.update({
                    where: { id: externalReference },
                    data: { plan: 'PAID' }, // Certifique-se que 'PAID' é o valor correto no seu enum/schema Prisma
                });
                console.log(`==== Webhook MP: Usuário ${externalReference} atualizado para o plano PAID com sucesso. ===`);
            } else {
                console.log(`==== Webhook MP: Pagamento ${paymentId} não aprovado. Status: ${paymentStatus} ===`);
            }
        } else {
             console.log("==== Webhook MP: Evento recebido não é do tipo 'payment' ou falta data.id:", body);
        }

=======
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
        // Resposta obrigatória para o Mercado Pago confirmando recebimento
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
<<<<<<< HEAD
        console.error('==== Webhook MP: ERRO CRÍTICO no processamento ====', error);
        // Em caso de erro, retornar 500 para que o MP tente novamente
=======
        console.error('==== API Webhook MP: ERRO CRÍTICO no processamento ====', error);
        // Em caso de erro DENTRO da processWebhook (se ela lançar erro),
        // ou ao ler o body, retornar 500 para que o MP tente novamente
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
        return NextResponse.json(
            { error: 'Erro interno do servidor ao processar webhook.' },
            { status: 500 }
        );
    }
}

<<<<<<< HEAD
// Adiciona um handler GET básico para verificação de saúde ou testes simples
=======
// Handler GET básico
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
export async function GET() {
    return NextResponse.json({ message: "Webhook endpoint is active" }, { status: 200 });
}