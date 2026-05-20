import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid booking ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateBookingSchema.parse(body);

    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { allocation: true },
    });

    if (!bookingRequest) {
      return NextResponse.json({ success: false, message: 'Booking request not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.status === 'CANCELLED' && bookingRequest.status === 'CONFIRMED') {
        if (bookingRequest.allocation) {
          await tx.allocation.delete({
            where: { bookingRequestId: id },
          });
        }
        await tx.resource.update({
          where: { id: bookingRequest.resourceId },
          data: { status: 'AVAILABLE' },
        });
      }

      if (parsed.status === 'CONFIRMED' && bookingRequest.status !== 'CONFIRMED') {
        const resource = await tx.resource.findUnique({
          where: { id: bookingRequest.resourceId },
        });
        if (!resource || resource.status !== 'AVAILABLE') {
          throw new Error('Resource is not available for confirmation');
        }

        const allocation = await tx.allocation.create({
          data: {
            resourceId: bookingRequest.resourceId,
            bookingRequestId: id,
          },
        });

        await tx.resource.update({
          where: { id: bookingRequest.resourceId },
          data: { status: 'ALLOCATED' },
        });
      }

      return await tx.bookingRequest.update({
        where: { id },
        data: { status: parsed.status },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid booking ID' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id },
        include: { allocation: true },
      });

      if (!bookingRequest) {
        throw new Error('Booking request not found');
      }

      if (bookingRequest.allocation) {
        await tx.allocation.delete({
          where: { bookingRequestId: id },
        });
        await tx.resource.update({
          where: { id: bookingRequest.resourceId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.booking.deleteMany({
        where: { resourceId: bookingRequest.resourceId, userId: bookingRequest.userId },
      });

      await tx.bookingRequest.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete booking' }, { status: 500 });
  }
}
