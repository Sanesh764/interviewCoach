import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
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
    <div className="bg-[#222222] border border-[#333333] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#333333]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#B8FF00] flex items-center justify-center text-[#222222] shadow-md shadow-[#B8FF00]/15">
            <Bot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">AI Interviewer</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#2A2A2A] text-[#D0D0D0] border border-[#444444]">
                {getPersonalityLabel(personality)}
              </span>
            </div>
            <p className="text-xs text-[#A0A0A0] font-mono mt-0.5">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFollowUp && (
            <Badge variant="lime" size="sm" icon={Sparkles}>
              Follow-Up Probe
            </Badge>
          )}
          <Badge variant="charcoal" size="sm">
            {category || 'Technical'}
          </Badge>
        </div>
      </div>

      {/* Question Text */}
      <div className="my-5">
        <blockquote className="text-lg sm:text-2xl font-bold text-white leading-relaxed tracking-tight">
          "{question}"
        </blockquote>
      </div>

      {/* Audio Playback if available */}
      {aiSpeechAudioUrl && (
        <div className="mt-6 pt-4 border-t border-[#333333] flex items-center justify-between">
          <AudioPlayer audioUrl={aiSpeechAudioUrl} autoPlay={true} />
        </div>
      )}
    </div>
  );
};
