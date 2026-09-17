# InterviewCoach AI

> **Practice smarter. Interview better.**

InterviewCoach AI is a production-grade, AI-powered interview preparation platform designed specifically for college students, freshers, and job seekers. Unlike generic conversational chatbots, InterviewCoach AI orchestrates a realistic, structured, multi-turn interview experience powered by **Amazon Bedrock (Claude 3 Haiku)**, **Amazon S3**, **Amazon Transcribe**, and **Amazon Polly**.

The platform understands a candidate's background by extracting context from their uploaded resume (PDF/DOCX) and target job description. It adapts questions to the candidate's actual experience level, assesses answers in real-time with objective multi-metric scoring, intelligently probes deeper with dynamic follow-up questions when an answer is incomplete, and generates an exhaustive post-interview evaluation report complete with a personalized 7-day targeted improvement plan. Candidates can practice seamlessly via **interactive text chat** or **voice recording** with speech synthesis.

---

## 1. Problem Statement

Every year, millions of students, freshers, and professionals prepare for technical and behavioral job interviews. While candidates have access to question banks, YouTube tutorials, and generic AI chatbots, the preparation experience remains broken and ineffective:

- **Generic & Impersonal Questions**: Most practice tools provide static question lists that do not adapt to the candidate's specific background, past projects, or target company expectations.
- **Absence of Intelligent Follow-Ups**: Real interviewers do not read static lists; they probe weak or vague answers with contextual follow-up questions. Generic chatbots either talk too much or fail to challenge the candidate.
- **Inconsistent or Vague Feedback**: Candidates rarely receive structured, objective evaluations showing exact technical gaps and what an exemplary answer would look like.
- **Lack of Voice-Based Practice**: Most interviews happen verbally, yet candidates practice by typing or reading, leaving them unprepared for verbal articulation, pacing, and concise delivery.
- **No Clear Path to Improvement**: Generic advice like "improve communication" or "learn data structures" lacks actionable, day-by-day steps tied to the candidate's actual performance gaps.
- **Fragmented Tools**: Candidates juggle separate tools for resume analysis, mock interviews, speech practice, and note-taking without a unified workspace.

Interview preparation requires a realistic, contextual, and structured evaluation loop that replicates an actual interview room.

---

## 2. Our Solution

InterviewCoach AI solves this through a closed-loop interview engineering cycle:

```text
Practice → Interview → Real-Time Feedback → Weakness Detection → Personalized 7-Day Plan → Practice Again
```

The platform combines:
1. **Resume-Aware Personalization**: Ingests and parses PDF/DOCX resumes, extracting key skills and project technologies to ground questions in the candidate's real experience.
2. **Job Description Alignment**: Analyzes target job descriptions to focus the interview on relevant domain requirements and competencies.
3. **Adaptive Interview Engine**: Drives dynamic questioning that assesses responses and decides whether to ask a probing follow-up or transition to the next topic.
4. **Dual Mode Support (Text & Voice)**: Provides interactive text chat and hands-free voice interviews with audio recording, transcription, and speech playback.
5. **Multi-Dimensional Answer Evaluation**: Evaluates every response against technical accuracy, depth, relevance, clarity, and completeness with 0–10 scoring.
6. **Actionable Post-Interview Diagnostics**: Generates a comprehensive report containing strengths, missing concepts, model answers, category breakdowns, and a 7-day study plan.
7. **Longitudinal Progress Tracking**: Tracks score progression and competency trends across sessions from stored interview data without redundant database schemas.

---

## 3. Key Features

