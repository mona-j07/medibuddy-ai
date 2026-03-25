export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  region?: string;
  dietary_preference?: string;
  medical_conditions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}