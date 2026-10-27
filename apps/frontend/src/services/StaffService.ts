import { DatabaseService } from './DatabaseService';

export class StaffService {
  private static instance: StaffService;
  
  private constructor() {}

  public static getInstance(): StaffService {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService();
    }
    return StaffService.instance;
  }

  public async getStaffProfile(staffId: string) {
    const db = DatabaseService.getInstance();
    const client = db.getClient();
    if (!client) return null;
    
    const { data } = await client
      .from('users')
      .select('*, profile:canteen_profiles(*)')
      .eq('id', staffId)
      .single();
      
    return data;
  }
}
