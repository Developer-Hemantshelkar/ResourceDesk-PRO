import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for creating a Resource
const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  locationId: z.number().int().optional(),
  categoryId: z.number().int().optional(),
});

type CreateResourceInput = z.infer<typeof createResourceSchema>;

export async function GET() {
  const resources = await prisma.resource.findMany({
    include: { location: true, category: true },
  });
  return NextResponse.json({ success: true, data: resources });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createResourceSchema.parse(body) as CreateResourceInput;
    const resource = await prisma.resource.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        capacity: parsed.capacity,
        locationId: parsed.locationId,
        categoryId: parsed.categoryId,
        status: 'AVAILABLE', // default status
      },
    });
    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid input';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
