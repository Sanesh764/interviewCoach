import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

const GithubIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = "w-3.5 h-3.5 text-sky-400" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070b14] text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Mission */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/90 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">InterviewCoach AI</span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <p className="text-xs text-slate-500">
              Practice smarter. Interview better. Production-grade AI mock interviews.
            </p>
          </div>

          {/* Creator Attribution & Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="text-slate-500">
              Built by <span className="text-slate-200 font-medium">Sanesh Kumar</span>
            </span>
            <a
              href="https://github.com/Sanesh764/interviewCoach"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/sanesh7644/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
          <div>
            Powered by Amazon Bedrock (Claude 3 Haiku) • AWS Polly Neural • AWS Transcribe • Amazon S3
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>© {new Date().getFullYear()} InterviewCoach AI. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

