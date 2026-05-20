import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pending = await prisma.bookingRequest.findMany({
      where: { status: 'PENDING' },
      include: { resource: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(pending);
  } catch (e) {
    console.error('Failed to fetch pending booking requests', e);
    return NextResponse.json({ error: 'Unable to fetch pending requests' }, { status: 500 });
  }
}
