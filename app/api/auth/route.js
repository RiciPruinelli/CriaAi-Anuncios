import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { signToken } from '../../../lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;

    // AÇÃO DE REGISTRO
    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email e senha são obrigatórios' },
          { status: 400 }
        );
      }

      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }

      // Criptografar a senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar o novo usuário no banco de dados
      const user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          password: hashedPassword,
        }
      });

      // Gerar um token de autenticação
      const token = signToken({ 
        userId: user.id, 
        email: user.email,
        isAdmin: user.isAdmin 
      });

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    }

    // AÇÃO DE LOGIN
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email e senha são obrigatórios' },
          { status: 400 }
        );
      }

      // Buscar o usuário pelo email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Email ou senha inválidos' },
          { status: 401 }
        );
      }

      // Comparar a senha enviada com a senha criptografada no banco
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Email ou senha inválidos' },
          { status: 401 }
        );
      }

      // Gerar um token de autenticação
      const token = signToken({ 
        userId: user.id, 
        email: user.email,
        isAdmin: user.isAdmin 
      });

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    }

    // Se nenhuma ação válida foi fornecida
    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}