import { User } from './types';

export const hasRole = (user: User | null, requiredRole: 'admin' | 'commuter'): boolean => {
  if (!user) return false;
  return user.role === requiredRole;
};

export const hasAdminAccess = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

export const hasCommuterAccess = (user: User | null): boolean => {
  return hasRole(user, 'commuter');
};

export const canAccessRoute = (user: User | null, route: string): boolean => {
  if (!user) return false;
  
  if (route.startsWith('/admin')) {
    return hasAdminAccess(user);
  }
  
  if (route.startsWith('/commuter')) {
    return hasCommuterAccess(user);
  }
  
  return true; // Public routes
};
