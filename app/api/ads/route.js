export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(req){
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(ads)
}
