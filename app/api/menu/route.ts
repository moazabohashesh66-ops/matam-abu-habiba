import { NextResponse } from 'next/server';
import { menuData } from '@/data/menuData';

export async function GET() {
  return NextResponse.json(menuData);
}
