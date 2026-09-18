import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mic,
  MessageSquare,
  FileText,
  Briefcase,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BrainCircuit,
  Volume2,
  ShieldCheck,
  Zap,
  Terminal,
  Play
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 text-center max-w-5xl mx-auto px-4">
        {/* Subtle background ambient glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-indigo-500/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-900 border border-slate-800 text-indigo-300 text-xs font-medium mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Production-Ready AI Interview Practice Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12]">
          Practice Smarter. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            Interview Better.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An AI interviewer that adapts to your actual resume, target job description, and live voice or text answers with rigorous follow-up questions and multi-metric evaluations.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={isAuthenticated ? '/interview/setup' : '/register'}>
            <Button size="xl" variant="primary" icon={ArrowRight}>
              Start Practice Interview
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="xl" variant="secondary">
              See How It Works
            </Button>
          </a>
        </div>

        {/* Highlights Strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Amazon Bedrock Intelligence
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AWS Polly & Transcribe Voice
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resume & JD Extraction
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Actionable 7-Day Curriculum
          </span>
        </div>

        {/* Realistic Interactive Product UI Mockup */}
        <div className="mt-14 max-w-4xl mx-auto text-left">
          <div className="rounded-2xl border border-slate-800 bg-surface-900/90 shadow-2xl overflow-hidden backdrop-blur-xl ring-1 ring-white/10">
            {/* Window Chrome Header */}
            <div className="px-4 py-3 bg-surface-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  interview-session · Full Stack Developer · Question 2 of 5
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="sm" dot>Live Mode</Badge>
              </div>
            </div>

            {/* Simulated Interview Stage */}
            <div className="p-6 space-y-5">
              {/* Question Bubble */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-surface-850 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-400">AI Interviewer (Professional Tone)</span>
                    <span className="text-[11px] text-slate-500 font-mono">Joanna Neural Audio Ready</span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    "I see from your resume that you architected a caching layer using Redis for your microservices. How did you handle cache invalidation and prevent the thundering herd problem during sudden traffic spikes?"
                  </p>
                </div>
              </div>

              {/* Candidate Response Bubble */}
              <div className="flex items-start gap-3.5 pl-6 sm:pl-12">
                <div className="flex-1 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-indigo-300">Candidate Answer (Voice via AWS Transcribe)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Transcribed in 1.4s
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    "We used a cache-aside pattern with probabilistic early expiration (XFetch algorithm) so hot keys refresh before expiry. For the thundering herd, we acquired a distributed mutex lock in Redis before querying PostgreSQL..."
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Real-time Dynamic Probe Badge */}
              <div className="bg-surface-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">Dynamic Follow-Up Triggered:</strong> Probing mutex failover and timeout edge cases.
                  </span>
                </div>
                <Badge variant="emerald" size="sm">Score: 92/100</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Interview Modes Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="indigo" size="sm" className="mb-3">Versatile Practice</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Two Natural Modes to Practice</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Switch effortlessly between typing and speaking mid-interview</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Text Mode Card */}
          <Card className="p-8 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Text Interview Mode</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Take your time to compose structured, thoughtful explanations. Ideal for technical deep dives, data structure analysis, and system architecture questions.
              </p>

              <div className="bg-surface-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-indigo-400 font-semibold">AI Interviewer:</div>
                <div>"How did you implement JWT authentication and token expiration in your project?"</div>
                <div className="pt-2 text-slate-400 font-semibold">Your Answer:</div>
                <div className="text-slate-200">"I used jsonwebtoken with an access token in headers and short expiration..."</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-medium">
              <span>Instant token-efficient evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>

          {/* Voice Mode Card */}
          <Card className="p-8 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Voice Interview Mode</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Simulate real video or phone screens. Listen to natural voice output via AWS Polly Neural, speak your answer through Amazon Transcribe, and review playback.
              </p>

              <div className="bg-surface-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 font-semibold">AI Voice:</span>
                  <Badge variant="indigo" size="sm" icon={Volume2}>AWS Polly Joanna</Badge>
                </div>
                <div className="flex items-center gap-3 bg-surface-850 p-2.5 rounded-lg border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Play className="w-3 h-3 text-white fill-current" />
                  </div>
                  <span className="text-slate-200">"Tell me about your most challenging technical obstacle."</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>MediaRecorder → Amazon S3 → Amazon Transcribe speech-to-text</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-medium">
              <span>Lifelike spoken conversation</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Steps */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="indigo" size="sm" className="mb-3">Simple 4-Step Process</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">How InterviewCoach AI Works</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">From setup to mastery in 4 focused steps</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              01
            </div>
            <h4 className="text-base font-bold text-white mb-2">Role & Context</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select your role, experience level, and interviewer style (Friendly, Professional, or Strict). Upload your resume or paste the Job Description.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              02
            </div>
            <h4 className="text-base font-bold text-white mb-2">Dynamic Questions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI crafts contextual interview questions. Shallow answers or mentioned libraries immediately trigger dynamic follow-up probes.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              03
            </div>
            <h4 className="text-base font-bold text-white mb-2">Deep Evaluation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every answer is evaluated across Technical Accuracy, Relevance, Depth, and Clarity, noting strengths, missing points, and better answer models.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              04
            </div>
            <h4 className="text-base font-bold text-white mb-2">7-Day Study Plan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive a diagnostic report with identified weak areas and an actionable 7-day curriculum to bridge every knowledge gap before your real interview.
            </p>
          </Card>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <Badge variant="indigo" size="sm" className="mb-3">Core Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Built for Realistic Interview Mastery</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Not a generic chatbot — an authentic, multi-turn interview simulator</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <FileText className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Resume-Aware Questioning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts projects, libraries, and experience from PDF/DOCX to interrogate you on your actual past work just like a senior engineering manager.
            </p>
          </Card>

          <Card className="p-6">
            <Briefcase className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Target JD Alignment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste the job posting to ensure the interview drills down into required technologies, team responsibilities, and expected competencies.
            </p>
          </Card>

          <Card className="p-6">
            <BrainCircuit className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Dynamic Follow-Up Logic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The conversation adapts to what you actually say. Shallow answers trigger follow-up questions to test if you truly understand the trade-offs.
            </p>
          </Card>

          <Card className="p-6">
            <Award className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Multi-Metric Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consistent multi-dimensional rubric evaluating Technical Accuracy, Clarity, Communication, Problem Solving, and Project Knowledge.
            </p>
          </Card>

          <Card className="p-6">
            <TrendingUp className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Progress Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track improvement trajectories across multiple sessions to see your confidence and technical clarity rise before interview day.
            </p>
          </Card>

          <Card className="p-6">
            <Cpu className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Native AWS Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Harnesses Amazon Bedrock (Claude 3 Haiku) for reasoning, Amazon S3 for storage, Amazon Transcribe for speech-to-text, and AWS Polly Neural for voice.
            </p>
          </Card>
        </div>
      </section>

      {/* Creator Attribution Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl border border-slate-800 bg-surface-900/80 p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <Badge variant="indigo" size="sm">Creator</Badge>
            <h3 className="text-xl font-bold text-white">Built by Sanesh Kumar</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
              Full-stack AI developer crafting practical developer tools and intelligent agentic applications. Built with React, Express, MongoDB Atlas, and AWS Serverless services.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com/Sanesh764/interviewCoach"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-sm font-medium transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
            <a
              href="https://www.linkedin.com/in/sanesh7644/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-md shadow-indigo-600/25"
            >
              <LinkedinIcon className="w-4 h-4" />
              <span>Connect on LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950/60 via-indigo-900/40 to-surface-950 border border-indigo-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to ace your next interview?</h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Create an account, pick your target role, and experience a realistic interview simulation tailored to you.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to={isAuthenticated ? '/interview/setup' : '/register'}>
              <Button size="xl" variant="primary" icon={ArrowRight}>
                Start Now Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

