import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory token bucket rate limiter (per IP)
// Allows `maxRequests` requests per `windowMs` milliseconds.

const maxRequests = 100; // per window
const windowMs = 60 * 1000; // 1 minute

// Map IP -> { count, resetTimestamp }
const ipBuckets = new Map<string, { count: number; reset: number }>();

export function middleware(request: NextRequest) {
  const ip = (request as any).ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? { count: 0, reset: now + windowMs };

  // Reset window if needed
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }

  bucket.count += 1;
  ipBuckets.set(ip, bucket);

  if (bucket.count > maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Continue to next middleware/handler
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', // apply to all API routes
};
