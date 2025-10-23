// /lib/gemini.js (VERSÃO FINAL - SDK ATUALIZADA E CHAMADA SIMPLIFICADA)
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from './prisma';
import { canUserRemoveBackground, removeBackground } from './clipdrop'; // Mantemos caso precise no futuro

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.warn("❌ GEMINI_API_KEY não configurada no .env."); }
// Mesmo que a chave esteja ausente, inicializamos para evitar erros de importação
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-if-not-set');

function createProfessionalPrompt(title, description, tone) {
    // Usamos o prompt profissional completo
    return `
      **PERSONA:** Você é um especialista sênior em marketing digital...
      **PRODUTO:**
      - **Nome:** ${title}
      - **Detalhes Fornecidos:** ${description || 'Nenhum detalhe adicional fornecido.'}
      **TOM DE VOZ:** ${tone || 'Profissional'}
      **ANÁLISE VISUAL OBRIGATÓRIA:** Se imagens forem fornecidas... (NOTA: NESTA VERSÃO, NÃO ENVIAREMOS IMAGENS)
      **INSTRUÇÕES DETALHADAS PARA CADA PLATAFORMA:**
      1.  **INSTAGRAM:** ...
      2.  **FACEBOOK:** ...
      3.  **MARKETPLACE (SEO):** ...
      4.  **HASHTAGS:** ...
      **FORMATO DE SAÍDA OBRIGATÓRIO:** Retorne sua resposta como um objeto JSON válido...
    `;
}

const geminiService = {
  generateAndSaveAd: async (data, authUser) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Chave da API do Gemini não configurada.");
    }

    // Ignoramos images e removeBg por enquanto
    const { title, description, tone, images, removeBg } = data; // Recebemos, mas não usamos images/removeBg

    if (!title) { throw new Error('Nome do produto é obrigatório'); }

    // Usando o modelo gemini-pro (APENAS TEXTO)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = createProfessionalPrompt(title, description, tone);

    // CHAMADA SIMPLIFICADA: Enviamos apenas a string do prompt
    console.log("==== geminiService: Enviando prompt (TEXTO SIMPLES) para gemini-pro ====");
    const result = await model.generateContent(prompt); // <<--- CHAMADA SIMPLIFICADA
    const response = await result.response;
    const text = response.text();
    console.log("==== geminiService: Resposta recebida da IA:", text.substring(0, 100) + "...");

    let adContent;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { throw new Error("A IA não retornou um JSON válido."); }
        adContent = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Erro ao analisar JSON da IA:", text);
        throw new Error("A IA retornou uma resposta em um formato inválido.");
    }

    // Lógica de remoção de fundo (será ignorada se removeBg for false ou images vazio)
    let bgRemovedImageUrl = null;
    if (removeBg && images && images.length > 0) {
        const bgCheck = canUserRemoveBackground(authUser);
        if (bgCheck.canRemove) {
           try {
               console.log("==== geminiService: Tentando remover fundo da imagem 0...");
               bgRemovedImageUrl = await removeBackground(images[0]);
               const updateData = bgCheck.needsReset ? { bgRemovalUsesThisMonth: 1, lastBgRemovalReset: new Date() } : { bgRemovalUsesThisMonth: { increment: 1 } };
               await prisma.user.update({ where: { id: authUser.id }, data: updateData });
               console.log("==== geminiService: Remoção de fundo concluída.");
           } catch (error) {
               console.error('==== geminiService: Erro ao remover fundo:', error);
               // Não lançar erro, apenas logar
           }
        } else {
             console.log("==== geminiService: Limite de remoção de fundo atingido, pulando.");
        }
    }


    // Salvar no banco
    console.log("==== geminiService: Salvando geração no banco...");
    const generation = await prisma.generation.create({
        data: {
            title,
            description: description || '',
            tone: tone || 'Profissional',
            images: images || [], // Salva as imagens originais
            bgRemovedImageUrl, // Salva URL da imagem sem fundo (se houver)
            resultInstagram: adContent.instagram || '',
            resultFacebook: adContent.facebook || '',
            resultMarketplace: adContent.marketplace || '',
            hashtags: adContent.hashtags || '',
            userId: authUser.id
        }
    });
    console.log("==== geminiService: Geração salva com ID:", generation.id);

    return {
        generation: {
            id: generation.id,
            title: generation.title,
            resultInstagram: generation.resultInstagram,
            resultFacebook: generation.resultFacebook,
            resultMarketplace: generation.resultMarketplace,
            hashtags: generation.hashtags,
            bgRemovedImageUrl: generation.bgRemovedImageUrl,
            createdAt: generation.createdAt
        }
    };
  }
};

export default geminiService;