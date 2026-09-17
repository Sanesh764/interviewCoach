import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Mic,
  Smile,
  Shield,
  Zap,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

const PRESET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Product Manager',
  'QA Engineer',
];

const EXPERIENCE_LEVELS = [
  'Student',
  'Fresher',
  '0-2 years',
  '2-5 years',
  '5+ years',
];

export const InterviewSetupPage = () => {
  const navigate = useNavigate();

  // Form states
  const [role, setRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [mode, setMode] = useState('text');
  const [personality, setPersonality] = useState('professional');
  const [totalQuestionsTarget, setTotalQuestionsTarget] = useState(5);
  const [jobDescription, setJobDescription] = useState('');

  // Resume states
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selected) => {
    if (selected === 'custom') {
      setIsCustomRole(true);
      setRole('');
    } else {
      setIsCustomRole(false);
      setRole(selected);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setResumeError('Please upload a valid PDF or DOCX resume.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size exceeds 5MB limit.');
      return;
    }

    setResumeError('');
    setResumeFile(file);
    setIsUploadingResume(true);

    try {
      const data = await interviewService.uploadResume(file);
      setResumeData(data.resumeData);
    } catch (err) {
      console.error('[Resume Upload Error]', err);
      setResumeError(err.response?.data?.message || 'Failed to parse resume.');
      setResumeFile(null);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeData(null);
    setResumeError('');
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setError('');

    const targetRole = isCustomRole ? customRole.trim() : role;
    if (!targetRole) {
      setError('Please choose or enter a target job role.');
      return;
    }

    setIsSubmitting(true);

    try {
      const interview = await interviewService.createInterview({
        role: targetRole,
        experienceLevel,
        mode,
        personality,
        totalQuestionsTarget: Number(totalQuestionsTarget),
        jobDescription: jobDescription.trim(),
        resumeData: resumeData || null,
      });

      navigate(`/interview/room/${interview._id}`);
    } catch (err) {
      console.error('[Start Interview Error]', err);
      setError(
        err.response?.data?.message ||
          'Failed to initialize interview session. Please check your connection or AWS configuration.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Setup Wizard
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Configure Your Interview</h1>
        <p className="text-sm text-slate-400 mt-2">
          Personalize the interviewer's role, experience context, questions, and communication style.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-rose-300">AWS Bedrock Configuration Required</h5>
              <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
          {error.includes('AWS') && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-mono space-y-2">
              <div className="text-indigo-400 font-bold font-sans">How to fix this:</div>
              <p className="text-slate-400 font-sans">
                Open <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">Backend/.env</code> in your editor and add your AWS credentials:
              </p>
              <pre className="text-indigo-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800">
{`AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_access_key`}
              </pre>
              <p className="text-[11px] text-slate-400 font-sans">
                Also ensure model access for Claude 3 (or configured Bedrock model) is granted in the AWS Bedrock Console.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleStartInterview} className="space-y-8">
        {/* 1. Job Role */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              1. Target Job Role <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs text-slate-400">Required</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => handleRoleSelect(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  !isCustomRole && role === r
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleRoleSelect('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isCustomRole
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600'
              }`}
            >
              + Other Role
            </button>
          </div>

          {isCustomRole && (
            <div className="pt-2">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter custom role, e.g. DevOps Engineer, Mobile Developer, Cloud Architect"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          )}
        </Card>

        {/* 2. Experience Level */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              2. Experience Level <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs text-slate-400">Required</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button
                type="button"
                key={lvl}
                onClick={() => setExperienceLevel(lvl)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                  experienceLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </Card>

        {/* 3. Interview Mode & Personality */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mode */}
          <Card className="space-y-4">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              3. Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'text'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  {mode === 'text' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-white">Text Mode</h6>
                  <p className="text-[11px] text-slate-400 mt-0.5">Type your answers thoughtfully</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'voice'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Mic className="w-5 h-5 text-rose-400" />
                  {mode === 'voice' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-white">Voice Mode</h6>
                  <p className="text-[11px] text-slate-400 mt-0.5">Speak via Transcribe & Polly</p>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Note: You can also switch between Text and Voice anytime during the interview.
            </p>
          </Card>

          {/* Personality */}
          <Card className="space-y-4">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-indigo-400" />
              4. Interview Personality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'friendly', name: 'Friendly', desc: 'Encouraging & supportive', icon: Smile },
                { id: 'professional', name: 'Professional', desc: 'Standard formal tone', icon: Shield },
                { id: 'strict', name: 'Strict', desc: 'Rigorous deep follow-ups', icon: Zap },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPersonality(p.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      personality === p.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                    <h6 className="text-xs font-bold text-white">{p.name}</h6>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Affects question tone and follow-up persistence without modifying scoring criteria.
            </p>
          </Card>
        </div>

        {/* 5. Resume Upload (Optional) */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              5. Upload Resume (Optional)
            </label>
            <span className="text-xs text-slate-400">PDF or DOCX (Max 5MB)</span>
          </div>

          {!resumeData && !isUploadingResume && (
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-center transition-colors bg-slate-900/40">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeChange}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">
                  Click to upload resume or drag and drop
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enables personalized questions about your actual projects and skills
                </p>
              </label>
            </div>
          )}

          {isUploadingResume && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs font-medium text-white">Extracting resume skills & projects...</p>
            </div>
          )}

          {resumeData && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    {resumeFile?.name || 'Resume Parsed Successfully'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeResume}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove resume"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resumeData.skills?.length > 0 && (
                <div className="mt-2">
                  <span className="text-[11px] font-medium text-slate-400">Extracted Skills: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {resumeData.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                    {resumeData.skills.length > 10 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{resumeData.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {resumeError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {resumeError}
            </p>
          )}
        </Card>

        {/* 6. Job Description (Optional) */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              6. Paste Job Description (Optional)
            </label>
            <span className="text-xs text-slate-400">Tailors questions to JD requirements</span>
          </div>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description, responsibilities, or desired qualifications here..."
            className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
          />
        </Card>

        {/* 7. Question Count Target */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              7. Number of Questions
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[5, 7, 10].map((count) => (
              <button
                type="button"
                key={count}
                onClick={() => setTotalQuestionsTarget(count)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  totalQuestionsTarget === count
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border border-slate-700/80'
                }`}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            size="xl"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
            icon={ArrowRight}
          >
            Start Interview Now
          </Button>
        </div>
      </form>
    </div>
  );
};
