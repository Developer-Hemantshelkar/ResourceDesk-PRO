import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { recordAudit } from '@/middleware/audit';

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const userId = parseInt(token.id as string);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user session' }, { status: 400 });
    }

    const bookingRequests = await prisma.bookingRequest.findMany({
      where: { userId },
      include: {
        resource: {
          select: {
            name: true,
            location: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(bookingRequests);
  } catch (e: any) {
    console.error('Fetch booking requests error:', e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const userId = parseInt(token.id as string);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user session' }, { status: 400 });
    }

    const body = await request.json();
    const { resourceId, startTime, endTime } = body;

    if (!resourceId || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const resId = parseInt(resourceId);
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(resId) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid field formats' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ success: false, message: 'End time must be after start time' }, { status: 400 });
    }

    // Check resource existence and status
    const resource = await prisma.resource.findUnique({
      where: { id: resId },
    });

    if (!resource) {
      return NextResponse.json({ success: false, message: 'Resource not found' }, { status: 404 });
    }

    if (resource.status !== 'AVAILABLE') {
      return NextResponse.json({ success: false, message: 'Resource is currently not available' }, { status: 400 });
    }

    // Create the booking request
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        userId,
        resourceId: resId,
        startTime: start,
        endTime: end,
        status: 'PENDING',
      },
    });

    // Record audit log
    await recordAudit('BOOKING_CREATED', {
      entityId: bookingRequest.id,
      entityType: 'BookingRequest',
      details: { resourceId: resId, startTime, endTime },
      request,
    });

    return NextResponse.json({ success: true, bookingRequest });
  } catch (e: any) {
    console.error('Create booking request error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Internal server error' }, { status: 500 });
  }
}
