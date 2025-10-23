// /app/api/history/route.js
import { NextResponse } from 'next/server'; // Usando import
import prisma from '../../../lib/prisma'; // Usando import
import { getUserFromRequest } from '../../../lib/auth'; // Usando import

// Usando export function
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request); // getUserFromRequest é async
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ generations });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar histórico' },
      { status: 500 }
    );
  }
}