// /app/api/user/info/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth'; // Usando caminho relativo correto
import prisma from '../../../../lib/prisma'; // Usando caminho relativo correto
import { getPlanLimits } from '../../../../lib/plans';

export async function GET(request) {
  try {
    // 1. Tenta obter o usuário autenticado a partir do token na requisição
    const user = await getUserFromRequest(request);

    // 2. Se não houver usuário (token inválido ou ausente), retorna erro 401
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 3. Busca os dados mais recentes do usuário no banco (importante para o limite)
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { // Seleciona apenas os campos necessários para segurança e performance
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        bgRemovalUsesThisMonth: true,
        lastBgRemovalReset: true,
        textGenerationUsesThisMonth: true,
        lastTextGenerationReset: true,
        plan: true,
        createdAt: true,
      }
    });

    if (!freshUser) {
        return NextResponse.json({ error: 'Usuário não encontrado no banco de dados' }, { status: 404 });
    }

    // 4. Retorna os dados do usuário com sucesso, incluindo os limites do plano
    const limits = getPlanLimits(freshUser.plan);
    return NextResponse.json({ user: freshUser, limits });

  } catch (error) {
    console.error('Erro na rota /api/user/info:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar informações do usuário' },
      { status: 500 }
    );
  }
}