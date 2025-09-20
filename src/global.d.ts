import type { Database } from './lib/database.types';

declare global {
  type Users = Database['public']['Tables']['users']['Row'];
}
