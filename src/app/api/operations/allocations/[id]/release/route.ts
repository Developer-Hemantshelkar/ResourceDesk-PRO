import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { recordAudit } from '@/middleware/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // RBAC
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  const role = (token as any).role;
  if (!['ADMIN', 'OPERATIONS'].includes(role)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

  const resolvedParams = await params;
  const allocationId = parseInt(resolvedParams.id);
  if (isNaN(allocationId)) return NextResponse.json({ success: false, message: 'Invalid allocation ID' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.findUnique({ where: { id: allocationId } });
      if (!allocation) throw new Error('Allocation not found');
      // Set resource back to AVAILABLE
      await tx.resource.update({ where: { id: allocation.resourceId }, data: { status: 'AVAILABLE' } });
      // Delete allocation
      await tx.allocation.delete({ where: { id: allocationId } });
      return allocation;
    });

    // Audit
    await recordAudit('ALLOCATION_RELEASED', {
      entityId: allocationId,
      entityType: 'Allocation',
      details: { resourceId: result.resourceId },
      request,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error('Release error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Server error' }, { status: 500 });
  }
}
