// src/app/api/operations/summary/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [totalResources, pendingRequests, activeAllocations] = await Promise.all([
      prisma.resource.count(),
      prisma.bookingRequest.count({ where: { status: "PENDING" } }),
      prisma.allocation.count(),
    ]);

    return NextResponse.json({
      totalResources,
      pendingRequests,
      activeAllocations,
    });
  } catch (error: any) {
    console.error("[operations/summary] error:", error);
    return new NextResponse(JSON.stringify({ message: error.message || "Failed to fetch summary" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