| Feature | Description | User Impact |
|---|---|---|
| **Personalized Interview Setup** | Wizard allowing candidates to select job roles (predefined or custom), experience levels (Student, Fresher, 0-2 yrs, 2-5 yrs, 5+ yrs), target question counts, and interviewer personalities. | Tailors difficulty and questioning style to realistic interview scenarios. |
| **Resume Upload & Parsing** | In-memory text extraction for PDF (`pdf-parse`) and DOCX (`mammoth`) files, automatically stored securely in private Amazon S3 storage. | Grounding questions in the candidate's actual projects, libraries, and work history. |
| **Job Description Analysis** | Ingests target JDs to identify required core competencies, key responsibilities, and domain requirements. | Aligns interview questions with specific hiring expectations. |
| **AI-Generated Questions** | Generates dynamic, non-repetitive technical and behavioral questions using Amazon Bedrock (Claude 3 Haiku). | Eliminates predictable, memorized question banks. |
| **Dynamic Follow-Up Questions** | Evaluates candidate answer depth; if key details are vague or missing, the AI interviewer asks a targeted follow-up question. | Replicates real interviewer behavior by testing true comprehension. |
| **Text Interview Mode** | Clean, distraction-free conversational chat UI with real-time markdown rendering and question navigation. | Ideal for structured practice, code snippets, and fast iteration. |
| **Voice Interview Mode** | In-browser audio recording via MediaRecorder API, automated S3 storage, and transcription via Amazon Transcribe. | Builds confidence and verbal articulation under realistic interview conditions. |
| **Interviewer Personalities** | Configurable interviewer demeanors: **Friendly** (supportive, encouraging), **Professional** (structured, balanced), or **Strict** (demanding, deep technical scrutiny). | Trains candidates to handle diverse interviewer types and pressure levels. |
| **Amazon Polly Speech Synthesis** | Converts AI questions into high-fidelity neural speech (Joanna Neural) with in-browser audio playback. | Provides an authentic auditory conversational experience. |
| **Objective 0–10 Scoring** | Every answer is evaluated on technical accuracy, communication, depth, and completeness. | Delivers transparent, quantifiable feedback on every response. |
| **Suggested Better Answers** | Each evaluated question provides an exemplary model answer demonstrating optimal structure and clarity. | Teaches candidates how to formulate top-tier interview responses. |
| **Final Diagnostic Report** | Comprehensive performance summary with category breakdown (Technical, Communication, Problem-Solving, Project Knowledge, Behavioral). | Pinpoints exact performance levels across all dimensions. |
| **Personalized 7-Day Plan** | Generates a structured daily schedule with actionable tasks targeting the candidate's exact identified weak areas. | Converts interview mistakes into an immediate, structured study routine. |
| **Dashboard Progress Tracking** | Historical score trends, strongest/weakest skills, and practice recommendations calculated from session data. | Visualizes improvement over time and motivates ongoing practice. |

---

## 4. What Makes It Different

| Dimension | Generic AI Chatbot | InterviewCoach AI |
|---|---|---|
| **Session Control** | User drives the conversation; prompts the bot. | AI Interviewer drives the session with structured cadence and role authority. |
| **Context Awareness** | Limited to pasted prompt text in chat window. | Deep multi-layer grounding: Resume text + Job Description + Experience Level + Personality. |
| **Question Flow** | Random or static back-and-forth chat. | State-machine progression: Q1 → Answer → AI Evaluation → Follow-up Decision → Next Question. |
| **Evaluation Depth** | Superficial praise or generic summaries. | Multi-metric 0–10 scoring, specific strengths, missing points, and suggested better answers. |
| **Voice Capability** | Text-only or browser-native robotic speech. | Full AWS voice pipeline: Browser MediaRecorder → S3 → Amazon Transcribe → Bedrock → Amazon Polly Neural. |
| **Post-Session Output** | Chat history only. | Comprehensive Diagnostic Report + 7-Day Personalized Improvement Plan. |
| **Mid-Session Switching** | Switching modes usually resets state. | Seamless Text ⇄ Voice mode switching mid-interview without session data loss. |

---

## 5. User Journey

```text
Landing Page
    │
    ▼
Register / Login (JWT Authentication)
    │
    ▼
Candidate Dashboard (Metrics, Score Trends, Recent Sessions)
    │
    ▼
Interview Setup Wizard
    ├── Select Role & Experience Level
    ├── Upload Resume (PDF/DOCX) & Paste Job Description
    ├── Select Interviewer Personality (Friendly / Professional / Strict)
    └── Choose Initial Mode (Text or Voice)
    │
    ▼
Active Interview Room
    ├── AI Interviewer poses Question 1 (with optional Polly audio playback)
    ├── Candidate submits Answer (Text input OR Voice recording)
    ├── AI evaluates response (Technical Accuracy, Completeness, Clarity)
    ├── Dynamic Follow-up triggered if clarification is warranted
    └── Continues through target question sequence
    │
    ▼
Interview Completion
    │
    ▼
Comprehensive Diagnostic Report
    ├── Overall Score (0–100) & Category Radar/Bar breakdown
    ├── Identified Key Strengths & Critical Areas to Improve
    ├── Question-by-Question Deep Dive (Transcript, Score, Missing Points, Better Answer)
    └── Personalized 7-Day Improvement Plan (Day-by-Day focused tasks)
    │
    ▼
Dashboard Progress Update (Updated average score, history record, practice recommendations)
```

