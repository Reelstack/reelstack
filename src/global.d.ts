import type { Database } from './lib/database.types';

declare global {
  type DBusers = Database['public']['Tables']['users']['Row'];
}
