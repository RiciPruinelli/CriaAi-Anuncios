// /lib/auth.js (COM DEPURAÇÃO DETALHADA)
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;
console.log("---- AUTH_LIB: JWT_SECRET carregado:", JWT_SECRET ? 'SIM' : 'NÃO!!! (Verifique .env)');

export function signToken(payload) {
  if (!JWT_SECRET) { throw new Error("JWT_SECRET não definida."); }
  if (!payload || !payload.userId) { throw new Error("Payload inválido para signToken: userId é obrigatório."); }
  console.log("---- AUTH_LIB: [signToken] Assinando token para payload:", payload);
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  console.log("---- AUTH_LIB: [signToken] Token gerado:", token ? 'Sim (parcialmente oculto)' : 'NÃO');
  return token;
}

export function verifyToken(token) {
  console.log("---- AUTH_LIB: [verifyToken] Tentando verificar token...");
  if (!JWT_SECRET || !token) {
    console.log("---- AUTH_LIB: [verifyToken] FALHA - Sem segredo ou token.");
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("---- AUTH_LIB: [verifyToken] SUCESSO. Decodificado:", decoded);
    return decoded;
  } catch (error) {
    console.error("---- AUTH_LIB: [verifyToken] ERRO:", error.message);
    return null;
  }
}

export async function getUserFromRequest(request) {
  console.log("\n---- AUTH_LIB: [getUserFromRequest] INICIADO ----");
  try {
    const authHeader = request.headers.get('authorization');
    console.log("---- AUTH_LIB: [getUserFromRequest] Cabeçalho Authorization:", authHeader ? authHeader.substring(0, 15) + '...' : 'NÃO ENCONTRADO');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("---- AUTH_LIB: [getUserFromRequest] Cabeçalho inválido ou ausente. Retornando null.");
      return null;
    }

    const token = authHeader.substring(7);
    console.log("---- AUTH_LIB: [getUserFromRequest] Token extraído:", token ? 'Sim (parcialmente oculto)' : 'NÃO');
    if (!token) {
      console.log("---- AUTH_LIB: [getUserFromRequest] Falha ao extrair token. Retornando null.");
      return null;
    }

    const decoded = verifyToken(token); // verifyToken já tem logs internos

    if (!decoded || !decoded.userId) {
      console.warn("---- AUTH_LIB: [getUserFromRequest] Token inválido ou sem userId após decodificação. Decodificado:", decoded, ". Retornando null.");
      return null;
    }
    console.log("---- AUTH_LIB: [getUserFromRequest] Token decodificado contém userId:", decoded.userId);

    console.log("---- AUTH_LIB: [getUserFromRequest] Buscando usuário no DB com ID:", decoded.userId);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user) {
      console.log("---- AUTH_LIB: [getUserFromRequest] Usuário encontrado no DB:", { id: user.id, email: user.email });
    } else {
      console.log("---- AUTH_LIB: [getUserFromRequest] Usuário NÃO encontrado no DB para ID:", decoded.userId);
    }
    console.log("---- AUTH_LIB: [getUserFromRequest] FINALIZADO. Retornando usuário:", user ? { id: user.id } : null);
    return user;

  } catch (error) {
    console.error('---- AUTH_LIB: [getUserFromRequest] ERRO CRÍTICO:', error);
    return null;
  }
}