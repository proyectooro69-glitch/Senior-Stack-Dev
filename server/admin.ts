import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase';

// Admin email - only this email can access admin functions
const ADMIN_EMAIL = 'proyectooro69@gmail.com';

export interface AdminRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

export async function adminMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.userId = user.id;
    req.userEmail = user.email;
    req.isAdmin = user.email === ADMIN_EMAIL;
    
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Invite a new user using Supabase Admin API
export async function inviteUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });
  
  if (error) {
    throw error;
  }
  
  return data.user;
}

// List all users
export async function listUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    throw error;
  }
  
  // Filter out admin and return basic info
  return data.users
    .filter(u => u.email !== ADMIN_EMAIL)
    .map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));
}

// Delete a user
export async function deleteUser(userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    throw error;
  }
  
  return true;
}

export { ADMIN_EMAIL };
