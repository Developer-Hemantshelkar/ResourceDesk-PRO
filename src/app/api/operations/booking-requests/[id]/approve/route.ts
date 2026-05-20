import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';

const approveSchema = z.object({
  resourceId: z.string().min(1),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time' }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time' }),
}).refine((data) => {
  const start = Date.parse(data.startTime);
  const end = Date.parse(data.endTime);
  return end > start;
}, {
  message: 'End after start',
  path: ['endTime'],
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Ensure user is authenticated and has OPERATIONS or ADMIN role
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

  const body = await request.json();
  const parseResult = approveSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ success: false, errors: parseResult.error.format() }, { status: 400 });
  }
  const { resourceId, startTime, endTime } = parseResult.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify booking request exists and is pending
      const booking = await tx.bookingRequest.findUnique({
        where: { id: bookingRequestId },
        include: { resource: true, user: true },
      });
      if (!booking) throw new Error('Booking request not found');
      if (booking.status !== 'PENDING') throw new Error('Booking request not pending');

      // Verify the resource is AVAILABLE
      const resource = await tx.resource.findUnique({ where: { id: parseInt(resourceId) } });
      if (!resource) throw new Error('Resource not found');
      if (resource.status !== 'AVAILABLE') throw new Error('Resource not available');

      // Create Allocation
      const allocation = await tx.allocation.create({
        data: {
          resourceId: resource.id,
          bookingRequestId: booking.id,
        },
      });

      // Update BookingRequest status to CONFIRMED and link allocation
      await tx.bookingRequest.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', allocation: { connect: { id: allocation.id } } },
      });

      // Update Resource status to ALLOCATED
      await tx.resource.update({
        where: { id: resource.id },
        data: { status: 'ALLOCATED' },
      });

      return allocation;
    });

    return NextResponse.json({ success: true, allocationId: result.id }, { status: 200 });
  } catch (e: any) {
    console.error('Approve error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Server error' }, { status: 500 });
  }
}
