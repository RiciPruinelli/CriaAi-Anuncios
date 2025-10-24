<<<<<<< HEAD
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
=======
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
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
            email: authUser.email,
        };
        console.log("==== API Mercado Pago Checkout: Dados do usuário para checkout:", user);

<<<<<<< HEAD
        // 2. Cria a preferência de pagamento
        console.log("==== API Mercado Pago Checkout: Chamando mpService.createPreference... ====");
        const checkoutUrl = await mpService.createPreference(user);
        console.log("==== API Mercado Pago Checkout: URL de checkout recebido:", checkoutUrl);

        if (!checkoutUrl) {
           console.error("==== API Mercado Pago Checkout: createPreference retornou URL nulo ou vazio ====");
           throw new Error("Não foi possível obter o URL de checkout.");
        }
=======
        console.log("==== API Mercado Pago Checkout: Chamando mpService.createPreference... ====");
        const checkoutUrl = await mpService.createPreference(user);
        console.log("==== API Mercado Pago Checkout: URL de checkout recebido:", checkoutUrl);
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)

        // A verificação de URL nulo agora é feita dentro do mpService
        return NextResponse.json({ checkoutUrl });

    } catch (error) {
<<<<<<< HEAD
        console.error('==== API Mercado Pago Checkout: ERRO CRÍTICO ====', error);
=======
        console.error('==== API Mercado Pago Checkout: ERRO CRÍTICO ====', error?.message, error?.cause);
        // Retorna a mensagem de erro específica que veio do mpService
>>>>>>> 656b9db (fix: Ajusta Mercado Pago SDK e finaliza correções)
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor ao iniciar o checkout.' },
            { status: 500 }
        );
    }
}