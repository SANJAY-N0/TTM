import { DatabaseService } from './DatabaseService';

export class StudentService {
  private static instance: StudentService;
  
  private constructor() {}

  public static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  public async getStudentProfile(studentId: string) {
    const db = DatabaseService.getInstance();
    const client = db.getClient();
    if (!client) return null;
    
    const { data } = await client
      .from('users')
      .select('*, profile:student_profiles(*)')
      .eq('id', studentId)
      .single();
      
    return data;
  }
}