---

## 6. Text Interview Architecture & Flow

In Text Mode, the candidate interacts through a real-time messaging interface:

```text
React (Candidate Text Answer)
    │
    ▼ POST /api/interviews/:id/answer
Express API Route (JWT Authentication & Session Ownership Guard)
    │
    ▼
Interview Engine (interviewEngine.js)
    ├── Loads Interview & QuestionAnswer session state from MongoDB
    ├── Enforces duplicate submission protection
    ├── Constructs prompt with Candidate Context, Past Answers, and Current Response
    │
    ▼
Amazon Bedrock (anthropic.claude-3-haiku-20240307-v1:0)
    ├── Evaluates Answer (Score 0-10, Strengths, Missing Points, Better Answer)
    └── Determines Next Step: Dynamic Follow-Up Question OR New Topic Question
    │
    ▼
MongoDB Transaction / Save
    ├── Appends QuestionAnswer record with evaluation metrics
    └── Updates Interview currentQuestionIndex and question list
    │
    ▼
Express Response (JSON)
    │
    ▼
React UI updates seamlessly with evaluation status and next active question
```

---

## 7. Voice Interview Architecture & Flow

The voice interview utilizes a reliable **Record → Send → Transcribe → Evaluate → Respond** architecture without the fragility of unstandardized WebRTC connections:

```text
User Speaks into Microphone
       │
       ▼
Browser MediaRecorder API (Records audio/webm or audio/mp4 blob)
       │
       ▼ POST /api/interviews/:id/voice-answer (multipart/form-data)
Express Middleware (Multer memoryStorage)
       │
       ▼
Amazon S3 (Uploads raw recording to private bucket 'interviewcoach1')
       │
       ▼
Amazon Transcribe (Dispatches StartTranscriptionJobCommand)
       │
       ▼ Polling loop checks GetTranscriptionJobCommand until COMPLETED
Transcript Retrieved (Parsed text extracted from Transcribe output)
       │
       ▼
Unified Interview Engine (Passed as answerText to evaluation engine)
       │
       ▼
Amazon Bedrock (Evaluates transcript and crafts next question)
       │
       ▼
Amazon Polly (SynthesizeSpeechCommand converts next question to Neural MP3)
       │
       ▼
S3 Upload / Base64 Data Stream returned to Express
       │
       ▼
React Client receives transcript, evaluation, next question, and audio playback URL
```

### Voice Engineering Safeguards:
- **MIME & Codec Sanitization**: Browsers often produce MIME types with codecs (e.g., `audio/webm;codecs=opus`). The voice service sanitizes media format headers so Amazon Transcribe receives valid formats (`webm`, `mp4`, `wav`, `mp3`).
- **Resilient Audio Fallback**: If an S3 audio upload fails, Polly speech synthesis gracefully falls back to streaming base64 audio data directly to the client, preventing session disruption.
- **Mid-Interview Mode Toggling**: Candidates can freely switch between Text and Voice modes at any point during the interview via `PATCH /api/interviews/:id/mode`. The session state is maintained seamlessly.

---

## 8. AWS Services — Detailed Integration

InterviewCoach AI integrates four core AWS services through the official **AWS SDK for JavaScript v3**:

