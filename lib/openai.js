// /lib/openai.js (CORRIGIDO com 1 texto para FREE, 2 para PAID)
import OpenAI from 'openai';
import prisma from './prisma';
import { removeBackground, canUserRemoveBackground } from './clipdrop';
import { getPlanLimits } from './plans';
import toast from 'react-hot-toast'; 

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { console.warn("❌ OPENAI_API_KEY não configurada."); }
const openai = new OpenAI({ apiKey: apiKey || 'dummy' });

// FUNÇÃO ATUALIZADA: Agora recebe 'userPlan'
function createOpenAIPrompt(title, description, tone, userPlan) {
    const isPremium = userPlan === 'PAID'; // Verifica se o plano é PAGO

    let systemPrompt;
    let userPrompt;

    if (isPremium) {
      // Prompt para Plano Premium (Pede Opção 1 e Opção 2)
      systemPrompt = `Você é um copywriter expert em marketing digital. Sua tarefa é criar conteúdo para anúncios. Retorne APENAS um objeto JSON válido com as chaves: "instagram_op1", "instagram_op2", "facebook_op1", "facebook_op2", "marketplace_op1", "marketplace_op2", "hashtags". Preencha TODAS as chaves com texto relevante.`;
      userPrompt = `
        Crie conteúdo para o produto "${title}" (${description || 'sem detalhes adicionais'}) com tom de voz "${tone || 'Profissional'}".
        Gere duas opções de conteúdo (op1 e op2) para cada plataforma:
        1. instagram_op1 e instagram_op2: Legenda curta (~150 chars), emojis, CTA.
        2. facebook_op1 e facebook_op2: Texto médio (~250 chars), benefícios (problema-solução).
        3. marketplace_op1 e marketplace_op2: Descrição SEO (título completo, características em tópicos).
        4. hashtags: Lista (10-15) separadas por espaço.
        Responda APENAS com o JSON.
      `;
    } else {
      // Prompt para Plano Grátis (Pede APENAS Opção 1)
      systemPrompt = `Você é um copywriter expert em marketing digital. Sua tarefa é criar conteúdo para anúncios. Retorne APENAS um objeto JSON válido com as chaves: "instagram_op1", "facebook_op1", "marketplace_op1", "hashtags". Preencha TODAS as chaves com texto relevante.`;
      userPrompt = `
        Crie conteúdo para o produto "${title}" (${description || 'sem detalhes adicionais'}) com tom de voz "${tone || 'Profissional'}".
        Gere UMA opção de conteúdo para cada plataforma:
        1. instagram_op1: Legenda curta (~150 chars), emojis, CTA.
        2. facebook_op1: Texto médio (~250 chars), benefícios (problema-solução).
        3. marketplace_op1: Descrição SEO (título completo, características em tópicos).
        4. hashtags: Lista (10-15) separadas por espaço.
        Responda APENAS com o JSON.
      `;
    }
    
    return { systemPrompt, userPrompt };
}

