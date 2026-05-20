import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for creating/updating a resource
const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ROOM', 'EQUIPMENT', 'VEHICLE']),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE']),
});

export async function GET() {
  try {
    const resources = await prisma.resource.findMany();
    return NextResponse.json(resources);
  } catch (e) {
    console.error('Failed to fetch resources', e);
    return NextResponse.json({ error: 'Unable to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = resourceSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ errors: parse.error.format() }, { status: 400 });
    }
    const newRes = await prisma.resource.create({ data: parse.data });
    return NextResponse.json(newRes, { status: 201 });
  } catch (e) {
    console.error('Failed to create resource', e);
    return NextResponse.json({ error: 'Unable to create resource' }, { status: 500 });
  }
}
