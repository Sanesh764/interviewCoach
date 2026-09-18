import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, User, LogOut, PlusCircle, LayoutDashboard, History, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800/80 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                InterviewCoach
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 tracking-wider">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard')
                    ? 'bg-surface-800 text-indigo-400 border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/history')
                    ? 'bg-surface-800 text-indigo-400 border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850/60'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>
              <Link
                to="/interview/setup"
                className="ml-3 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                New Interview
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          )}

          {/* User Profile & Logout (Desktop) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-3 border-l border-slate-800 pl-4">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="font-medium">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-2 py-2 border-b border-slate-800 text-sm font-medium text-slate-300">
                Signed in as <span className="text-white font-semibold">{user?.name}</span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Interview History
              </Link>
              <Link
                to="/interview/setup"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium bg-indigo-600 text-white"
              >
                Start New Interview
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium bg-indigo-600 text-white text-center"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
