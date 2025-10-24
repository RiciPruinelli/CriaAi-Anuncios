// /app/api/remove-bg/route.js (CORRIGIDO - Import trocado para removeBackground)
import prisma from '../../../lib/prisma';
// CORREÇÃO: Importar a função correta
import { removeBackground } from '../../../lib/clipdrop';
import { supabaseAdmin } from '../../../lib/supabase'; // Certifique-se que lib/supabase.js existe e exporta supabaseAdmin corretamente configurado.

// Função auxiliar (mantida como estava)
function monthYearFromDate(d){
    const dt = new Date(d);
    return { month: dt.getUTCMonth()+1, year: dt.getUTCFullYear() }
}

export async function POST(req){
    try{
        const body = await req.json();
        const { imageBase64, filename, userId, adId } = body;

        if(!userId) return new Response(JSON.stringify({ error:'not authorized' }), { status:401 });

        // Lógica de limite (mantida como estava)
        const now = new Date();
        const { month, year } = monthYearFromDate(now);
        let limit = await prisma.usageLimit.findUnique({ where: { userId_month_year: { userId, month, year } } }).catch(()=>null);
        if(!limit){
            limit = await prisma.usageLimit.create({ data:{ userId, month, year, removalsCount:0 } });
        }
        if(limit.removalsCount >= 5) return new Response(JSON.stringify({ error:'monthly limit reached' }), { status:403 }); // O limite aqui parece fixo em 5, diferente do /lib/plans.js. Verificar se isso está correto.

        // CORREÇÃO: Chamar a função correta
        const processedBase64 = await removeBackground(imageBase64); // Chamada corrigida

        // Verifica se a remoção falhou (retornou null)
        if (!processedBase64) {
             console.error("Falha ao remover fundo via removeBackground.");
             // Decide o que fazer: retornar erro ou talvez salvar a original?
             // Por ora, vamos retornar um erro
             return new Response(JSON.stringify({ error:'background removal failed via service' }), { status:500 });
        }

        // Lógica de upload para Supabase (mantida como estava)
        // Certifique-se que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão nas variáveis de ambiente do Vercel
        const buffer = Buffer.from(processedBase64.replace(/^data:image\/\w+;base64,/, ''),'base64');
        const fileType = processedBase64.substring("data:image/".length, processedBase64.indexOf(";base64")) || 'png';
        const newFilename = filename ? filename.replace(/(\.[\w\d_-]+)$/i, `-nobg.$1`) : `image-nobg.${fileType}`; // Nomeia o arquivo
        const path = `uploads/${userId}/${Date.now()}-${newFilename}`;

        const { data, error } = await supabaseAdmin.storage.from('uploads').upload(path, buffer, {
            contentType: `image/${fileType}`, // Define o tipo de conteúdo corretamente
            upsert:false
        });

        if(error) {
            console.error("Supabase upload error:", error);
            return new Response(JSON.stringify({ error: error.message }), { status:500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage.from('uploads').getPublicUrl(path);
        const publicUrl = publicUrlData.publicUrl;

        // Salvar no Prisma (mantido como estava)
        if(process.env.DATABASE_URL && adId){
            await prisma.image.create({
                data:{
                    adId,
                    url: publicUrl,
                    backgroundRemoved:true
                }
            });
        }

        // Atualizar limite (mantido como estava)
        await prisma.usageLimit.update({
            where:{ id: limit.id },
            data:{ removalsCount: limit.removalsCount + 1 }
        });

        return new Response(JSON.stringify({ url: publicUrl }), { status:200 });

    } catch(e){
        console.error("Erro na API /remove-bg:", e);
        return new Response(JSON.stringify({ error:'remove failed' }), { status:500 });
    }
}