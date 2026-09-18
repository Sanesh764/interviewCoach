# InterviewCoach AI — Frontend Client

<div align="center">

### **Modern Dark-First Candidate SaaS Interface**

Built with **React 19**, **Vite**, and **Tailwind CSS**. Inspired by **Linear, Vercel, and Raycast**.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide%20React-orange?style=flat-square)](https://lucide.dev/)

</div>

---

## 🎨 Design System & Visual Philosophy

The client interface is designed around a **dark-first neutral aesthetic**:
- **Background & Surfaces**: Deep obsidian surfaces (`#070b14`, `#0c1222`, `#11182c`, `#162038`) with subtle border highlights (`border-surface-700/50`).
- **Typography**: `Inter` for clean UI text and `JetBrains Mono` for latency badges, scores, question indices, and numerical metrics.
- **Glassmorphic Elements**: `.glass-card` and `.glass-panel` utilities with `backdrop-blur-xl` and subtle radial gradients.
- **Micro-Interactions**: Hover lifts, smooth tab transitions, and animated recording waveforms for voice responses.

---

## 🧭 Page Architecture & Routes

| Route | Component | Description | Access |
|---|---|---|---|
| `/` | `LandingPage.jsx` | Hero value proposition, interactive product UI preview, 4-step candidate journey, and engineering capability matrix. | Public |
| `/login` | `LoginPage.jsx` | Asymmetric split-screen candidate authentication with security highlights and password visibility toggle. | Public |
| `/register` | `RegisterPage.jsx` | Account registration with password strength indicators and instant redirect. | Public |
| `/dashboard` | `DashboardPage.jsx` | Candidate command center with metric tiles, interactive SVG progress curve, and recent interview cards. | Protected |
| `/interview/setup` | `InterviewSetupPage.jsx` | Multi-step configuration wizard (role pills, experience level, text/voice mode, personality demeanor, drag-and-drop resume, and target JD). | Protected |
| `/interview/room/:id` | `InterviewRoomPage.jsx` | Active interview room supporting text input, real-time MediaRecorder voice capture, dynamic follow-up badges, and Polly neural audio playback. | Protected |
| `/interview/report/:id` | `InterviewReportPage.jsx` | Post-session performance breakdown: 0–100 overall score, category radar/chips, question-by-question model answers, and 7-day study curriculum. | Protected |
| `/interview/history` | `InterviewHistoryPage.jsx` | Chronological session archive with filter tabs (All / Text / Voice) and quick report access. | Protected |
| `/profile` | `ProfilePage.jsx` | User account settings, avatar initial badge, and data isolation details. | Protected |

---

## 🛠️ Key UI Components

- **`VoiceRecorder.jsx`**: In-browser audio recording using standard HTML5 `MediaRecorder`. Provides live animated audio waveforms, elapsed timer, review audio playback player, and an explicit submission action.
- **`QuestionCard.jsx`**: Card rendering interviewer personality badge, category pill (`Technical`, `Behavioral`, `Follow-up`), question text, dynamic follow-up probe alert, and the neural audio player.
- **`AudioPlayer.jsx`**: Custom audio playback component for Amazon Polly synthesized voice with progress scrubbing and replay controls.
- **`ProgressChart.jsx`**: Pure SVG performance trajectory visualization with gradient area fills, dashed average guides, and interactive data point hovers.
- **`Badge.jsx`**: Reusable semantic badge supporting status indicators, theme variants (`indigo`, `emerald`, `amber`, `rose`, `sky`, `purple`), and custom leading icons.
- **`LoadingIndicator.jsx`**: Informative loading spinners for audio transcription, Bedrock evaluation, question synthesis, and report compilation.

---

## ⚡ Setup & Development

### 1. Configure Environment
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Runs Vite dev server with Hot Module Replacement (HMR) at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized, tree-shaken static production bundle in `frontend/dist/`.

---

## 📄 License

This frontend is part of the [InterviewCoach AI](https://github.com/Sanesh764/interviewCoach) project and is licensed under the MIT License.
