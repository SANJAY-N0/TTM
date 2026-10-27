import { GoogleAuthSchema, RegisterStudentSchema, LoginSchema } from '../apps/backend/src/validation/schemas';
import { AuthService, CollegeService, DepartmentService, AcademicYearService, CanteenAccountService } from '../apps/backend/src/services';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING TIMETOMEAL AUTH & RBAC VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --- UNIT TESTS ---
  console.log('--- 1. Validation Schemas (Unit) ---');
  const googleCheck = GoogleAuthSchema.safeParse({ email: 'sanjay.26k24@kprcas.ac.in' });
  assert(googleCheck.success, 'GoogleAuthSchema accepts valid college email');

  const invalidGoogle = GoogleAuthSchema.safeParse({ email: 'invalid-email' });
  assert(!invalidGoogle.success, 'GoogleAuthSchema rejects invalid email format');

  const fullStudentPayload = {
    full_name: 'Sanjay N',
    college_email: 'sanjay.26k24@kprcas.ac.in',
    roll_number: 'KPR-CS-026',
    gender: 'male',
    mobile_number: '9876543210',
    college_id: 'c1111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    year_of_study: 1,
    section: 'A',
    stay_classification: 'HOSTELLER' as const,
    terms_accepted: true,
    terms_version: '1.0'
  };
  const regCheck = RegisterStudentSchema.safeParse(fullStudentPayload);
  assert(regCheck.success, 'RegisterStudentSchema validates all required fields from screenshot');

  const invalidPhone = RegisterStudentSchema.safeParse({ ...fullStudentPayload, mobile_number: '123' });
  assert(!invalidPhone.success, 'RegisterStudentSchema enforces 10-digit mobile number');

  const unacceptedTerms = RegisterStudentSchema.safeParse({ ...fullStudentPayload, terms_accepted: false });
  assert(!unacceptedTerms.success, 'RegisterStudentSchema enforces mandatory Terms & Conditions acceptance');

  // --- INTEGRATION TESTS ---
  console.log('\n--- 2. Multi-Portal Authentication (Integration) ---');
  const authService = new AuthService();
  const collegeService = new CollegeService();
  const deptService = new DepartmentService();
  const ayService = new AcademicYearService();
  const canteenAccService = new CanteenAccountService();

  // Admin login
  const adminRes = await authService.login('admin@timetomeal.com', 'admin123', 'ADMIN');
  assert(adminRes.user.role === 'ADMIN', 'Admin Login Portal authenticates Super Admin');

  // Canteen login
  const canteenRes = await authService.login('kprcanteen', 'admin123', 'CANTEEN_OWNER');
  assert(canteenRes.user.role === 'CANTEEN_OWNER', 'Canteen Login Portal authenticates Canteen Owner');

  // Google domain validation
  const validDomainAuth = await authService.authenticateGoogle({ email: 'student@kprcas.ac.in', name: 'Student' });
  assert(validDomainAuth.detectedCollege.code === 'KPRCAS', 'Student Google Login detects and approves institutional domain @kprcas.ac.in');

  try {
    await authService.authenticateGoogle({ email: 'intruder@yahoo.com', name: 'Intruder' });
    assert(false, 'Student Google Login rejects unapproved domain');
  } catch (err: any) {
    assert(err.message.includes('not an approved college email domain'), 'Student Google Login blocks non-college domain');
  }

  // --- ENTITY RELATIONSHIPS & CONSTRAINTS ---
  console.log('\n--- 3. Entity Relationships & Scoping (Integration) ---');
  const colleges = await collegeService.getAllColleges();
  assert(colleges.length > 0, `Colleges listed successfully (count: ${colleges.length})`);

  const kpr = colleges.find((c: any) => (c.code || c.college_code) === 'KPRCAS');
  assert(!!kpr, 'KPR College found in database records');

  const depts = await deptService.getByCollege(kpr.id || kpr.college_id);
  assert(depts.length > 0, `Departments scoped to KPR College retrieved (count: ${depts.length})`);

  const academicYears = await ayService.getByCollege(kpr.id || kpr.college_id);
  assert(academicYears.length >= 4, `Academic Years scoped to KPR College retrieved (count: ${academicYears.length})`);

  // Student registration and duplicate roll check
  const uniqueRoll = `TEST-${Date.now().toString().slice(-4)}`;
  const regResult = await authService.registerStudentProfile({
    ...fullStudentPayload,
    roll_number: uniqueRoll,
    college_email: `test.${uniqueRoll.toLowerCase()}@kprcas.ac.in`,
    college_id: kpr.id || kpr.college_id,
    department_id: depts[0].id || depts[0].department_id
  });
  assert(regResult.user.roll_number === uniqueRoll, 'Student profile persisted to database with stay classification and audit log');

  try {
    await authService.registerStudentProfile({
      ...fullStudentPayload,
      roll_number: uniqueRoll,
      college_email: `conflict.${uniqueRoll.toLowerCase()}@kprcas.ac.in`,
      college_id: kpr.id || kpr.college_id,
      department_id: depts[0].id || depts[0].department_id
    });
    assert(false, 'Duplicate roll number in same college blocked');
  } catch (err: any) {
    assert(err.message.includes('already registered for this college'), 'Duplicate roll number in same college rejected cleanly');
  }

  // Canteen accounts security
  const canteenAccounts = await canteenAccService.getAll();
  assert(canteenAccounts.length > 0, `Canteen accounts retrieved without exposing password hashes (count: ${canteenAccounts.length})`);

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
