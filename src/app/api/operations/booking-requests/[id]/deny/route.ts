import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Auth check
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await params;
  const bookingRequestId = parseInt(resolvedParams.id);
  if (isNaN(bookingRequestId)) {
    return NextResponse.json({ success: false, message: 'Invalid booking request ID' }, { status: 400 });
  }

  try {
    const booking = await prisma.bookingRequest.findUnique({ where: { id: bookingRequestId } });
    if (!booking) throw new Error('Booking request not found');
    if (booking.status !== 'PENDING') throw new Error('Booking request not pending');

    await prisma.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error('Deny error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Server error' }, { status: 500 });
  }
}
