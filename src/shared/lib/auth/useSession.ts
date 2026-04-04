import { useContext } from 'react';
import type { AuthValue } from './context';
import { AuthContext } from './context';

export function useSession(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useSession must be used within AuthProvider');
  }
  return ctx;
}