```text
                               AWS CLOUD (ap-south-1)
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │   ┌──────────────────────┐                     ┌────────────────────────┐   │
 │   │    Amazon Bedrock    │                     │       Amazon S3        │   │
 │   │  (Claude 3 Haiku)    │                     │  (interviewcoach1)     │   │
 │   │                      │                     │                        │   │
 │   │ • Resume/JD Analysis │                     │ • Resume PDFs / DOCXs  │   │
 │   │ • Question Gen       │                     │ • Audio Recordings     │   │
 │   │ • Follow-up Logic    │                     │ • Synthesized Speech   │   │
 │   │ • Answer Evaluation  │                     │ • Private & Encrypted  │   │
 │   │ • 7-Day Study Plan   │                     └────────────────────────┘   │
 │   └──────────────────────┘                                                  │
 │                                                                             │
 │   ┌──────────────────────┐                     ┌────────────────────────┐   │
 │   │  Amazon Transcribe   │                     │      Amazon Polly      │   │
 │   │                      │                     │                        │   │
 │   │ • Speech-to-Text     │                     │ • Text-to-Speech       │   │
 │   │ • Asynchronous Jobs  │                     │ • Joanna Neural Engine │   │
 │   │ • en-US Audio        │                     │ • MP3 Audio Output     │   │
 │   └──────────────────────┘                     └────────────────────────┘   │
 │                                                                             │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Amazon Bedrock (`@aws-sdk/client-bedrock-runtime`)
- **Model**: `anthropic.claude-3-haiku-20240307-v1:0` in region `ap-south-1`.
- **Purpose**: Powers all cognitive intelligence—extracting key skills from resumes, analyzing target job descriptions, generating contextual questions, evaluating answers on a 0–10 scale, deciding when to ask follow-up questions, and synthesizing the final diagnostic report.
- **Integration**: Backend invokes Bedrock using `InvokeModelCommand` with strict system prompts that enforce structured JSON output.

### 2. Amazon S3 (`@aws-sdk/client-s3`)
- **Bucket**: `interviewcoach1` (Private, Server-Side Encrypted).
- **Purpose**: Secure off-database storage for uploaded resume documents (PDF/DOCX), candidate voice recording audio files, and synthesized interviewer audio clips.
- **Security**: Objects are stored in structured key hierarchies (`resumes/`, `voice-answers/`, `polly/`) and accessed securely via signed URLs or backend proxy streams.

### 3. Amazon Transcribe (`@aws-sdk/client-transcribe`)
- **Purpose**: Converts candidate audio recordings into clean text transcripts.
- **Integration**: Backend uploads the recording to S3, initiates a transcription job with `StartTranscriptionJobCommand`, polls `GetTranscriptionJobCommand` until completion, and extracts the resulting transcript for evaluation.

### 4. Amazon Polly (`@aws-sdk/client-polly`)
- **Voice**: `Joanna` (Engine: `neural`).
- **Purpose**: Converts AI question text into natural human speech for an authentic conversational experience.
- **Integration**: Invoked via `SynthesizeSpeechCommand` to output high-quality MP3 audio streams playable in the client browser.

### AWS Security & IAM Credentials:
- **Zero Frontend Secret Exposure**: AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) and endpoints are exclusively maintained in `Backend/.env` and are never exposed to the client.
- **Region Consistency**: All AWS services are deployed in `ap-south-1` (Asia Pacific - Mumbai) to minimize cross-region latency.

---

## 9. Architecture Decisions

### 1. Unified Interview Engine
Both Text and Voice answers are routed through the same core engine (`interviewEngine.js`). Once a voice answer is transcribed, it enters the identical evaluation and progression pipeline as a text response. This guarantees consistent scoring criteria, eliminates duplicate AI prompts, and ensures maintainability.

### 2. S3 for Binary Media Storage
Binary files (audio recordings, resume documents) are stored directly in Amazon S3 rather than MongoDB BSON documents. This prevents database bloat, maintains low MongoDB working set sizes, and leverages AWS S3's optimized media streaming and durability.

### 3. Derived Analytics without Data Duplication
Dashboard progress metrics (average score, completed interviews, skill breakdown, score trends) are computed directly from the existing `Interview` and `QuestionAnswer` collections using aggregation queries rather than maintaining a redundant `Progress` collection that could fall out of sync.

### 4. Resilient MongoDB Connection Strategy
The database configuration (`Backend/src/config/db.js`) includes DNS fallback (`dns.setServers(['1.1.1.1', '8.8.8.8'])`) to resolve Windows SRV lookup quirks on MongoDB Atlas clusters, along with an automatic fallback to local MongoDB (`127.0.0.1:27017/interviewcoach`) for offline local development.

### 5. Server Startup Dependency Ordering
`server.js` asynchronously awaits a confirmed MongoDB connection (`await connectDB()`) prior to executing `app.listen()`. This eliminates startup race conditions and command buffering timeouts.

---

## 10. AI Interview Engine & Scoring Framework

The intelligence layer evaluates each candidate response against four primary competencies:

```text
┌────────────────────────────────────────────────────────┐
│               EVALUATION METRICS (0–10)                │
├──────────────────────┬─────────────────────────────────┤
│ Technical Accuracy   │ Factual correctness, precision  │
│ Relevance & Depth    │ Directly addresses core concept │
│ Clarity & Structure  │ Concise, logical organization   │
│ Completeness         │ Edge cases, real-world examples │
└──────────────────────┴─────────────────────────────────┘
```

### JSON Output Contract:
Amazon Bedrock returns structured JSON matching this schema:
```json
{
  "evaluation": {
    "score": 8,
    "technicalAccuracy": 8,
    "communication": 9,
    "completeness": 7,
    "feedback": "Clear explanation of React state hooks; missed discussion of cleanup in useEffect.",
    "strengths": ["Clear definition of useState", "Good explanation of re-rendering"],
    "missingPoints": ["Cleanup function in useEffect for subscriptions"],
    "suggestedBetterAnswer": "When managing state in React, useState handles local state while useEffect manages side effects. For subscriptions or timers, returning a cleanup function prevents memory leaks..."
  },
  "isFollowUp": true,
  "nextQuestion": {
    "text": "How would you handle cleaning up an active WebSocket connection within that useEffect hook?",
    "category": "Technical Knowledge"
  }
}
```

---

## 11. Security & Data Protection

- **JWT Authentication**: Passwords hashed with `bcryptjs` (salt factor 10). Tokens signed with expiry (`7d`) and validated via `authMiddleware.js`.
- **IDOR / User Isolation**: Every interview, report, and answer query verifies document-level ownership (`findOne({ _id: req.params.id, userId: req.user.id })`). Users cannot access another candidate's sessions or reports.
- **Mongoose Schema Protections**: Passwords have `select: false` to prevent accidental inclusion in query projections.
- **HTTP Header Hardening**: Disabled Express framework fingerprinting via `app.disable('x-powered-by')`.
- **File Upload Restrictions**: Multer middleware limits file uploads to valid formats (PDF/DOCX for resumes; WebM/MP4/WAV for voice) and enforces a 10MB payload threshold.
- **Git Security**: Comprehensive `.gitignore` protecting `.env`, credentials, build artifacts, and dependency directories from source control.

---

## 12. Database Schema Design

The application utilizes three core MongoDB models:

### 1. `User` Model
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  timestamps: true
}
```

