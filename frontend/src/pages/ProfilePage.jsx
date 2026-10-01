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
          <Badge variant="lime" size="sm" dot>Account Settings</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Candidate Profile</h1>
        <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">Manage your candidate identity and authentication details</p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-[#333333]">
          <div className="w-14 h-14 rounded-2xl bg-[#222222] border-2 border-[#B8FF00] flex items-center justify-center text-[#B8FF00] text-xl font-bold shadow-lg shadow-[#B8FF00]/10">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name || 'Candidate'}</h3>
            <p className="text-xs text-[#A0A0A0] font-mono">{user?.email || 'candidate@example.com'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B8FF00]" />
              Full Name
            </label>
            <div className="text-sm font-medium text-white bg-[#181818] p-3 rounded-xl border border-[#333333]">
              {user?.name || 'Candidate'}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#B8FF00]" />
              Email Address
            </label>
            <div className="text-sm font-medium text-white bg-[#181818] p-3 rounded-xl border border-[#333333] font-mono">
              {user?.email || 'candidate@example.com'}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#333333] space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#B8FF00]" />
            Security & Candidate Isolation
          </h4>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            All your interview session data, voice recordings, and generated reports are isolated by your user ID with strict IDOR protections and encrypted database storage.
          </p>
        </div>
      </Card>
    </div>
  );
};

