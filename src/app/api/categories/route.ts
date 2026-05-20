import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, description },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create category' }, { status: 500 });
  }
}
