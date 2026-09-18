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
  Mic,
  MessageSquare,
  ChevronRight,
  Target,
  ArrowRight,
  Zap,
  Code2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ScoreCard } from '../components/common/ScoreCard';
import { Badge } from '../components/common/Badge';
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

  if (loading && !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading interview statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-900 via-surface-850 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2.5">
              <Badge variant="indigo" size="sm" dot>Candidate Workspace</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              Track your real-time interview performance, polish weak technical areas, and run realistic AI mock sessions.
            </p>
          </div>
          <div className="shrink-0">
            <Link to="/interview/setup">
              <Button size="lg" variant="primary" icon={PlusCircle}>
                Start New Interview
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ScoreCard
          title="Average Score"
          score={stats?.averageScore || 0}
          subtitle="Across all completed interviews"
          icon={Award}
        />
        
        <div className="p-5 rounded-2xl bg-surface-900/80 border border-slate-800 backdrop-blur-xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Interviews</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats?.totalInterviews || 0}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">completed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">Finished practice sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-900/80 border border-emerald-500/20 backdrop-blur-xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Strongest Area</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="my-1 truncate">
            <span className="text-lg font-bold text-emerald-400">
              {stats?.strongestSkill || 'Needs more sessions'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">Consistent high scores</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-900/80 border border-amber-500/20 backdrop-blur-xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Needs Practice</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="my-1 truncate">
            <span className="text-lg font-bold text-amber-400">
              {stats?.weakestSkill || 'Complete an interview'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">Recommended focus area</p>
        </div>
      </div>

      {/* Main Grid: Score Progress + Recent Interviews */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Score Improvement Trajectory
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological overall score performance across completed sessions
                </p>
              </div>
            </div>
            <ProgressChart data={stats?.scoreHistory || []} />
          </Card>

          {/* Recommended Practice Card */}
          <Card className="bg-gradient-to-r from-indigo-950/30 to-surface-900 border-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Recommended Next Practice</h4>
                  <Badge variant="indigo" size="sm">AI Advice</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {stats?.recommendedPractice ||
                    'Start your first mock interview to receive customized weakness detection and a tailored 7-day study curriculum.'}
                </p>
                <div className="mt-4">
                  <Link to="/interview/setup">
                    <Button size="sm" variant="primary" icon={ArrowRight}>
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Recent Interviews
              </h3>
              <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View all
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {recentInterviews.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 space-y-3">
                  <p>No interviews completed yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Get started with a 5-question mock session tailored to your target engineering role.
                  </p>
                  <div className="pt-2">
                    <Link to="/interview/setup">
                      <Button size="sm" variant="secondary" icon={PlusCircle}>
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
                    className="block p-3.5 rounded-xl bg-surface-950/80 hover:bg-surface-850 border border-slate-800/80 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {interview.role}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
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
                          <Badge variant="amber" size="sm">In Progress</Badge>
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

