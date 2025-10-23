// /lib/clipdrop.js (Versão FINALÍSSIMA - Axios COM getHeaders)
import FormData from 'form-data';
import axios from 'axios';
import { getPlanLimits } from './plans';

export async function removeBackground(imageBase64) {
  console.log("==== clipdropService: Iniciando remoção de fundo (Axios COM getHeaders) ====");
  try {
    const apiKey = process.env.CLIPDROP_API_KEY;
    if (!apiKey) { throw new Error('CLIPDROP_API_KEY não configurada.'); }
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image')) {
      throw new Error('Formato inválido de imagem base64.');
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const filename = `image.${mimeType.split('/')[1] || 'png'}`;

    const form = new FormData();
    form.append('image_file', imageBuffer, { filename, contentType: mimeType });

    console.log("==== clipdropService: Enviando requisição para ClipDrop API via Axios...");
    const response = await axios.post('https://clipdrop-api.co/remove-background/v1', form, {
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders(), // ESSENCIAL para 'form-data' no Node.js
      },
      responseType: 'arraybuffer', timeout: 15000
    });
    console.log("==== clipdropService: Resposta recebida. Status:", response.status);

    if (response.status !== 200) {
        let errorText = 'Erro desconhecido';
        try {
             errorText = Buffer.from(response.data).toString('utf-8');
             try { errorText = JSON.stringify(JSON.parse(errorText)); } catch(e){}
        } catch(e){ errorText = response.data || errorText; }
      console.error("==== clipdropService: Erro da API (Axios):", errorText);
      throw new Error(`Erro da API ClipDrop: ${response.status} - ${errorText}`);
    }

    const resultBuffer = response.data;
    const base64Result = Buffer.from(resultBuffer).toString('base64');
    console.log("==== clipdropService: Remoção de fundo concluída.");
    return `data:image/png;base64,${base64Result}`;

  } catch (error) {
    let errorDetails = error.message;
    if (error.response) {
      try {
        errorDetails = Buffer.from(error.response.data).toString('utf-8');
        // Tenta formatar como JSON se for um JSON string
        try { errorDetails = JSON.stringify(JSON.parse(errorDetails)); } catch(e){}
      } catch (e) {
        errorDetails = 'Não foi possível decodificar a mensagem de erro da API.';
      }
    } else if (error.request) {
        errorDetails = "A requisição foi enviada mas nenhuma resposta foi recebida.";
    }
    console.error('==== clipdropService: Erro CRÍTICO ao remover fundo:', errorDetails);
    console.warn("==== clipdropService: Falha na remoção. Geração continuará sem imagem processada.");
    return null; // Retorna null para indicar falha
  }
}

export function canUserRemoveBackground(user) {
  if (!user || typeof user.bgRemovalUsesThisMonth === 'undefined' || typeof user.lastBgRemovalReset === 'undefined' || !user.plan) {
      console.error("==== clipdropService: [canUserRemoveBackground] Objeto 'user' inválido:", user);
      return { canRemove: false, needsReset: false, remaining: 0 };
  }
  const now = new Date();
  const lastReset = user.lastBgRemovalReset ? new Date(user.lastBgRemovalReset) : new Date(0);
  const usedThisMonth = user.bgRemovalUsesThisMonth || 0;
  const limits = getPlanLimits(user.plan);
  const maxMonthly = limits.bg_removals_monthly;

  if (maxMonthly === Infinity) {
    return { canRemove: true, needsReset: false, remaining: Infinity };
  }
  const needsReset = now.getFullYear() > lastReset.getFullYear() || (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
  if (needsReset) {
    console.log(`==== clipdropService: [canUserRemoveBackground] Reset de limite. Novo limite: ${maxMonthly}`);
    return { canRemove: true, needsReset: true, remaining: maxMonthly };
  } else {
    const remaining = maxMonthly - usedThisMonth;
    const canRemove = remaining > 0;
    console.log(`==== clipdropService: [canUserRemoveBackground] Limite atual: ${usedThisMonth}/${maxMonthly}. Restantes: ${remaining}. Pode remover: ${canRemove}`);
    return { canRemove: canRemove, needsReset: false, remaining: Math.max(0, remaining) };
  }
}