import type { ReactNode } from 'react';
import type { AuthValue } from './context';
import { AuthContext } from './context';

export function AuthProvider({
  value,
  children,
}: {
  value: AuthValue;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
