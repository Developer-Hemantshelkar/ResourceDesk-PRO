import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/analytics/summary
 * Returns aggregated counts for booking requests, approvals, denials, allocations.
 * Supports optional query param `days` (default 30) to limit the range.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') ?? '30', 10);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Total bookings (using bookingRequest)
    const totalBookings = await prisma.bookingRequest.count();
    
    // Approvals and denials based on status
    const approvals = await prisma.bookingRequest.count({ where: { status: 'CONFIRMED' } });
    const denials = await prisma.bookingRequest.count({ where: { status: 'CANCELLED' } });
    
    // Allocations count
    const totalAllocations = await prisma.allocation.count();

    // Daily activity for the last `days` using start_time (mapped from startTime in DB)
    // Cast count to integer to avoid BigInt JSON serialization errors.
    const daily = await prisma.$queryRaw<any[]>`
      SELECT date_trunc('day', "startTime") as day,
             COUNT(*)::int as count
      FROM "BookingRequest"
      WHERE "startTime" >= ${fromDate}
      GROUP BY 1
      ORDER BY 1 ASC`;

    // Map query results to safe serialize format
    const formattedDaily = daily.map(item => ({
      day: item.day,
      count: Number(item.count)
    }));

    return NextResponse.json({
      totalBookings,
      approvals,
      denials,
      totalAllocations,
      daily: formattedDaily,
    });
  } catch (error: any) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
