import React from 'react';
import { Card } from '../components/common/Card';

export const ProfilePage = () => {
  const user = JSON.parse(localStorage.getItem('interviewcoach_user') || '{}');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
      <p className="text-sm text-slate-400 mb-6">Manage your candidate profile and account details</p>

      <Card className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="text-base font-semibold text-white bg-slate-900/60 p-3 rounded-xl border border-slate-700">
            {user.name || 'Candidate'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="text-base font-semibold text-white bg-slate-900/60 p-3 rounded-xl border border-slate-700">
            {user.email || 'candidate@example.com'}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-1">Data & Privacy</h3>
          <p className="text-xs text-slate-400">
            Your interview transcripts and uploaded resumes are stored securely and isolated to your account.
          </p>
        </div>
      </Card>
    </div>
  );
};
