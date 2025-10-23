import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'devsecret'

export async function POST(req){
  const body = await req.json()
  const { email, password } = body
  const user = await prisma.user.findUnique({ where: { email } })
  if(!user) return NextResponse.json({ error: 'invalid' }, { status: 401 })
  const ok = await bcrypt.compare(password, user.password)
  if(!ok) return NextResponse.json({ error: 'invalid' }, { status: 401 })
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  return NextResponse.json({ token })
}
