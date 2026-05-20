import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// Zod validation for updates (same schema as creation)
import { z } from 'zod';
const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ROOM', 'EQUIPMENT', 'VEHICLE']),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE']),
});

// Helper to enforce RBAC (ADMIN or OPERATIONS)
async function enforceRBAC(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new NextResponse(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) {
    return new NextResponse(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }
  return null; // authorized
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // RBAC
  const rbac = await enforceRBAC(request);
  if (rbac) return rbac;

  const resolvedParams = await params;
  const resourceId = parseInt(resolvedParams.id);
  if (isNaN(resourceId)) {
    return NextResponse.json({ message: 'Invalid resource ID' }, { status: 400 });
  }

  const body = await request.json();
  const parse = resourceSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ errors: parse.error.format() }, { status: 400 });
  }

  try {
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: parse.data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Failed to update resource', e);
    return NextResponse.json({ message: e.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // RBAC
  const rbac = await enforceRBAC(request);
  if (rbac) return rbac;

  const resolvedParams = await params;
  const resourceId = parseInt(resolvedParams.id);
  if (isNaN(resourceId)) {
    return NextResponse.json({ message: 'Invalid resource ID' }, { status: 400 });
  }

  try {
    // Ensure no active allocations before deletion
    const activeAllocs = await prisma.allocation.count({ where: { resourceId } });
    if (activeAllocs > 0) {
      return NextResponse.json({ message: 'Cannot delete resource with active allocations' }, { status: 400 });
    }
    await prisma.resource.delete({ where: { id: resourceId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Failed to delete resource', e);
    return NextResponse.json({ message: e.message || 'Delete failed' }, { status: 500 });
  }
}
