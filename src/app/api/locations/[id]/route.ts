import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid location ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, address } = body;
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { name, address },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid location ID' }, { status: 400 });
  }

  try {
    // Prevent deletion if resources are linked to prevent unallocated states in this dashboard.
    const resourceCount = await prisma.resource.count({
      where: { locationId: id },
    });

    if (resourceCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Cannot delete location because it is linked to ${resourceCount} active resource(s).`,
      }, { status: 400 });
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete location' }, { status: 500 });
  }
}