const openaiService = {
  generateAndSaveAd: async (data, authUser) => {
    if (!process.env.OPENAI_API_KEY) { throw new Error("Chave da API OpenAI não configurada."); }
    const { title, description, tone, images, removeBg } = data;
    if (!title) { throw new Error('Nome do produto obrigatório.'); }

    // 1. Lógica de Limite de Geração de Texto (Já estava correta)
    const limits = getPlanLimits(authUser.plan);
    const maxTextGenerations = limits.text_generations;

    if (maxTextGenerations !== Infinity) {
        const now = new Date();
        const lastReset = authUser.lastTextGenerationReset ? new Date(authUser.lastTextGenerationReset) : new Date(0);
        let usedThisMonth = authUser.textGenerationUsesThisMonth || 0;
        let needsTextReset = now.getFullYear() > lastReset.getFullYear() || (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
        
        if (needsTextReset) {
            usedThisMonth = 0;
        }

        if (usedThisMonth >= maxTextGenerations) {
            throw new Error(`Limite de geração de texto atingido (${maxTextGenerations} por mês). Assine o plano Premium para gerar ilimitadamente.`);
        }
    }

    // 2. Lógica de Remoção de Fundo (Já estava correta)
    let bgRemovedImageUrl = null;
    if (removeBg && images && images.length > 0) {
        const bgCheck = canUserRemoveBackground(authUser);
        if (!bgCheck.canRemove) {
            console.warn("==== openaiService: Limite MENSAL de remoção de fundo atingido. Pulando.");
        } else if (removeBg && images.length > limits.bg_removals_per_generation) {
            console.warn(`==== openaiService: Limite de remoção de fundo por geração atingido (${limits.bg_removals_per_generation}). Pulando.`);
        } else {
          try {
              console.log("==== openaiService: Tentando remover fundo...");
              bgRemovedImageUrl = await removeBackground(images[0]);
              if (bgRemovedImageUrl) { 
                const updateData = bgCheck.needsReset ? { bgRemovalUsesThisMonth: 1, lastBgRemovalReset: new Date() } : { bgRemovalUsesThisMonth: { increment: 1 } };
                await prisma.user.update({ where: { id: authUser.id }, data: updateData });
                console.log("==== openaiService: Remoção de fundo OK e contador atualizado.");
              } else {
                console.warn("==== openaiService: removeBackground retornou null, não atualizando contador.");
              }
          } catch (error) {
              console.error('==== openaiService: Erro ao remover fundo:', error.message);
          }
        }
    }

    // 3. Geração de Texto (AGORA CHAMA A FUNÇÃO ATUALIZADA)
    // Passa o 'authUser.plan' para a função
    const { systemPrompt, userPrompt } = createOpenAIPrompt(title, description, tone, authUser.plan);
    
    const userMessageContent = [{ type: "text", text: userPrompt }];
    if (images && images.length > 0) {
        images.slice(0, 1).forEach(imgBase64 => {
            if (typeof imgBase64 === 'string' && imgBase64.startsWith('data:image')) {
                userMessageContent.push({ type: "image_url", image_url: { "url": imgBase64, "detail": "low" } });
            }
        });
    }

    console.log("==== openaiService: Enviando request para gpt-4o-mini...");
    let response;
    try {
        response = await openai.chat.completions.create({
            model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt },{ role: "user", content: userMessageContent }],
            response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 1000,
        });
    } catch (apiError) { throw new Error(`Erro ao chamar a API OpenAI: ${apiError.message}`); }
    console.log("==== openaiService: Resposta da OpenAI recebida.");

    const jsonResult = response?.choices?.[0]?.message?.content;
    if (!jsonResult) { throw new Error("A API da OpenAI não retornou conteúdo."); }

    let adContent;
    try { adContent = JSON.parse(jsonResult); } catch (e) { throw new Error("A IA retornou JSON inválido."); }

    // 4. Atualiza contadores (Já estava correto)
    console.log("==== openaiService: Salvando geração no banco...");
    const updateData = {};
    if (maxTextGenerations !== Infinity) {
        const now = new Date();
        const lastReset = authUser.lastTextGenerationReset ? new Date(authUser.lastTextGenerationReset) : new Date(0);
        let needsTextReset = now.getFullYear() > lastReset.getFullYear() || (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
        
        if (needsTextReset) {
            updateData.textGenerationUsesThisMonth = 1;
            updateData.lastTextGenerationReset = now;
        } else {
            updateData.textGenerationUsesThisMonth = { increment: 1 };
        }
    }

    if (Object.keys(updateData).length > 0) {
        await prisma.user.update({ where: { id: authUser.id }, data: updateData });
        console.log("==== openaiService: Contadores de uso de texto atualizados.");
    }

    // 5. Salva no Banco (Já estava correto)
    // Os campos _op2 virão como 'undefined' da IA (se for plano free)
    // e o Prisma salvará 'null' no banco, o que é perfeito.
    const generation = await prisma.generation.create({
        data: {
            title, description: description || '', tone: tone || 'Profissional',
            images: images || [], bgRemovedImageUrl,
            resultInstagramOp1: adContent.instagram_op1 || null,
            resultInstagramOp2: adContent.instagram_op2 || null, // Será null se for free
            resultFacebookOp1: adContent.facebook_op1 || null,
            resultFacebookOp2: adContent.facebook_op2 || null, // Será null se for free
            resultMarketplaceOp1: adContent.marketplace_op1 || null,
            resultMarketplaceOp2: adContent.marketplace_op2 || null, // Será null se for free
            hashtags: adContent.hashtags || null,
            userId: authUser.id
        }
    });

    // O frontend (app/dashboard/page.js) já tem a lógica de só mostrar
    // o card "OPÇÃO 2" se o valor não for 'null', então você não
    // precisa mudar nada no frontend.
    return {
        generation: {
            id: generation.id, title: generation.title,
            resultInstagramOp1: generation.resultInstagramOp1, resultInstagramOp2: generation.resultInstagramOp2,
            resultFacebookOp1: generation.resultFacebookOp1, resultFacebookOp2: generation.resultFacebookOp2,
            resultMarketplaceOp1: generation.resultMarketplaceOp1, resultMarketplaceOp2: generation.resultMarketplaceOp2,
            hashtags: generation.hashtags,
            bgRemovedImageUrl: generation.bgRemovedImageUrl, createdAt: generation.createdAt
        }
    };
  }
};
export default openaiService;