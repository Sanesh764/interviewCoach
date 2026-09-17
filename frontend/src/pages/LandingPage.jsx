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
  Layers,
  BarChart3,
  ShieldCheck,
  BrainCircuit,
  Volume2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 text-center max-w-4xl mx-auto px-4">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen AI Interview Simulator & Personal Coach</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
          Practice Interviews. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            Get Better. Get Hired.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An AI-powered interviewer that adapts to your resume, target job description, and live answers with intelligent follow-up questions and actionable coaching.
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

        {/* Key trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Amazon Bedrock LLM Intelligence
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AWS Transcribe & Polly Voice
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Personalized 7-Day Roadmap
          </span>
        </div>
      </section>

      {/* Two Interview Modes Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Two Natural Modes to Practice</h2>
          <p className="text-slate-400 mt-2">Switch effortlessly between typing and speaking mid-interview</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Text Mode Card */}
          <Card className="border-indigo-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Text Interview Mode</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Take your time to structure thoughtful, precise answers. Ideal for deep-dive technical explanations, algorithm trade-offs, and system architecture questions.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-indigo-400 font-semibold">AI Interviewer:</div>
                <div>"How did you implement JWT authentication and token expiration in your project?"</div>
                <div className="pt-2 text-slate-400 font-semibold">Your Answer:</div>
                <div className="text-slate-200">"I used jsonwebtoken with an access token in headers and short expiration..."</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center text-xs text-indigo-400 font-medium">
              <span>Includes instant analysis + follow-up probes</span>
            </div>
          </Card>

          {/* Voice Mode Card */}
          <Card className="border-indigo-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Voice Interview Mode</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Simulate real video or phone screens with Record → S3 → Transcribe → Polly. Listen to the AI speak, record your answer, review playback, and submit.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 font-semibold">AI Voice:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Amazon Polly
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-slate-200">"Tell me about your most challenging technical obstacle."</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>MediaRecorder: Audio recorded & transcribed via Amazon Transcribe</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center text-xs text-indigo-400 font-medium">
              <span>Listen, speak, inspect transcript & receive speech reply</span>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Steps */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">How InterviewCoach AI Works</h2>
          <p className="text-slate-400 mt-2">From setup to mastery in 4 focused steps</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-700/60 bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              1
            </div>
            <h4 className="text-base font-bold text-white mb-2">Setup & Context</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select your role, experience level, and personality (Friendly, Professional, or Strict). Upload your resume or paste the Job Description.
            </p>
          </Card>

          <Card className="border-slate-700/60 bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              2
            </div>
            <h4 className="text-base font-bold text-white mb-2">Dynamic Interview</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI generates tailored questions. If you mention a specific library or give a shallow answer, it generates an intelligent follow-up probe.
            </p>
          </Card>

          <Card className="border-slate-700/60 bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              3
            </div>
            <h4 className="text-base font-bold text-white mb-2">Deep Evaluation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each answer is graded across Technical Accuracy, Relevance, Depth, and Clarity, noting strengths, missing points, and better answer models.
            </p>
          </Card>

          <Card className="border-slate-700/60 bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-base mb-4 border border-indigo-500/20">
              4
            </div>
            <h4 className="text-base font-bold text-white mb-2">7-Day Action Plan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive a concrete report detailing weak areas and a custom 7-day curriculum to bridge every knowledge gap before your real interview.
            </p>
          </Card>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Built for Realistic Interview Mastery</h2>
          <p className="text-slate-400 mt-2">Not a generic chatbot — an authentic interview simulator</p>
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
            <h3 className="text-lg font-bold text-white mb-2">Objective Scoring</h3>
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
            <h3 className="text-lg font-bold text-white mb-2">AWS Cloud Power</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Harnesses Amazon Bedrock for reasoning, Amazon S3 for storage, Amazon Transcribe for speech-to-text, and Amazon Polly for lifelike voice synthesis.
            </p>
          </Card>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-indigo-800/40 to-slate-900/80 border border-indigo-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
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
