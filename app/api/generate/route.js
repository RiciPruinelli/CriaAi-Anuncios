// /app/api/generate/route.js (Versão Final - Usando OpenAI)
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import openaiService from '../../../lib/openai'; // Importa o novo serviço OpenAI
import prisma from '../../../lib/prisma'; // Necessário para a busca inicial do usuário

export async function POST(request) {
  console.log("\n==== GENERATE_API (OpenAI): [POST] Requisição recebida ====");
  try {
    console.log("==== GENERATE_API (OpenAI): [POST] Tentando obter usuário...");
    const authUser = await getUserFromRequest(request);

    // LOG CRÍTICO
    console.log("==== GENERATE_API (OpenAI): [POST] Resultado de getUserFromRequest:", authUser ? { id: authUser.id } : "NULL");

    if (!authUser || !authUser.id) { // Verifica se authUser e authUser.id existem
      console.log("==== GENERATE_API (OpenAI): [POST] FALHA na autenticação.");
      return NextResponse.json({ error: 'Não autenticado ou falha ao obter ID' }, { status: 401 });
    }
    console.log("==== GENERATE_API (OpenAI): [POST] Autenticação OK. User ID:", authUser.id);

    // Busca o usuário completo novamente SÓ se precisar de campos extras
    // que não estão no authUser retornado por getUserFromRequest.
    // Se getUserFromRequest já retorna tudo (incluindo limites de BG), esta busca é redundante.
    // Vamos assumir que authUser já tem tudo por enquanto.
    const userForLogic = authUser; // Usamos diretamente o resultado da autenticação

    const body = await request.json();
    console.log("==== GENERATE_API (OpenAI): [POST] Corpo recebido:", body.title);

    console.log("==== GENERATE_API (OpenAI): [POST] Chamando openaiService.generateAndSaveAd...");
    const result = await openaiService.generateAndSaveAd(body, userForLogic); // Passa o usuário completo
    console.log("==== GENERATE_API (OpenAI): [POST] openaiService completado.");

    return NextResponse.json({
      success: true,
      generation: result.generation
    });

  } catch (error) {
    console.error('==== GENERATE_API (OpenAI): [POST] ERRO CRÍTICO:', error);
    if (error.code) console.error("==== GENERATE_API (OpenAI): [POST] Erro Prisma:", { code: error.code, meta: error.meta });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}