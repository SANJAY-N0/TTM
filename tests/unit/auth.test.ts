import { RegisterStudentSchema, LoginSchema, GoogleAuthSchema } from '../../apps/backend/src/validation/schemas';

describe('Authentication & RBAC Unit Tests', () => {
  test('GoogleAuthSchema accepts valid college email', () => {
    const valid = GoogleAuthSchema.safeParse({
      email: 'sanjay.26k24@kprcas.ac.in',
      name: 'Sanjay N'
    });
    expect(valid.success).toBe(true);
  });

  test('GoogleAuthSchema rejects empty or invalid email', () => {
    const invalid = GoogleAuthSchema.safeParse({
      email: 'not-an-email',
      name: 'Tester'
    });
    expect(invalid.success).toBe(false);
  });

  test('RegisterStudentSchema validates all required fields from screenshot', () => {
    const validPayload = {
      full_name: 'Sanjay N',
      college_email: 'sanjay.26k24@kprcas.ac.in',
      roll_number: 'KPR-CS-026',
      gender: 'male',
      mobile_number: '9876543210',
      college_id: 'c1111111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      year_of_study: 1,
      section: 'A',
      stay_classification: 'HOSTELLER',
      terms_accepted: true,
      terms_version: '1.0'
    };
    const result = RegisterStudentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  test('RegisterStudentSchema rejects invalid 9-digit mobile number', () => {
    const invalidPayload = {
      full_name: 'Sanjay N',
      college_email: 'sanjay.26k24@kprcas.ac.in',
      roll_number: 'KPR-CS-026',
      gender: 'male',
      mobile_number: '987654321', // 9 digits
      college_id: 'c1111111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      year_of_study: 1,
      terms_accepted: true
    };
    const result = RegisterStudentSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  test('RegisterStudentSchema rejects false terms acceptance', () => {
    const invalidPayload = {
      full_name: 'Sanjay N',
      college_email: 'sanjay.26k24@kprcas.ac.in',
      roll_number: 'KPR-CS-026',
      gender: 'male',
      mobile_number: '9876543210',
      college_id: 'c1111111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      year_of_study: 1,
      terms_accepted: false // required to be true
    };
    const result = RegisterStudentSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  test('LoginSchema parses username and email identifiers', () => {
    const byUsername = LoginSchema.safeParse({
      identifier: 'kprcanteen',
      password: 'password123',
      role: 'CANTEEN_OWNER'
    });
    expect(byUsername.success).toBe(true);

    const byEmail = LoginSchema.safeParse({
      email: 'admin@timetomeal.com',
      password: 'admin123',
      role: 'ADMIN'
    });
    expect(byEmail.success).toBe(true);
  });
});
