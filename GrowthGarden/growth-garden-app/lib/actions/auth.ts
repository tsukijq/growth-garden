'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateEmail, validatePassword } from '@/lib/validation';
import { AuthResult, ErrorCode } from '@/lib/types';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Register a new user with email and password.
 * Creates a Supabase auth account and a profile record.
 *
 * Validates: Requirements 1.1, 1.3, 1.4, 1.6, 1.7
 */
export async function register(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return {
      success: false,
      error: emailValidation.error,
    };
  }

  // Validate password length
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error: passwordValidation.error,
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // Supabase returns a specific error when the email is already registered
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already been registered') ||
      error.status === 422
    ) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    return {
      success: false,
      error: 'Registration failed. Please try again.',
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: 'Registration failed. Please try again.',
    };
  }

  revalidatePath('/', 'layout');

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email!,
    },
  };
}

/**
 * Log in an existing user with email and password.
 *
 * Validates: Requirements 1.2, 1.4, 1.5, 1.6, 1.7
 */
export async function login(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return {
      success: false,
      error: emailValidation.error,
    };
  }

  // Validate password length
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error: passwordValidation.error,
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  }

  revalidatePath('/', 'layout');

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email!,
    },
  };
}

/**
 * Log out the current user and redirect to the login page.
 *
 * Validates: Requirements 1.8
 */
export async function logout(): Promise<void> {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/login');
}
