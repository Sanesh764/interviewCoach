import React from 'react';
import { Loader2, Sparkles, Mic, FileText, Bot } from 'lucide-react';

export const LoadingIndicator = ({ status = 'analyzing', message }) => {
  const getDetails = () => {
    switch (status) {
      case 'transcribing':
        return {
          icon: Mic,
          title: 'Transcribing Voice Response',
          desc: message || 'Amazon Transcribe is converting your speech recording into text...',
          color: 'text-rose-400',
        };
      case 'evaluating':
        return {
          icon: Bot,
          title: 'Evaluating Response',
          desc: message || 'Amazon Bedrock is evaluating your answer across accuracy, depth, and clarity...',
          color: 'text-indigo-400',
        };
      case 'generating':
        return {
          icon: Sparkles,
          title: 'Synthesizing Next Question',
          desc: message || 'Deciding follow-up logic and preparing the next topic...',
          color: 'text-amber-400',
        };
      case 'finishing':
        return {
          icon: FileText,
          title: 'Compiling Final Report',
          desc: message || 'Calculating category scores and building your 7-Day Improvement Plan...',
          color: 'text-emerald-400',
        };
      default:
        return {
          icon: Bot,
          title: 'AI Processing',
          desc: message || 'Analyzing interview data with Amazon Bedrock...',
          color: 'text-indigo-400',
        };
    }
  };

  const info = getDetails();
  const Icon = info.icon;

  return (
    <div className="bg-surface-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl text-center max-w-md mx-auto my-8 shadow-2xl ring-1 ring-white/5">
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-950 border border-slate-800 flex items-center justify-center shadow-inner">
          <Icon className={`w-8 h-8 ${info.color} animate-pulse`} />
        </div>
        <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-surface-900 border border-slate-800 shadow-md">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        </div>
      </div>
      <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">{info.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{info.desc}</p>
    </div>
  );
};

