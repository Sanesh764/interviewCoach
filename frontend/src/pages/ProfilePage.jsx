import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { User, Mail, Shield, KeyRound, Sparkles } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <Badge variant="indigo" size="sm" dot>Account Settings</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Candidate Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage your candidate identity and authentication details</p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-600/30">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name || 'Candidate'}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email || 'candidate@example.com'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Full Name
            </label>
            <div className="text-sm font-medium text-white bg-surface-950 p-3 rounded-xl border border-slate-800">
              {user?.name || 'Candidate'}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Email Address
            </label>
            <div className="text-sm font-medium text-white bg-surface-950 p-3 rounded-xl border border-slate-800 font-mono">
              {user?.email || 'candidate@example.com'}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Security & Candidate Isolation
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All your interview session data, voice recordings, and generated reports are isolated by your user ID with strict IDOR protections and encrypted database storage.
          </p>
        </div>
      </Card>
    </div>
  );
};

