import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { AuditAction } from '@prisma/client';

export async function recordAudit(action: AuditAction, params: {
  entityId?: number;
  entityType?: string;
  details?: any;
  request: Request;
}) {
  const token = await getToken({ req: params.request as any, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub ?? 0; // assume JWT sub holds user id
  await prisma.auditLog.create({
    data: {
      action,
      entityId: params.entityId,
      entityType: params.entityType,
      performedByUserId: Number(userId),
      details: params.details ? JSON.stringify(params.details) : undefined,
    },
  });
}

// Helper to combine response with audit (optional)
export async function withAudit(action: AuditAction, handler: (req: Request) => Promise<any>, request: Request) {
  const result = await handler(request);
  // If result is a NextResponse with success true, record audit
  try {
    const json = await result.json();
    if (json?.success) {
      await recordAudit(action, { request, ...json });
    }
  } catch (_) {
    // ignore parsing errors
  }
  return result;
}
