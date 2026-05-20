import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/analytics/audit
 * Returns paginated audit log entries.
 * Query parameters:
 *   - entityType (optional)
 *   - entityId   (optional)
 *   - from       (ISO date string, optional)
 *   - to         (ISO date string, optional)
 *   - skip       (number, default 0)
 *   - take       (number, default 20)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType');
  const entityId = url.searchParams.get('entityId') ? Number(url.searchParams.get('entityId')) : undefined;
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const skip = Number(url.searchParams.get('skip') ?? '0');
  const take = Number(url.searchParams.get('take') ?? '20');

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId !== undefined) where.entityId = entityId;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, skip, take });
}
