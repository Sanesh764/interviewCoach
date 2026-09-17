import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">InterviewCoach AI</span>
          <span className="text-xs text-slate-500">• Practice smarter. Interview better.</span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>Powered by Amazon Bedrock, Transcribe, Polly & S3</span>
        </div>
      </div>
    </footer>
  );
};
