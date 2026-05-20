import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

const updateResourceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  locationId: z.number().int().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'INACTIVE']).optional(),
});

type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

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
    return NextResponse.json({ success: false, message: 'Invalid resource ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateResourceSchema.parse(body) as UpdateResourceInput;

    const data: any = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.capacity !== undefined) data.capacity = parsed.capacity;
    if (parsed.locationId !== undefined) data.locationId = parsed.locationId;
    if (parsed.categoryId !== undefined) data.categoryId = parsed.categoryId;
    if (parsed.status !== undefined) data.status = parsed.status;

    const updated = await prisma.resource.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Invalid input';
    return NextResponse.json({ success: false, message }, { status: 400 });
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
    return NextResponse.json({ success: false, message: 'Invalid resource ID' }, { status: 400 });
  }

  try {
    const activeAllocs = await prisma.allocation.count({
      where: { resourceId: id },
    });

    if (activeAllocs > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete resource with active allocations. Release allocations first.',
      }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { resourceId: id } }),
      prisma.bookingRequest.deleteMany({ where: { resourceId: id } }),
      prisma.resource.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete resource' }, { status: 500 });
  }
}
