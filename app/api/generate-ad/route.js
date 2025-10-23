import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'devsecret'

export async function POST(req){
  try{
    const token = req.headers.get('authorization') || ''
    const payload = jwt.verify(token, JWT_SECRET)
    const userId = payload.sub
    const body = await req.json()
    const title = body.title || 'Anúncio'
    const text = body.text || 'Anúncio gerado'
    let generatedText = text
    if(process.env.GEMINI_API_KEY && process.env.GEMINI_API_URL){
      try{
        const gres = await fetch(process.env.GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + process.env.GEMINI_API_KEY }, body: JSON.stringify({ prompt: text, temperature: 0.2 }) })
        if(gres.ok){
          const j = await gres.json()
          generatedText = j?.candidates?.[0]?.content?.[0]?.text || j?.output?.[0]?.content?.text || JSON.stringify(j)
        }
      }catch(e){}
    }
    const ad = await prisma.ad.create({ data: { title, text: generatedText, ownerId: userId } })
    return NextResponse.json(ad)
  }catch(e){
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
}
