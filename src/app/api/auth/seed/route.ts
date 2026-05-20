import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    // 1. Seed Users
    const adminPassword = await hash('admin123', 10);
    const opsPassword = await hash('ops123', 10);
    const memberPassword = await hash('member123', 10);

    const users = [
      { email: 'admin@resourcedesk.com', name: 'System Administrator', password: adminPassword, role: 'ADMIN' },
      { email: 'ops@resourcedesk.com', name: 'Operations Manager', password: opsPassword, role: 'OPERATIONS' },
      { email: 'member@resourcedesk.com', name: 'Standard Member', password: memberPassword, role: 'MEMBER' },
    ];

    const seededUsers = [];
    for (const u of users) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        const created = await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            password: u.password,
            role: u.role as any,
          },
        });
        seededUsers.push(created.email);
      }
    }

    // 2. Seed Locations
    const locations = [
      { name: 'Main Campus - Building A', address: '123 Tech Boulevard' },
      { name: 'Innovation Hub - Floor 3', address: '456 Science Drive' },
    ];
    const seededLocations = [];
    for (const l of locations) {
      const existing = await prisma.location.findUnique({ where: { name: l.name } });
      if (!existing) {
        const created = await prisma.location.create({ data: l });
        seededLocations.push(created);
      } else {
        seededLocations.push(existing);
      }
    }

    // 3. Seed Categories
    const categories = [
      { name: 'Meeting Rooms', description: 'Collaborative team spaces' },
      { name: 'Lab Hardware', description: 'Testing devices and laptops' },
      { name: 'Pool Vehicles', description: 'Corporate transit cars' },
    ];
    const seededCategories = [];
    for (const c of categories) {
      const existing = await prisma.category.findUnique({ where: { name: c.name } });
      if (!existing) {
        const created = await prisma.category.create({ data: c });
        seededCategories.push(created);
      } else {
        seededCategories.push(existing);
      }
    }

    // 4. Seed Resources
    const resources = [
      {
        name: 'Boardroom A',
        description: 'Premium executive boardroom with video conferencing setup',
        capacity: 14,
        status: 'AVAILABLE' as const,
        locationName: 'Main Campus - Building A',
        categoryName: 'Meeting Rooms',
      },
      {
        name: 'AI Development Server',
        description: 'Ubuntu node equipped with 8x NVIDIA RTX 4090 GPUs',
        capacity: 2,
        status: 'AVAILABLE' as const,
        locationName: 'Innovation Hub - Floor 3',
        categoryName: 'Lab Hardware',
      },
      {
        name: 'Model Y Fleet Car #1',
        description: 'Long Range Tesla Model Y with Autopilot',
        capacity: 5,
        status: 'AVAILABLE' as const,
        locationName: 'Main Campus - Building A',
        categoryName: 'Pool Vehicles',
      },
    ];

    const seededResources = [];
    for (const r of resources) {
      const existing = await prisma.resource.findFirst({ where: { name: r.name } });
      if (!existing) {
        const loc = seededLocations.find((l) => l.name === r.locationName);
        const cat = seededCategories.find((c) => c.name === r.categoryName);
        const created = await prisma.resource.create({
          data: {
            name: r.name,
            description: r.description,
            capacity: r.capacity,
            status: r.status,
            locationId: loc?.id,
            categoryId: cat?.id,
          },
        });
        seededResources.push(created.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      seededUsers,
      seededLocations: seededLocations.map(l => l.name),
      seededCategories: seededCategories.map(c => c.name),
      seededResources,
    });
  } catch (e: any) {
    console.error('Seeding error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
