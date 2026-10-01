import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
  History,
  Calendar,
  Mic,
  MessageSquare,
  PlusCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingIndicator } from '../components/interview/LoadingIndicator';

export const InterviewHistoryPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterviewHistory();
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error('[History Fetch Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredInterviews = interviews.filter((item) => {
    if (filterMode === 'all') return true;
    return item.mode === filterMode;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <LoadingIndicator status="evaluating" message="Loading interview history records..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="lime" size="sm" dot>History & Transcripts</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Interview History
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Review past interview transcripts, multi-metric scores, feedback, and 7-day study curricula
          </p>
        </div>

        <Link to="/interview/setup">
          <Button variant="primary" icon={PlusCircle}>
            Start New Interview
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#333333] pb-4">
        {[
          { id: 'all', label: 'All Interviews' },
          { id: 'text', label: 'Text Mode' },
          { id: 'voice', label: 'Voice Mode' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterMode(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === tab.id
                ? 'bg-[#B8FF00] text-[#222222] shadow-sm'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredInterviews.length === 0 ? (
        <Card className="text-center py-16">
          <Clock className="w-10 h-10 text-[#5F5F5F] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No interview records found</h3>
          <p className="text-xs text-[#A0A0A0] mt-1 max-w-sm mx-auto">
            You haven't completed any interviews in this category yet. Start one to build your history!
          </p>
          <div className="mt-6">
            <Link to="/interview/setup">
              <Button variant="primary" icon={PlusCircle}>Start Practice Session</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((item) => (
            <Link
              key={item._id}
              to={
                item.status === 'completed'
                  ? `/interview/report/${item._id}`
                  : `/interview/room/${item._id}`
              }
              className="block bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#B8FF00]/50 rounded-2xl p-5 transition-all shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-white group-hover:text-[#B8FF00] transition-colors">
                      {item.role}
                    </h4>
                    <Badge variant="charcoal" size="sm">
                      {item.experienceLevel}
                    </Badge>
                    <Badge variant="charcoal" size="sm" className="capitalize">
                      {item.personality}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#A0A0A0]">
                    <span className="flex items-center gap-1.5">
                      {item.mode === 'voice' ? (
                        <Mic className="w-3.5 h-3.5 text-[#B8FF00]" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-[#B8FF00]" />
                      )}
                      {item.mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A0A0A0]" />
                      {new Date(item.completedAt || item.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {item.questions?.length || item.currentQuestionIndex || 0} questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#333333]">
                  {item.status === 'completed' ? (
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-mono text-[#A0A0A0] block">
                        Overall Score
                      </span>
                      <span className="text-xl font-extrabold text-[#B8FF00] font-mono">
                        {item.overallScore}
                        <span className="text-xs text-[#A0A0A0] font-normal">/100</span>
                      </span>
                    </div>
                  ) : (
                    <Badge variant="lime" size="sm">
                      In Progress
                    </Badge>
                  )}

                  <div className="w-9 h-9 rounded-xl bg-[#181818] group-hover:bg-[#B8FF00] group-hover:text-[#222222] text-[#A0A0A0] flex items-center justify-center transition-all border border-[#333333]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

