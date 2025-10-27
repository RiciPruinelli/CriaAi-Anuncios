export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { signToken } from '../../../lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;

    // REGISTRO
    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          password: hashedPassword,
        },
      });

      const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
      return NextResponse.json({ success: true, token, user });
    }

    // LOGIN
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 });
      }

      const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
      return NextResponse.json({ success: true, token, user });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
