// userTypes.ts
export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface State {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_USERS'; payload: UserProfile[] }
  | { type: 'ADD_USER'; payload: UserProfile }
  | { type: 'UPDATE_USER'; payload: UserProfile }
  | { type: 'DELETE_USER'; payload: UserProfile['id'] };
