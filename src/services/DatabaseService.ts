import { getSupabaseClient } from '../lib/supabase';

export class DatabaseService {
  private static instance: DatabaseService;
  
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient() {
    return getSupabaseClient();
  }

  // Generic insert method
  public async insert(table: string, data: any) {
    const client = this.getClient();
    if (!client) {
      console.log(`[DatabaseService] Mock insert to ${table} (DB writes disabled)`);
      return { data, error: null };
    }
    return client.from(table).insert(data);
  }

  // Generic update method
  public async update(table: string, matchKey: string, matchValue: any, data: any) {
    const client = this.getClient();
    if (!client) {
      console.log(`[DatabaseService] Mock update to ${table} where ${matchKey}=${matchValue} (DB writes disabled)`);
      return { data, error: null };
    }
    return client.from(table).update(data).eq(matchKey, matchValue);
  }

  // Generic delete method
  public async delete(table: string, matchKey: string, matchValue: any) {
    const client = this.getClient();
    if (!client) {
      console.log(`[DatabaseService] Mock delete from ${table} where ${matchKey}=${matchValue} (DB writes disabled)`);
      return { data: null, error: null };
    }
    return client.from(table).delete().eq(matchKey, matchValue);
  }
}
