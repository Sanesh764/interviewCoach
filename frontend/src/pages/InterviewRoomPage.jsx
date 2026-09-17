import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
  MessageSquare,
  Mic,
  Send,
  AlertCircle,
  Flag
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { QuestionCard } from '../components/interview/QuestionCard';
import { VoiceRecorder } from '../components/interview/VoiceRecorder';
import { LoadingIndicator } from '../components/interview/LoadingIndicator';

export const InterviewRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [mode, setMode] = useState('text');
  const [textAnswer, setTextAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState(null); // 'transcribing' | 'evaluating' | 'generating' | 'finishing'
  const [error, setError] = useState('');
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('');

  // Fetch initial session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterview(id);
        setInterview(data.interview);
        setCurrentQuestion(data.currentQuestion);
        setMode(data.interview.mode || 'text');

        if (data.interview.status === 'completed') {
          navigate(`/interview/report/${id}`);
        }
      } catch (err) {
        console.error('[Interview Room Error]', err);
        setError(err.response?.data?.message || 'Failed to load interview session.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, navigate]);

  // Mode switcher (Text <-> Voice mid-interview)
  const handleModeSwitch = async (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    try {
      await interviewService.switchMode(id, newMode);
    } catch (err) {
      console.warn('[Mode Switch Warning]', err);
    }
  };

  // Submit Text Answer
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setError('Please type your answer before submitting.');
      return;
    }

    setError('');
    setProcessingStatus('evaluating');

    try {
      const response = await interviewService.submitTextAnswer(id, textAnswer.trim());
      setTextAnswer('');
      setLastVoiceTranscript('');

      if (response.completed) {
        setProcessingStatus('finishing');
        navigate(`/interview/report/${id}`);
      } else {
        setInterview(response.interview);
        setCurrentQuestion(response.nextQuestion);
        setProcessingStatus(null);
      }
    } catch (err) {
      console.error('[Text Submit Error]', err);
      setError(err.response?.data?.message || 'Failed to submit answer.');
      setProcessingStatus(null);
    }
  };

  // Submit Voice Answer
  const handleVoiceSubmit = async (audioBlob) => {
    setError('');
    setProcessingStatus('transcribing');

    try {
      const response = await interviewService.submitVoiceAnswer(id, audioBlob);

      if (response.transcript) {
        setLastVoiceTranscript(response.transcript);
      }

      if (response.completed) {
        setProcessingStatus('finishing');
        navigate(`/interview/report/${id}`);
      } else {
        setInterview(response.interview);
        setCurrentQuestion(response.nextQuestion);
        setProcessingStatus(null);
      }
    } catch (err) {
      console.error('[Voice Submit Error]', err);
      setError(
        err.response?.data?.message ||
          'Failed to process voice answer. Check AWS Transcribe and Bedrock configuration.'
      );
      setProcessingStatus(null);
    }
  };

  // Conclude interview early
  const handleFinishEarly = async () => {
    if (!window.confirm('Are you sure you want to conclude the interview and generate your report now?')) {
      return;
    }
    setProcessingStatus('finishing');
    try {
      await interviewService.completeInterview(id);
      navigate(`/interview/report/${id}`);
    } catch (err) {
      console.error('[Finish Early Error]', err);
      setError('Failed to conclude interview.');
      setProcessingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <LoadingIndicator status="evaluating" message="Preparing interview environment..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Session Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            {interview?.currentQuestionIndex || 1}
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Active Interview</span>
            <span className="text-sm font-bold text-white">{interview?.role}</span>
          </div>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => handleModeSwitch('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Text
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('voice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'voice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice
          </button>
        </div>

        {/* Conclude early button */}
        <button
          type="button"
          onClick={handleFinishEarly}
          disabled={!!processingStatus}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Conclude Interview
        </button>
      </div>

      {/* Error Message if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-rose-300">Action Required</h5>
            <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Main AI Question Card */}
      {currentQuestion && (
        <QuestionCard
          questionNumber={interview?.currentQuestionIndex || 1}
          totalQuestions={interview?.totalQuestionsTarget || 5}
          question={currentQuestion.question}
          category={currentQuestion.category}
          personality={interview?.personality}
          isFollowUp={currentQuestion.isFollowUp}
          aiSpeechAudioUrl={currentQuestion.aiSpeechAudioUrl}
        />
      )}

      {/* Display last voice transcript if available */}
      {lastVoiceTranscript && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <Mic className="w-3.5 h-3.5" />
            Transcribed Voice Answer:
          </div>
          <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
            "{lastVoiceTranscript}"
          </p>
        </div>
      )}

      {/* Loading processing state overlay */}
      {processingStatus ? (
        <LoadingIndicator status={processingStatus} />
      ) : (
        /* Candidate Input Area */
        <div className="pt-2">
          {mode === 'text' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Your Answer
                </label>
                <span className="text-[11px] text-slate-400">
                  Be specific, mention trade-offs, and reference real examples
                </span>
              </div>

              <textarea
                rows={6}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your detailed answer here... (e.g., how you solved the problem, technical reasons, metrics, or lessons learned)"
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  {textAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleTextSubmit}
                  icon={Send}
                  disabled={!textAnswer.trim()}
                >
                  Submit Answer
                </Button>
              </div>
            </Card>
          ) : (
            <VoiceRecorder
              onSendAnswer={handleVoiceSubmit}
              isProcessing={!!processingStatus}
            />
          )}
        </div>
      )}
    </div>
  );
};
