import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { recordAudit } from '@/middleware/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });

  const userId = parseInt(token.id as string);
  const resolvedParams = await params;
  const requestId = parseInt(resolvedParams.id);
  
  if (isNaN(userId) || isNaN(requestId)) {
    return NextResponse.json({ success: false, message: 'Invalid identifiers' }, { status: 400 });
  }

  try {
    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id: requestId },
    });

    if (!bookingRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    if (bookingRequest.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only cancel your own requests' }, { status: 403 });
    }

    if (bookingRequest.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Only pending requests can be cancelled' }, { status: 400 });
    }

    // Cancel the request
    const updated = await prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await recordAudit('BOOKING_DENIED', {
      entityId: requestId,
      entityType: 'BookingRequest',
      details: { reason: 'Cancelled by member' },
      request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
