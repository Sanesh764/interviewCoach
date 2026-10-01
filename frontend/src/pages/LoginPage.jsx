import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-[#181818]">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl border border-[#333333] bg-[#222222] shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Left Side: Product Showcase */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-[#1A1A1A] border-r border-[#333333]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8FF00]/15 border border-[#B8FF00]/30 text-[#B8FF00] text-xs font-bold mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>InterviewCoach AI</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
              Welcome back to your practice room.
            </h2>
            <p className="mt-3 text-sm text-[#A0A0A0] leading-relaxed">
              Step into your personalized AI interview sessions. Get scored on depth, trade-offs, and communication clarity.
            </p>

            <div className="mt-8 space-y-3.5 text-xs text-[#D0D0D0]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B8FF00] shrink-0" />
                <span>Context-aware questions tailored to your resume</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B8FF00] shrink-0" />
                <span>Instant voice answers via AWS Transcribe & Polly</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B8FF00] shrink-0" />
                <span>Structured 7-day study curriculum</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-[#222222] border border-[#333333] font-mono text-[11px] text-[#A0A0A0]">
            <span className="text-[#B8FF00] font-bold">Tip:</span> Pick "Strict" interviewer personality in setup to simulate demanding FAANG bar-raisers.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#222222]">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In</h1>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
              Enter your account credentials to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#D0D0D0] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A0A0A0]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border border-[#5F5F5F] rounded-xl text-white placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/40 focus:border-[#B8FF00] text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#D0D0D0] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A0A0A0]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#2A2A2A] border border-[#5F5F5F] rounded-xl text-white placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/40 focus:border-[#B8FF00] text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A0A0A0] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#333333] text-center">
            <p className="text-xs sm:text-sm text-[#A0A0A0]">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#B8FF00] hover:underline font-bold transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
