import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';

const BASE_URL = 'http://localhost:5000/api';

const results = [];

function assert(testName, condition, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    console.error(`❌ [FAIL] ${testName} - ${details}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runQAAudit() {
  console.log('====================================================');
  console.log('INTERVIEWCOACH AI — AUTOMATED PRE-DEPLOYMENT QA AUDIT');
  console.log('====================================================\n');

  await connectDB();

  // --- 1. Health Check ---
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert('1. Health Check Endpoint Returns 200 OK', res.status === 200 && data.status === 'ok');
  } catch (e) {
    assert('1. Health Check Endpoint Returns 200 OK', false, e.message);
  }

  // --- 2. Security Headers ---
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const poweredBy = res.headers.get('x-powered-by');
    assert('2. Security: X-Powered-By Header Disabled', poweredBy === null, `Header: ${poweredBy}`);
  } catch (e) {
    assert('2. Security: X-Powered-By Header Disabled', false, e.message);
  }

  // --- 3. Authentication Flow ---
  const userA_email = `qa_user_a_${Date.now()}@interviewcoach.com`;
  const userB_email = `qa_user_b_${Date.now()}@interviewcoach.com`;
  let tokenA = '';
  let tokenB = '';

  // 3a. Register validation: missing fields
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@test.com' }),
    });
    assert('3a. Auth: Rejects registration with missing fields (400)', res.status === 400);
  } catch (e) {
    assert('3a. Auth: Rejects registration with missing fields (400)', false, e.message);
  }

  // 3b. Register validation: short password
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Short Pwd', email: 'short@test.com', password: '123' }),
    });
    assert('3b. Auth: Rejects password shorter than 6 characters (400)', res.status === 400);
  } catch (e) {
    assert('3b. Auth: Rejects password shorter than 6 characters (400)', false, e.message);
  }

  // 3c. Register User A
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A QA', email: userA_email, password: 'password123' }),
    });
    const data = await res.json();
    tokenA = data.token;
    assert('3c. Auth: Successfully registers User A (201)', res.status === 201 && !!tokenA);
  } catch (e) {
    assert('3c. Auth: Successfully registers User A (201)', false, e.message);
  }

  // 3d. Duplicate email check
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A Dup', email: userA_email, password: 'password123' }),
    });
    assert('3d. Auth: Rejects duplicate email registration (400)', res.status === 400);
  } catch (e) {
    assert('3d. Auth: Rejects duplicate email registration (400)', false, e.message);
  }

  // 3e. Register User B
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B QA', email: userB_email, password: 'password123' }),
    });
    const data = await res.json();
    tokenB = data.token;
    assert('3e. Auth: Successfully registers User B (201)', res.status === 201 && !!tokenB);
  } catch (e) {
    assert('3e. Auth: Successfully registers User B (201)', false, e.message);
  }

  // 3f. Login with wrong password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_email, password: 'wrongpassword' }),
    });
    assert('3f. Auth: Rejects invalid password on login (401)', res.status === 401);
  } catch (e) {
    assert('3f. Auth: Rejects invalid password on login (401)', false, e.message);
  }

  // 3g. Login with valid password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_email, password: 'password123' }),
    });
    const data = await res.json();
    assert('3g. Auth: Successfully logs in with valid credentials (200)', res.status === 200 && !!data.token);
  } catch (e) {
    assert('3g. Auth: Successfully logs in with valid credentials (200)', false, e.message);
  }

  // 3h. Protected route check: /api/auth/me without token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`);
    assert('3h. Auth: Protected route rejects unauthenticated request (401)', res.status === 401);
  } catch (e) {
    assert('3h. Auth: Protected route rejects unauthenticated request (401)', false, e.message);
  }

  // 3i. Protected route check: /api/auth/me with invalid token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer fake.invalid.jwttoken' },
    });
    assert('3i. Auth: Protected route rejects invalid/tampered token (401)', res.status === 401);
  } catch (e) {
    assert('3i. Auth: Protected route rejects invalid/tampered token (401)', false, e.message);
  }

  // 3j. Protected route check: /api/auth/me with valid token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data = await res.json();
    assert('3j. Auth: Protected route returns current user profile (200)', res.status === 200 && data.user.email === userA_email);
  } catch (e) {
    assert('3j. Auth: Protected route returns current user profile (200)', false, e.message);
  }

  // --- 4. Dashboard Stats (Empty State) ---
  try {
    const res = await fetch(`${BASE_URL}/interviews/dashboard/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data = await res.json();
    assert(
      '4. Dashboard: Stats calculation handles zero interviews gracefully (200)',
      res.status === 200 && data.stats.totalInterviews === 0 && data.stats.averageScore === 0
    );
  } catch (e) {
    assert('4. Dashboard: Stats calculation handles zero interviews gracefully (200)', false, e.message);
  }

  // --- 5. Security & Isolation / IDOR Protection ---
  try {
    // Non-existent valid ObjectId
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await fetch(`${BASE_URL}/interviews/${fakeId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('5a. Security: Returns 404 for non-existent interview ID', res.status === 404);
  } catch (e) {
    assert('5a. Security: Returns 404 for non-existent interview ID', false, e.message);
  }

  try {
    // Malformed ObjectId (tests CastError handling)
    const malformedId = 'not-a-valid-object-id';
    const res = await fetch(`${BASE_URL}/interviews/${malformedId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('5b. Security: Returns 404 CastError for malformed interview ID', res.status === 404);
  } catch (e) {
    assert('5b. Security: Returns 404 CastError for malformed interview ID', false, e.message);
  }

  try {
    // 5c. IDOR: User B cannot access User A's interview
    const { Interview } = await import('./src/models/Interview.js');
    const { User } = await import('./src/models/User.js');
    const userADoc = await User.findOne({ email: userA_email });
    const userAInterview = await Interview.create({
      userId: userADoc._id,
      role: 'Full Stack Developer',
      experienceLevel: 'Fresher',
      mode: 'text',
      status: 'in_progress',
      currentQuestionIndex: 0,
      totalQuestionsTarget: 5,
    });

    const res = await fetch(`${BASE_URL}/interviews/${userAInterview._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('5c. Security / IDOR: User B cannot access User A interview (returns 404)', res.status === 404);

    // Clean up
    await Interview.deleteOne({ _id: userAInterview._id });
  } catch (e) {
    assert('5c. Security / IDOR: User B cannot access User A interview (returns 404)', false, e.message);
  }

  // --- 6. Interview Validation ---
  try {
    // Missing role
    const res = await fetch(`${BASE_URL}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ experienceLevel: 'Fresher' }),
    });
    assert('6a. Interview: Rejects interview creation with missing role (400)', res.status === 400);
  } catch (e) {
    assert('6a. Interview: Rejects interview creation with missing role (400)', false, e.message);
  }

  try {
    // Mode switch with invalid mode
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await fetch(`${BASE_URL}/interviews/${fakeId}/mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mode: 'telepathy' }),
    });
    assert('6b. Interview: Rejects invalid interview mode (400)', res.status === 400);
  } catch (e) {
    assert('6b. Interview: Rejects invalid interview mode (400)', false, e.message);
  }

  // --- 7. AWS S3 Direct Upload & Read ---
  try {
    const { uploadToS3 } = await import('./src/services/aws/s3Service.js');
    const testContent = Buffer.from('QA Audit S3 verification test');
    const uploadRes = await uploadToS3({
      fileBuffer: testContent,
      mimeType: 'text/plain',
      folder: 'qa-test',
      originalName: 'qa-audit.txt',
    });
    assert('7a. AWS S3: File upload to bucket succeeds with valid S3 URI', !!uploadRes.s3Uri && uploadRes.bucket === 'interviewcoach1');
  } catch (e) {
    assert('7a. AWS S3: File upload to bucket succeeds with valid S3 URI', false, e.message);
  }

  // --- 8. AWS Polly Speech Synthesis ---
  try {
    const { synthesizeSpeech } = await import('./src/services/aws/pollyService.js');
    const pollyRes = await synthesizeSpeech('This is a test of Amazon Polly speech synthesis.');
    assert('8a. AWS Polly: Synthesizes speech to MP3 stream/URL', !!pollyRes.audioUrl && pollyRes.buffer?.length > 0);
  } catch (e) {
    assert('8a. AWS Polly: Synthesizes speech to MP3 stream/URL', false, e.message);
  }

  // --- 9. Resume Parsing (PDF & DOCX) ---
  try {
    const { parseResumeFile } = await import('./src/services/resume/resumeParser.js');
    // Test invalid format
    let threw = false;
    try {
      await parseResumeFile(Buffer.from('test'), 'image/png', 'test.png');
    } catch {
      threw = true;
    }
    assert('9a. Resume Parser: Rejects non-PDF/DOCX file formats', threw);
  } catch (e) {
    assert('9a. Resume Parser: Rejects non-PDF/DOCX file formats', false, e.message);
  }

  console.log('\n====================================================');
  console.log('SUMMARY OF QA AUDIT ASSERTIONS');
  console.log('====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(` - ${r.name}: ${r.details}`));
  }

  await mongoose.disconnect();
}

runQAAudit();
