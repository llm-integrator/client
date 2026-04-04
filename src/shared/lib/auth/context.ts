import type { InternalUserProfile } from '@/shared/api';
import { createContext } from 'react';

export type AuthValue = {
  user: InternalUserProfile;
  setUser: (u: InternalUserProfile | null) => void;
};

export const AuthContext = createContext<AuthValue | null>(null);