### 2. `Interview` Model
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, required: true },
  experienceLevel: { type: String, enum: ['Student', 'Fresher', '0-2 years', '2-5 years', '5+ years'] },
  mode: { type: String, enum: ['text', 'voice'], default: 'text' },
  personality: { type: String, enum: ['friendly', 'professional', 'strict'] },
  totalQuestionsTarget: { type: Number, default: 5 },
  currentQuestionIndex: { type: Number, default: 1 },
  status: { type: String, enum: ['setup', 'in_progress', 'completed'] },
  resume: { s3Url: String, extractedText: String, extractedSkills: [String] },
  jobDescription: { rawText: String, analysis: Object },
  questions: [{
    questionId: ObjectId,
    text: String,
    category: String,
    audioUrl: String,
    isFollowUp: Boolean,
    parentQuestionId: ObjectId
  }],
  categoryScores: {
    technicalKnowledge: Number,
    communication: Number,
    problemSolving: Number,
    projectKnowledge: Number,
    behavioral: Number
  },
  finalReport: {
    overallScore: Number,
    summary: String,
    strengths: [String],
    areasToImprove: [{ area: String, observation: String, recommendation: String }],
    improvementPlan: [{ day: Number, focus: String, tasks: [String] }]
  },
  timestamps: true
}
```

### 3. `QuestionAnswer` Model
```javascript
{
  interviewId: { type: ObjectId, ref: 'Interview', required: true, index: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  questionIndex: Number,
  questionText: String,
  category: String,
  isFollowUp: Boolean,
  parentQuestionId: ObjectId,
  answerMode: { type: String, enum: ['text', 'voice'] },
  answerText: String,
  audioS3Url: String,
  transcript: String,
  evaluation: {
    score: Number,
    technicalAccuracy: Number,
    communication: Number,
    completeness: Number,
    feedback: String,
    strengths: [String],
    missingPoints: [String],
    suggestedBetterAnswer: String
  },
  timestamps: true
}
```

---

## 13. API Documentation

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`). Returns JWT token.
- `POST /api/auth/login` — Authenticate existing account (`email`, `password`). Returns JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile (`Bearer <token>`).

