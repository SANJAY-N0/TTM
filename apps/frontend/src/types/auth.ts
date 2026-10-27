export type UserRole = 'ADMIN' | 'COLLEGE_ADMIN' | 'CANTEEN_STAFF' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  phone?: string;
  collegeId?: string;
  canteenId?: string;
  createdAt?: string;
}
