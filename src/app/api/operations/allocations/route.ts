import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  // RBAC checks for ADMIN and OPERATIONS roles
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const allocations = await prisma.allocation.findMany({
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            location: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
        bookingRequest: {
          select: {
            startTime: true,
            endTime: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { allocatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: any) {
    console.error('Fetch allocations error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch allocations' }, { status: 500 });
  }
}