### Resume
- `POST /api/resume/upload` — Upload resume (`multipart/form-data`, PDF/DOCX). Extracts text, identifies skills, and stores file in Amazon S3.

### Interviews
- `GET /api/interviews/dashboard/stats` — Calculate candidate dashboard metrics (total interviews, average score, skill ratings, score trends).
- `POST /api/interviews` — Create a new interview session (`role`, `experienceLevel`, `personality`, `mode`, `resumeText`, `jobDescription`).
- `GET /api/interviews` — List candidate's interview history with pagination and status filters.
- `GET /api/interviews/:id` — Get active session state and current active question.
- `POST /api/interviews/:id/answer` — Submit text answer (`{ answer: string }`). Evaluates response and advances session.
- `POST /api/interviews/:id/voice-answer` — Submit voice recording (`multipart/form-data`). Transcribes, evaluates, and returns next question with speech audio.
- `PATCH /api/interviews/:id/mode` — Switch mode mid-session (`{ mode: 'text' | 'voice' }`).
- `POST /api/interviews/:id/complete` — Conclude interview session and generate final diagnostic report and 7-day improvement plan.
- `GET /api/interviews/:id/report` — Fetch finalized diagnostic report and question breakdowns.

### System
- `GET /api/health` — Service health check endpoint returning API status and timestamp.

---

## 14. Project Structure

```text
interviewCoach/
├── README.md                      # Comprehensive project documentation
├── .gitignore                     # Git exclusion rules for node_modules, .env, and dist
│
├── frontend/                      # React SPA Client (Vite + Tailwind CSS)
│   ├── index.html                 # HTML shell
│   ├── package.json               # Frontend dependencies (React 19, Lucide, Axios)
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind styling design tokens
│   ├── .env.example               # Frontend environment template
│   └── src/
│       ├── App.jsx                # Route definitions and application layout
│       ├── main.jsx               # React DOM entrypoint
│       ├── context/
│       │   └── AuthContext.jsx    # Authentication provider & JWT state
│       ├── pages/
│       │   ├── LandingPage.jsx        # Value proposition and feature showcase
│       │   ├── LoginPage.jsx          # Candidate authentication
│       │   ├── RegisterPage.jsx       # Account registration
│       │   ├── DashboardPage.jsx      # Progress dashboard and analytics
│       │   ├── InterviewSetupPage.jsx # Setup wizard (role, resume, JD, personality)
│       │   ├── InterviewRoomPage.jsx  # Active interview room (text & voice)
│       │   ├── InterviewReportPage.jsx# Final diagnostic report & 7-day plan
│       │   ├── InterviewHistoryPage.jsx# Completed interview log
│       │   └── ProfilePage.jsx        # Account and profile settings
│       ├── components/
│       │   ├── Navbar.jsx             # Top navigation bar
│       │   ├── VoiceRecorder.jsx      # Native MediaRecorder recording UI
│       │   ├── ProgressChart.jsx      # Score progress trend visualization
│       │   └── ProtectedRoute.jsx     # Route authentication guard
│       └── services/
│           ├── api.js                 # Axios instance with interceptors
│           ├── authService.js         # Auth API calls
│           └── interviewService.js    # Interview, resume, and voice API calls
│
└── Backend/                       # Node.js + Express API Server
    ├── server.js                  # Server entrypoint and middleware assembly
    ├── package.json               # Backend dependencies (AWS SDK v3, Mongoose)
    ├── .env.example               # Backend environment variables template
    ├── qa_audit_test.js           # Automated pre-deployment test suite (21 assertions)
    └── src/
        ├── config/
        │   ├── db.js              # Resilient MongoDB connection with DNS fallback
        │   └── awsConfig.js       # AWS SDK v3 client instantiations
        ├── models/
        │   ├── User.js            # User authentication model
        │   ├── Interview.js       # Core interview session model
        │   └── QuestionAnswer.js  # Question/answer evaluation model
        ├── middleware/
        │   ├── authMiddleware.js  # JWT verification middleware
        │   ├── uploadMiddleware.js# Multer memory storage configuration
        │   └── errorHandler.js    # Global error and AWS exception handler
        ├── controllers/
        │   ├── authController.js      # Auth request handlers
        │   ├── resumeController.js    # Resume upload & text extraction
        │   └── interviewController.js # Session, answer, and report handlers
        ├── routes/
        │   ├── authRoutes.js          # /api/auth routes
        │   ├── resumeRoutes.js        # /api/resume routes
        │   └── interviewRoutes.js     # /api/interviews routes
        └── services/
            ├── ai/
            │   └── bedrockService.js  # Amazon Bedrock prompt engineering
            ├── aws/
            │   ├── s3Service.js       # Amazon S3 upload & retrieve
            │   ├── transcribeService.js# Amazon Transcribe speech-to-text
            │   └── pollyService.js    # Amazon Polly text-to-speech
            ├── resume/
            │   └── resumeParser.js    # PDF & DOCX text extraction
            ├── voice/
            │   └── voiceService.js    # S3 + Transcribe orchestration
            └── interview/
                └── interviewEngine.js # Unified interview orchestration engine
```

