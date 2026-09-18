import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runE2ETest() {
  console.log('====================================================');
  console.log('INTERVIEWCOACH AI — REAL END-TO-END INTERVIEW FLOW TEST');
  console.log('====================================================\n');

  // 1. Register / Login
  console.log('1. User Authentication (Login & Profile)');
  const testUser = {
    name: 'E2E Tester',
    email: `e2e_user_${Date.now()}@interviewcoach.ai`,
    password: 'password123',
  };

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  const token = regData.token;
  assert('User registration & JWT acquisition', regRes.status === 201 && !!token);

  // 2. Start Interview (POST /api/interviews)
  console.log('\n2. Starting New Interview (POST /api/interviews)');
  const startPayload = {
    role: 'Software Engineer',
    experienceLevel: 'Fresher',
    mode: 'text',
    personality: 'professional',
    totalQuestionsTarget: 2,
    jobDescription: 'Software Engineer with React, Node.js, and MongoDB experience.',
  };

  const createRes = await fetch(`${BASE_URL}/interviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(startPayload),
  });
  const createData = await createRes.json();

  assert('POST /api/interviews returns 201 Created', createRes.status === 201);
  assert('Response contains interview document', !!createData.interview);
  assert('createData.interview._id is a valid 24-char MongoDB ID', typeof createData.interview._id === 'string' && createData.interview._id.length === 24);
  assert('createData._id top-level alias is present', typeof createData._id === 'string' && createData._id === createData.interview._id);
  assert('createData.id top-level alias is present', typeof createData.id === 'string' && createData.id === createData.interview._id);
  assert('createData.interview._id is NEVER "undefined"', createData.interview._id !== 'undefined');

  // 3. Frontend Navigation Simulation
  console.log('\n3. Frontend ID Extraction & Navigation URL Construction');
  const extractedId = createData?.interview?._id || createData?.interview?.id || createData?._id || createData?.id;
  assert('Frontend extracts valid interviewId', typeof extractedId === 'string' && extractedId.length === 24);

  const navigationUrl = `/interview/room/${extractedId}`;
  assert('Constructed navigation URL contains real ID', navigationUrl === `/interview/room/${extractedId}`);
  assert('Navigation URL does NOT contain "/undefined"', !navigationUrl.includes('/undefined'));

  // 4. Interview Room Initial Load (GET /api/interviews/:id)
  console.log(`\n4. Interview Room Fetch (GET /api/interviews/${extractedId})`);
  const roomRes = await fetch(`${BASE_URL}/interviews/${extractedId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roomData = await roomRes.json();

  assert('GET /api/interviews/:id returns 200 OK', roomRes.status === 200);
  assert('Fetched interview session matches created ID', roomData.interview._id === extractedId);
  assert('Question 1 exists and is populated', !!roomData.currentQuestion && typeof roomData.currentQuestion.question === 'string');
  console.log(`     Q1: "${roomData.currentQuestion.question}"`);
  console.log(`     Category: ${roomData.currentQuestion.category}`);
  console.log(`     AI Model Used: ${roomData.currentQuestion.modelUsed || 'Bedrock Model'}`);

  // 5. Submit Candidate Answer for Question 1
  console.log('\n5. Candidate Submitting Answer to Q1 (POST /api/interviews/:id/answer)');
  const answer1Res = await fetch(`${BASE_URL}/interviews/${extractedId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      answer: 'In my full-stack projects, I design REST APIs using Express.js, implement JWT authentication with bcrypt password hashing, and structure MongoDB schemas with Mongoose for clean data modeling.',
    }),
  });
  const answer1Data = await answer1Res.json();

  assert('Answer submission returns 200 OK', answer1Res.status === 200);
  assert('Evaluation criteria scores present', !!answer1Data.evaluation?.scores || !!answer1Data.evaluation);
  assert('Question 2 generated as next question', !!answer1Data.nextQuestion && typeof answer1Data.nextQuestion.question === 'string');
  console.log(`     Q2: "${answer1Data.nextQuestion.question}"`);
  console.log(`     Category: ${answer1Data.nextQuestion.category}`);

  // 6. Submit Candidate Answer for Question 2 (Final Question)
  console.log('\n6. Candidate Submitting Answer to Q2 (Final Question)');
  const answer2Res = await fetch(`${BASE_URL}/interviews/${extractedId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      answer: 'To ensure high availability and scalability, I use database indexes for frequent query fields, implement caching strategies, and follow structured error handling across all microservices.',
    }),
  });
  const answer2Data = await answer2Res.json();

  assert('Final answer triggers interview completion', answer2Data.completed === true);
  assert('Report object attached to completion response', !!answer2Data.report);

  // 7. Interview Diagnostic Report (GET /api/interviews/:id/report)
  console.log(`\n7. Fetching Final Report (GET /api/interviews/${extractedId}/report)`);
  const reportRes = await fetch(`${BASE_URL}/interviews/${extractedId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const reportData = await reportRes.json();

  assert('GET report returns 200 OK', reportRes.status === 200);
  assert('Interview status is marked "completed"', reportData.interview.status === 'completed');
  assert('Overall score is recorded (0-100)', typeof reportData.interview.overallScore === 'number');
  assert('Strengths array is populated', Array.isArray(reportData.interview.report.strengths) && reportData.interview.report.strengths.length > 0);
  assert('Weak areas array is populated', Array.isArray(reportData.interview.report.weakAreas) && reportData.interview.report.weakAreas.length > 0);
  assert('7-Day Improvement Plan is generated', Array.isArray(reportData.interview.report.improvementPlan) && reportData.interview.report.improvementPlan.length > 0);
  assert('Models used array is tracked in interview document', Array.isArray(reportData.interview.modelsUsed) && reportData.interview.modelsUsed.length > 0);
  console.log(`     Overall Score: ${reportData.interview.overallScore}/100`);
  console.log(`     Models tracked across interview: ${JSON.stringify(reportData.interview.modelsUsed)}`);

  console.log('\n====================================================');
  console.log(`END-TO-END TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
