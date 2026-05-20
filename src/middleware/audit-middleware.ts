import { AuditAction } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Records an audit entry.
 * @param action The action performed (enum from Prisma schema).
 * @param entityType The type of entity (e.g., "Booking", "Resource").
 * @param entityId The primary key of the affected entity.
 * @param performedByUserId The user performing the action.
 * @param details Optional JSON with additional context.
 */
export async function recordAudit(
  action: AuditAction,
  entityType: string,
  entityId: number,
  performedByUserId: number,
  details?: any,
) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      performedByUserId,
      details,
    },
  });
}

/**
 * Express‑style middleware that can be used in Next.js API routes.
 * It extracts the user id from the request (assuming you store it on req.user.id)
 * and makes the `recordAudit` helper available via `res.locals.audit`.
 */
export function auditMiddleware(req: any, res: any, next: any) {
  // In Next.js API routes `req` is a plain Node.js IncomingMessage.
  // We expect upstream authentication to attach `user`.
  // For safety we just pass through.
  (res as any).locals = (res as any).locals || {};
  (res as any).locals.recordAudit = recordAudit;
  next();
}

export default prisma;
