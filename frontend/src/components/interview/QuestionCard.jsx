import { Bot, Sparkles } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

export const QuestionCard = ({
  questionNumber,
  totalQuestions,
  question,
  category,
  personality,
  isFollowUp = false,
  aiSpeechAudioUrl,
}) => {
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'technical':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'project':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'behavioral':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'follow-up':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
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
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Background accent light */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">AI Interviewer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 border border-slate-600">
                {getPersonalityLabel(personality)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFollowUp && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Follow-Up Question
            </span>
          )}
          <span
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getCategoryColor(
              category
            )}`}
          >
            {category || 'Technical'}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="my-4">
        <blockquote className="text-xl sm:text-2xl font-semibold text-white leading-relaxed tracking-tight">
          "{question}"
        </blockquote>
      </div>

      {/* Audio Playback if available */}
      {aiSpeechAudioUrl && (
        <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
          <AudioPlayer audioUrl={aiSpeechAudioUrl} autoPlay={true} />
        </div>
      )}
    </div>
  );
};
