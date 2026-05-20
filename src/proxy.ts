import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Define protected routes and required roles
const roleProtectedRoutes: Record<string, string> = {
  '/dashboard/admin': 'ADMIN',
  '/dashboard/operations': 'OPERATIONS',
  '/dashboard/member': 'MEMBER',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("Middleware executed for path:", pathname);

  // Check if the request matches any protected base path
  const protectedEntry = Object.entries(roleProtectedRoutes).find(([path]) =>
    pathname.startsWith(path)
  );

  if (!protectedEntry) {
    // No protection needed
    return NextResponse.next();
  }

  const [basePath, requiredRole] = protectedEntry;

  // Get JWT token (will be undefined if not authenticated)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Not authenticated – redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token contains role (set in auth callbacks)
  const userRole = (token as any).role as string;

  // Simple role hierarchy: ADMIN > OPERATIONS > MEMBER
  const hierarchy = ['MEMBER', 'OPERATIONS', 'ADMIN'];
  const userRank = hierarchy.indexOf(userRole);
  const requiredRank = hierarchy.indexOf(requiredRole);

  if (userRank < 0 || requiredRank < 0 || userRank < requiredRank) {
    // If it's an API route, return JSON 403
    if (pathname.startsWith('/api/')) {
      const res = new NextResponse(JSON.stringify({
        success: false,
        message: 'Forbidden: insufficient permissions',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      return res;
    }
    
    // For page requests, redirect to their highest authorized dashboard
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    } else if (userRole === 'OPERATIONS') {
      return NextResponse.redirect(new URL('/dashboard/operations', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard/member', request.url));
    }
  }

  // Authorized – continue
  return NextResponse.next();
}

// Ensure middleware runs for API routes and pages under /dashboard
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
