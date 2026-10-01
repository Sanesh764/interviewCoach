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
        };
      case 'evaluating':
        return {
          icon: Bot,
          title: 'Evaluating Response',
          desc: message || 'Amazon Bedrock is evaluating your answer across accuracy, depth, and clarity...',
        };
      case 'generating':
        return {
          icon: Sparkles,
          title: 'Synthesizing Next Question',
          desc: message || 'Deciding follow-up logic and preparing the next topic...',
        };
      case 'finishing':
        return {
          icon: FileText,
          title: 'Compiling Final Report',
          desc: message || 'Calculating category scores and building your 7-Day Improvement Plan...',
        };
      default:
        return {
          icon: Bot,
          title: 'AI Processing',
          desc: message || 'Analyzing interview data with Amazon Bedrock...',
        };
    }
  };

  const info = getDetails();
  const Icon = info.icon;

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-3xl p-8 backdrop-blur-xl text-center max-w-md mx-auto my-8 shadow-2xl">
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-[#181818] border border-[#333333] flex items-center justify-center shadow-inner">
          <Icon className="w-8 h-8 text-[#B8FF00] animate-pulse" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#2A2A2A] border border-[#444444] shadow-md">
          <Loader2 className="w-4 h-4 text-[#B8FF00] animate-spin" />
        </div>
      </div>
      <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">{info.title}</h3>
      <p className="text-xs text-[#A0A0A0] leading-relaxed max-w-xs mx-auto">{info.desc}</p>
    </div>
  );
};
