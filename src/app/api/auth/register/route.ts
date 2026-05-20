import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Validate role (Only Member and Operations staff can sign up)
    const validRoles = ['OPERATIONS', 'MEMBER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, message: 'Admin registration is disabled' }, { status: 400 });
    }

    // Operations and Admin signup are explicitly permitted by the rules requested by the user.
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (e: any) {
    console.error('Registration error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Internal server error' }, { status: 500 });
  }
}
