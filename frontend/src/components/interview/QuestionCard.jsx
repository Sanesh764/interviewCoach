import React from 'react';
import { Bot, Sparkles, HelpCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { Badge } from '../common/Badge';

export const QuestionCard = ({
  questionNumber,
  totalQuestions,
  question,
  category,
  personality,
  isFollowUp = false,
  aiSpeechAudioUrl,
}) => {
  const getCategoryVariant = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'technical':
        return 'indigo';
      case 'project':
        return 'emerald';
      case 'behavioral':
        return 'purple';
      case 'follow-up':
        return 'amber';
      default:
        return 'sky';
    }
  };

  const getPersonalityLabel = (p) => {
    switch (p?.toLowerCase()) {
      case 'friendly':
        return 'Friendly Interviewer';
      case 'strict':
        return 'Strict Interviewer';
      default:
        return 'Professional Interviewer';
    }
  };

  return (
    <div className="bg-surface-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-white/5">
      {/* Background accent light */}
      <div className="absolute top-0 right-0 w-72 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">AI Interviewer</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-800 text-slate-300 border border-slate-700">
                {getPersonalityLabel(personality)}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFollowUp && (
            <Badge variant="amber" size="sm" icon={Sparkles}>
              Follow-Up Probe
            </Badge>
          )}
          <Badge variant={getCategoryVariant(category)} size="sm">
            {category || 'Technical'}
          </Badge>
        </div>
      </div>

      {/* Question Text */}
      <div className="my-5">
        <blockquote className="text-lg sm:text-2xl font-semibold text-white leading-relaxed tracking-tight">
          "{question}"
        </blockquote>
      </div>

      {/* Audio Playback if available */}
      {aiSpeechAudioUrl && (
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <AudioPlayer audioUrl={aiSpeechAudioUrl} autoPlay={true} />
        </div>
      )}
    </div>
  );
};

