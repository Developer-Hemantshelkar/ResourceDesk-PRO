import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const bookings = await prisma.bookingRequest.findMany({
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            capacity: true,
            location: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        allocation: {
          select: {
            id: true,
            allocatedAt: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}
