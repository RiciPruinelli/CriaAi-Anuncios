import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(req){
  const body = await req.json()
  const { email, password } = body
  if(!email || !password) return NextResponse.json({ error: 'missing' }, { status: 400 })
  const hashed = await bcrypt.hash(password, 10)
  try{
    const user = await prisma.user.create({ data: { email, password: hashed } })
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  }catch(e){
    return NextResponse.json({ error: 'exists' }, { status: 400 })
  }
}