---

## 15. Technology Stack

| Layer | Technology | Version / Specification |
|---|---|---|
| **Frontend Framework** | React.js | `^19.2.8` |
| **Build Tool** | Vite | `^8.3.0` |
| **Styling** | Tailwind CSS | `^3.4.19` |
| **Icons** | Lucide React | `^1.47.0` |
| **Routing** | React Router DOM | `^7.18.4` |
| **HTTP Client** | Axios | `^1.20.0` |
| **Backend Runtime** | Node.js (ES Modules) | `>= 18.0.0` |
| **Web Framework** | Express.js | `^4.21.2` |
| **Database** | MongoDB / Mongoose | `^8.12.1` |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | `^9.0.2` / `^2.4.3` |
| **Cloud Provider** | Amazon Web Services (AWS) | SDK v3 (`@aws-sdk/*`) |
| **Generative AI** | Amazon Bedrock | Anthropic Claude 3 Haiku |
| **Object Storage** | Amazon S3 | `ap-south-1` Bucket |
| **Speech-to-Text** | Amazon Transcribe | `en-US` Speech-to-Text |
| **Text-to-Speech** | Amazon Polly | Neural Engine (`Joanna`) |
| **Document Parsers** | `pdf-parse` + `mammoth` | PDF & DOCX parsing |

---

## 16. Local Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) OR MongoDB Atlas URI
- **AWS Account**: Active AWS account with permissions for Bedrock, S3, Transcribe, and Polly in `ap-south-1`

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/interviewCoach.git
cd interviewCoach
```

### 2. Configure Backend Environment
Create `Backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/interviewcoach

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Amazon Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Amazon S3
S3_BUCKET_NAME=interviewcoach1

# Amazon Transcribe & Polly
TRANSCRIBE_LANGUAGE_CODE=en-US
POLLY_VOICE_ID=Joanna
POLLY_ENGINE=neural
```

### 3. Configure Frontend Environment
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Install Dependencies
```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 5. Run Pre-Deployment Verification Test Suite
Run the automated QA test suite to verify database, security, and AWS services:
```bash
cd Backend
node qa_audit_test.js
```
*Expected result: 21 of 21 assertions pass.*

### 6. Start Development Servers
In separate terminal windows:
```bash
# Terminal 1: Backend Server (Port 5000)
cd Backend
npm run dev

# Terminal 2: Frontend Server (Port 5173 / 5174)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser to begin practicing interviews.

---

## 17. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
