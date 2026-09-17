import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/interviewService';
import {
  Sparkles,
  PlusCircle,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Mic,
  MessageSquare,
  ChevronRight,
  Target
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ScoreCard } from '../components/common/ScoreCard';
import { ProgressChart } from '../components/dashboard/ProgressChart';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getDashboardStats();
        setStats(data.stats);
        setRecentInterviews(data.recentInterviews || []);
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-indigo-950/40 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Candidate Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your interview performance, polish weak areas, and practice with AI.
          </p>
        </div>
        <Link to="/interview/setup">
          <Button size="lg" variant="primary" icon={PlusCircle}>
            Start New Interview
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ScoreCard
          title="Average Score"
          score={stats?.averageScore || 0}
          subtitle="Across all completed interviews"
          icon={Award}
        />
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interviews</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold text-white">{stats?.totalInterviews || 0}</span>
            <span className="text-xs text-slate-500 ml-1">completed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Sessions finished</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Strongest Skill</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="text-lg font-bold text-emerald-400">
              {stats?.strongestSkill || 'Needs more sessions'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Consistent high performance</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Needs Practice</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-lg font-bold text-amber-400">
              {stats?.weakestSkill || 'Complete an interview'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Recommended focus area</p>
        </div>
      </div>

      {/* Main Grid: Score Progress + Recent Interviews */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Score Improvement Trajectory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological overall score across completed interview sessions
                </p>
              </div>
            </div>
            <ProgressChart data={stats?.scoreHistory || []} />
          </Card>

          {/* Recommended Practice Card */}
          <Card className="bg-gradient-to-r from-indigo-950/30 to-slate-800/70 border-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Recommended Next Practice</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {stats?.recommendedPractice ||
                    'Start your first mock interview to receive customized weakness detection and a tailored 7-day study plan.'}
                </p>
                <div className="mt-4">
                  <Link to="/interview/setup">
                    <Button size="sm" variant="primary">
                      Start Focused Interview
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Interviews (1 Col) */}
        <div>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Recent Interviews
              </h3>
              <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300">
                View all
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {recentInterviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No interviews completed yet.
                  <div className="mt-3">
                    <Link to="/interview/setup">
                      <Button size="sm" variant="secondary">
                        Create One Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                recentInterviews.map((interview) => (
                  <Link
                    key={interview._id}
                    to={
                      interview.status === 'completed'
                        ? `/interview/report/${interview._id}`
                        : `/interview/room/${interview._id}`
                    }
                    className="block p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {interview.role}
                        </h5>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {interview.mode === 'voice' ? (
                              <Mic className="w-3 h-3 text-indigo-400" />
                            ) : (
                              <MessageSquare className="w-3 h-3 text-indigo-400" />
                            )}
                            {interview.mode === 'voice' ? 'Voice' : 'Text'}
                          </span>
                          <span>•</span>
                          <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {interview.status === 'completed' ? (
                          <div className="text-sm font-bold text-indigo-400">
                            {interview.overallScore}
                            <span className="text-[10px] text-slate-500 font-normal">/100</span>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            In Progress
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors inline-block mt-1" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
