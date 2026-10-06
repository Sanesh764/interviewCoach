import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  ThumbsUp,
  XCircle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Mic,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ScoreCard } from '../components/common/ScoreCard';
import { Badge } from '../components/common/Badge';
import { LoadingIndicator } from '../components/interview/LoadingIndicator';

export const InterviewReportPage = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterviewReport(id);
        setReportData(data);
      } catch (err) {
        console.error('[Report Fetch Error]', err);
        setError(err.response?.data?.message || 'Failed to load interview report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <LoadingIndicator status="finishing" message="Compiling your detailed interview diagnostic report..." />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to load report data.'}</p>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { interview, questions } = reportData;
  const { report, categoryScores, overallScore } = interview;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#222222] border border-[#333333] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="lime" size="sm" dot>Performance Diagnostic</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {interview.role} Assessment
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#A0A0A0]">
            <span>Experience: <strong className="text-white">{interview.experienceLevel}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {interview.mode === 'voice' ? <Mic className="w-3.5 h-3.5 text-[#B8FF00]" /> : <MessageSquare className="w-3.5 h-3.5 text-[#B8FF00]" />}
              {interview.mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
            </span>
            <span>•</span>
            {interview.interviewType === 'timed' ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#B8FF00]" />
                Timed Interview ({interview.durationMinutes || 20}m limit)
              </span>
            ) : (
              <span>
                Question Count Mode ({interview.totalQuestionsTarget || 5} Questions)
              </span>
            )}
            <span>•</span>
            <span>
              {interview.completionReason === 'time_expired' ? (
                <span className="text-amber-400 font-semibold">
                  Concluded by Time Limit ({questions?.filter((q) => q.answer || q.transcript).length || 0} questions completed)
                </span>
              ) : interview.completionReason === 'user_ended' ? (
                <span className="text-sky-400 font-semibold">Concluded Early by Candidate</span>
              ) : (
                <span className="text-[#B8FF00] font-semibold">
                  All {interview.totalQuestionsTarget || 5} Questions Completed
                </span>
              )}
            </span>
            <span>•</span>
            <span>Completed on {new Date(interview.completedAt || interview.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/interview/setup">
            <Button variant="primary" icon={RotateCcw} size="md">
              Practice Again
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" size="md">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Overall Score & Breakdown */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ScoreCard
            title="Overall"
            score={overallScore || 0}
            subtitle="Aggregate score"
            icon={Award}
          />
          <ScoreCard
            title="Technical"
            score={categoryScores?.technical || 0}
            subtitle="Accuracy & concepts"
          />
          <ScoreCard
            title="Communication"
            score={categoryScores?.communication || 0}
            subtitle="Clarity & structure"
          />
          <ScoreCard
            title="Problem Solving"
            score={categoryScores?.problemSolving || 0}
            subtitle="Logic & trade-offs"
          />
          <ScoreCard
            title="Project Knowledge"
            score={categoryScores?.projectKnowledge || 0}
            subtitle="Depth of past work"
          />
          <ScoreCard
            title="Behavioral"
            score={categoryScores?.behavioral || 0}
            subtitle="Situational mindset"
          />
        </div>

        <p className="text-[11px] text-[#A0A0A0] italic text-center">
          * Note: Scores reflect simulated performance criteria and do not represent an actual hiring guarantee or statistical probability.
        </p>
      </div>

      {/* Strengths & Weak Areas Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strengths Card */}
        <Card className="border-[#333333] bg-[#222222]">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-[#333333]">
            <div className="w-8 h-8 rounded-lg bg-[#B8FF00]/10 text-[#B8FF00] flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Your Key Strengths</h3>
          </div>

          <ul className="space-y-3">
            {report?.strengths?.length > 0 ? (
              report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[#D0D0D0] leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#B8FF00] shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <p className="text-xs text-[#A0A0A0]">Complete all questions to uncover strengths.</p>
            )}
          </ul>
        </Card>

        {/* Weak Areas Card */}
        <Card className="border-[#333333] bg-[#222222]">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-[#333333]">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Areas to Improve</h3>
          </div>

          <div className="space-y-4">
            {report?.weakAreas?.length > 0 ? (
              report.weakAreas.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#181818] border border-[#333333] text-xs space-y-1.5"
                >
                  <h5 className="font-bold text-rose-400 flex items-center gap-1.5">
                    <span>{idx + 1}.</span> {item.topic}
                  </h5>
                  <p className="text-[#D0D0D0]">
                    <strong className="text-[#A0A0A0]">What was missing:</strong> {item.whatWasMissing}
                  </p>
                  <p className="text-[#A0A0A0]">
                    <strong className="text-[#777777]">Why it matters:</strong> {item.whyItMatters}
                  </p>
                  <p className="text-[#B8FF00]">
                    <strong className="text-white">What to practice:</strong>{' '}
                    {item.whatToPractice}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#A0A0A0]">No major weaknesses identified.</p>
            )}
          </div>
        </Card>
      </div>

      {/* 7-Day Personalized Improvement Plan */}
      <Card className="border-[#333333] bg-[#222222]">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#333333]">
          <div className="w-10 h-10 rounded-xl bg-[#B8FF00]/10 text-[#B8FF00] flex items-center justify-center border border-[#B8FF00]/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">7-Day Personalized Improvement Curriculum</h3>
            <p className="text-xs text-[#A0A0A0] mt-0.5">
              Actionable daily milestones specifically structured around your identified gaps
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {report?.improvementPlan?.map((plan) => (
            <div
              key={plan.day}
              className="p-3.5 rounded-xl bg-[#181818] border border-[#333333] hover:border-[#5F5F5F] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-[#B8FF00] uppercase tracking-wider block mb-1 font-mono">
                  Day {plan.day}
                </span>
                <h5 className="text-xs font-bold text-white mb-2 line-clamp-2">{plan.title}</h5>
                <p className="text-[11px] text-[#A0A0A0] leading-snug">{plan.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Question-by-Question Deep Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#B8FF00]" />
            Question-by-Question Breakdown
          </h3>
          <Badge variant="lime" size="sm">{questions?.length} Questions Reviewed</Badge>
        </div>

        <div className="space-y-4">
          {questions?.map((qa, index) => {
            const isExpanded = expandedQuestion === index;
            return (
              <div
                key={qa._id}
                className="bg-[#222222] border border-[#333333] rounded-2xl overflow-hidden transition-all shadow-lg"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#181818] text-white border border-[#333333] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      Q{index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-relaxed">
                        {qa.question}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="charcoal" size="sm">
                          {qa.category}
                        </Badge>
                        {qa.isFollowUp && (
                          <Badge variant="lime" size="sm" icon={Sparkles}>
                            Follow-Up
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#A0A0A0] block font-mono">Score</span>
                      <span className="text-sm font-bold text-[#B8FF00] font-mono">
                        {qa.scores?.overall || 0}/100
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#A0A0A0]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-[#333333] space-y-4 bg-[#181818]/60">
                    {/* Candidate Answer */}
                    <div className="p-4 rounded-xl bg-[#181818] border border-[#333333] mt-4">
                      <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">
                        Your Answer {qa.transcript && '(Voice Transcript via Amazon Transcribe)'}
                      </span>
                      <p className="text-xs text-[#D0D0D0] font-mono leading-relaxed">
                        {qa.answer || qa.transcript || 'No answer recorded'}
                      </p>
                    </div>

                    {/* Metrics 0-10 */}
                    {qa.evaluation && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-3 rounded-xl bg-[#181818] border border-[#333333] text-center">
                          <span className="text-[10px] text-[#A0A0A0] uppercase block font-medium">Accuracy</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {qa.evaluation.technicalAccuracy || 0}/10
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#181818] border border-[#333333] text-center">
                          <span className="text-[10px] text-[#A0A0A0] uppercase block font-medium">Relevance</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {qa.evaluation.relevance || 0}/10
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#181818] border border-[#333333] text-center">
                          <span className="text-[10px] text-[#A0A0A0] uppercase block font-medium">Depth</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {qa.evaluation.depth || 0}/10
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#181818] border border-[#333333] text-center">
                          <span className="text-[10px] text-[#A0A0A0] uppercase block font-medium">Clarity</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {qa.evaluation.clarity || 0}/10
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Strengths & Missing points */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {qa.strengths?.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[#B8FF00]/5 border border-[#B8FF00]/20 text-xs">
                          <span className="font-bold text-[#B8FF00] flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> What You Did Well
                          </span>
                          <ul className="list-disc list-inside text-[#D0D0D0] space-y-1">
                            {qa.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qa.missingPoints?.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs">
                          <span className="font-bold text-rose-400 flex items-center gap-1.5 mb-1.5">
                            <XCircle className="w-3.5 h-3.5" /> What Was Missing
                          </span>
                          <ul className="list-disc list-inside text-[#D0D0D0] space-y-1">
                            {qa.missingPoints.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Suggested Better Answer */}
                    {qa.betterAnswer && (
                      <div className="p-4 rounded-xl bg-[#B8FF00]/10 border border-[#B8FF00]/30 text-xs space-y-1.5">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-[#B8FF00]" /> Suggested Better Answer Model:
                        </span>
                        <p className="text-[#D0D0D0] leading-relaxed italic">
                          "{qa.betterAnswer}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

