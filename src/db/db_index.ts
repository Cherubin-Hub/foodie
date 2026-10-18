import { IDatabaseRepository } from './db_types.js';
import { SupabaseRepository } from './supabase/supabase_repository.js';
import { MySqlRepository } from './mysql/mysql_repository.js';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseFactory {
  private static instance: IDatabaseRepository | null = null;

  public static getRepository(): IDatabaseRepository {
    if (!this.instance) {
      const provider = (process.env.DB_PROVIDER || 'supabase').toLowerCase().trim();

      if (provider === 'mysql') {
        console.log('[DatabaseFactory] Initializing MySQL Database Repository Adapter...');
        this.instance = new MySqlRepository();
      } else {
        console.log('[DatabaseFactory] Initializing Supabase PostgreSQL Database Repository Adapter...');
        this.instance = new SupabaseRepository();
      }
    }

    return this.instance;
  }
}