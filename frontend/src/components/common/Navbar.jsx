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
    <nav className="border-b border-[#333333] bg-[#222222]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#B8FF00] flex items-center justify-center shadow-lg shadow-[#B8FF00]/15 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-[#222222]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-white tracking-tight">
                InterviewCoach
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#B8FF00]/15 text-[#B8FF00] border border-[#B8FF00]/30 tracking-wider">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1.5">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive('/dashboard')
                    ? 'bg-[#2A2A2A] text-[#B8FF00] border border-[#444444]'
                    : 'text-[#D0D0D0] hover:text-[#B8FF00] hover:bg-[#2A2A2A]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive('/history')
                    ? 'bg-[#2A2A2A] text-[#B8FF00] border border-[#444444]'
                    : 'text-[#D0D0D0] hover:text-[#B8FF00] hover:bg-[#2A2A2A]'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>
              <Link
                to="/interview/setup"
                className="ml-3 px-4 py-2 rounded-xl text-sm font-bold bg-[#B8FF00] hover:bg-[#A8EB00] text-[#222222] shadow-md shadow-[#B8FF00]/15 transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                New Interview
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-[#D0D0D0] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-bold rounded-xl bg-[#B8FF00] hover:bg-[#A8EB00] text-[#222222] shadow-md shadow-[#B8FF00]/15 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          )}

          {/* User Profile & Logout (Desktop) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-3 border-l border-[#333333] pl-4">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-sm text-[#D0D0D0] hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2A2A2A] border border-[#444444] flex items-center justify-center text-[#B8FF00] font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="font-semibold">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-[#A0A0A0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#D0D0D0] hover:text-white hover:bg-[#2A2A2A]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#333333] bg-[#222222] px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 border-b border-[#333333] text-sm font-medium text-[#A0A0A0]">
                Signed in as <span className="text-white font-bold">{user?.name}</span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-[#D0D0D0] hover:text-[#B8FF00] hover:bg-[#2A2A2A]"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-[#D0D0D0] hover:text-[#B8FF00] hover:bg-[#2A2A2A]"
              >
                Interview History
              </Link>
              <Link
                to="/interview/setup"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-bold bg-[#B8FF00] text-[#222222] text-center"
              >
                Start New Interview
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-[#D0D0D0] hover:text-white hover:bg-[#2A2A2A]"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-[#D0D0D0] hover:text-white hover:bg-[#2A2A2A]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-bold bg-[#B8FF00] text-[#222222] text-center"
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
