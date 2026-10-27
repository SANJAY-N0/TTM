import { AuthService, CollegeService, DepartmentService, AcademicYearService, CanteenAccountService, StudentService } from '../../apps/backend/src/services';

describe('Integration Tests: Auth, Portals & RBAC Entities', () => {
  const authService = new AuthService();
  const collegeService = new CollegeService();
  const deptService = new DepartmentService();
  const ayService = new AcademicYearService();
  const canteenAccService = new CanteenAccountService();
  const studentService = new StudentService();

  test('1. Admin Portal Authentication with Role Enforcement', async () => {
    const res = await authService.login('admin@timetomeal.com', 'admin123', 'ADMIN');
    expect(res).toBeDefined();
    expect(res.user.role).toBe('ADMIN');
    expect(res.token).toBeDefined();
  });

  test('2. Canteen Owner Authentication with Role Enforcement', async () => {
    const res = await authService.login('kprcanteen', 'admin123', 'CANTEEN_OWNER');
    expect(res).toBeDefined();
    expect(res.user.role).toBe('CANTEEN_OWNER');
    expect(res.user.canteen_id).toBeDefined();
  });

  test('3. Student Google Login accepts approved domain @kprcas.ac.in', async () => {
    const res = await authService.authenticateGoogle({
      email: 'student.test@kprcas.ac.in',
      name: 'Test Student'
    });
    expect(res.detectedCollege).toBeDefined();
    expect(res.detectedCollege.code).toBe('KPRCAS');
    expect(res.user.role).toBe('STUDENT');
  });

  test('4. Student Google Login rejects unapproved domain @gmail.com', async () => {
    await expect(authService.authenticateGoogle({
      email: 'hacker@gmail.com',
      name: 'Unknown User'
    })).rejects.toThrow('not an approved college email domain');
  });

  test('5. Student Registration persists profile and enforces constraints', async () => {
    const colleges = await collegeService.getAllColleges();
    const kpr = colleges.find((c: any) => (c.code || c.college_code) === 'KPRCAS');
    expect(kpr).toBeDefined();

    const depts = await deptService.getByCollege(kpr.id || kpr.college_id);
    expect(depts.length).toBeGreaterThan(0);

    const testPayload = {
      full_name: 'Antigravity Test Student',
      college_email: `student.test.${Date.now()}@kprcas.ac.in`,
      roll_number: `ROLL-${Date.now().toString().slice(-5)}`,
      gender: 'male',
      mobile_number: '9876543210',
      college_id: kpr.id || kpr.college_id,
      department_id: depts[0].id || depts[0].department_id,
      year_of_study: 1,
      section: 'A',
      stay_classification: 'HOSTELLER',
      terms_accepted: true,
      terms_version: '1.0'
    };

    const reg = await authService.registerStudentProfile(testPayload);
    expect(reg.user.roll_number).toBe(testPayload.roll_number);

    // Test Duplicate Roll Number Rejection
    await expect(authService.registerStudentProfile({
      ...testPayload,
      college_email: `another.${Date.now()}@kprcas.ac.in`
    })).rejects.toThrow('already registered for this college');
  });

  test('6. Canteen Account Listing and Provisioning Integrity', async () => {
    const accounts = await canteenAccService.getAll();
    expect(Array.isArray(accounts)).toBe(true);
    accounts.forEach(acc => {
      // Must never expose password_hash
      expect((acc as any).password_hash).toBeUndefined();
    });
  });

  test('7. Academic Years and Departments belong to College', async () => {
    const colleges = await collegeService.getAllColleges();
    const kpr = colleges.find((c: any) => (c.code || c.college_code) === 'KPRCAS');
    const years = await ayService.getByCollege(kpr.id || kpr.college_id);
    expect(years.length).toBeGreaterThanOrEqual(4);
  });
});
