import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin account already exists' },
        { status: 409 }
      );
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const { data: newAdmin, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true
      })
      .select('id, email, name, role, created_at')
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
