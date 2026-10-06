import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
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
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

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
  const [interviewType, setInterviewType] = useState('question_count'); // 'question_count' | 'timed'
  const [totalQuestionsTarget, setTotalQuestionsTarget] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(20);
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
      const isTimed = interviewType === 'timed';
      const response = await interviewService.createInterview({
        role: targetRole,
        experienceLevel,
        mode,
        personality,
        interviewType,
        totalQuestionsTarget: isTimed ? null : Number(totalQuestionsTarget),
        durationMinutes: isTimed ? Number(durationMinutes) : null,
        jobDescription: jobDescription.trim(),
        resumeData: resumeData || null,
      });

      const interviewId =
        response?.interview?._id ||
        response?.interview?.id ||
        response?._id ||
        response?.id;

      if (!interviewId) {
        throw new Error('Interview created, but failed to retrieve session ID from server response.');
      }

      navigate(`/interview/room/${interviewId}`);
    } catch (err) {
      console.error('[Start Interview Error]', err);
      setError(
        err.response?.data?.message ||
        err.message ||
          'AI interview service is temporarily unavailable. Please try again later.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 bg-[#181818]">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <Badge variant="lime" size="sm" dot>Setup Wizard</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Configure Your Interview</h1>
        <p className="text-xs sm:text-sm text-[#A0A0A0] mt-2 max-w-lg mx-auto leading-relaxed">
          Select target role, candidate level, communication mode, and optional resume context for customized questioning.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-rose-300">Notice</h5>
            <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleStartInterview} className="space-y-8">
        {/* 1. Job Role */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#B8FF00]" />
              1. Target Job Role <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-[#A0A0A0] font-mono">Required</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => handleRoleSelect(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isCustomRole && role === r
                    ? 'bg-[#B8FF00] text-[#222222] shadow-md shadow-[#B8FF00]/15'
                    : 'bg-[#181818] text-[#D0D0D0] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#5F5F5F]'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleRoleSelect('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCustomRole
                  ? 'bg-[#B8FF00] text-[#222222] shadow-md shadow-[#B8FF00]/15'
                  : 'bg-[#181818] text-[#D0D0D0] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#5F5F5F]'
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
                className="w-full px-4 py-2.5 bg-[#2A2A2A] border border-[#5F5F5F] rounded-xl text-white placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/40 focus:border-[#B8FF00] text-xs sm:text-sm"
                required
              />
            </div>
          )}
        </Card>

        {/* 2. Experience Level */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#B8FF00]" />
              2. Experience Level <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-[#A0A0A0] font-mono">Required</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button
                type="button"
                key={lvl}
                onClick={() => setExperienceLevel(lvl)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  experienceLevel === lvl
                    ? 'bg-[#B8FF00] text-[#222222] shadow-md shadow-[#B8FF00]/15'
                    : 'bg-[#181818] text-[#D0D0D0] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#5F5F5F]'
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
              <MessageSquare className="w-4 h-4 text-[#B8FF00]" />
              3. Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'text'
                    ? 'border-[#B8FF00] bg-[#B8FF00]/10 ring-1 ring-[#B8FF00]/40'
                    : 'border-[#333333] bg-[#181818] hover:bg-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className={`w-5 h-5 ${mode === 'text' ? 'text-[#B8FF00]' : 'text-[#A0A0A0]'}`} />
                  {mode === 'text' && <CheckCircle2 className="w-4 h-4 text-[#B8FF00]" />}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-white">Text Mode</h6>
                  <p className="text-[11px] text-[#A0A0A0] mt-0.5">Type responses thoughtfully</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'voice'
                    ? 'border-[#B8FF00] bg-[#B8FF00]/10 ring-1 ring-[#B8FF00]/40'
                    : 'border-[#333333] bg-[#181818] hover:bg-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Mic className={`w-5 h-5 ${mode === 'voice' ? 'text-[#B8FF00]' : 'text-[#A0A0A0]'}`} />
                  {mode === 'voice' && <CheckCircle2 className="w-4 h-4 text-[#B8FF00]" />}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-white">Voice Mode</h6>
                  <p className="text-[11px] text-[#A0A0A0] mt-0.5">Speak via Transcribe & Polly</p>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-[#A0A0A0]">
              Note: You can seamlessly toggle between Text and Voice during any question.
            </p>
          </Card>

          {/* Personality */}
          <Card className="space-y-4">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#B8FF00]" />
              4. Interviewer Personality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'friendly', name: 'Friendly', desc: 'Encouraging tone', icon: Smile },
                { id: 'professional', name: 'Professional', desc: 'Standard formal', icon: Shield },
                { id: 'strict', name: 'Strict', desc: 'Rigorous probes', icon: Zap },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = personality === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPersonality(p.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#B8FF00] bg-[#B8FF00]/10 ring-1 ring-[#B8FF00]/40'
                        : 'border-[#333333] bg-[#181818] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1.5 ${isSelected ? 'text-[#B8FF00]' : 'text-[#A0A0A0]'}`} />
                    <h6 className="text-xs font-bold text-white">{p.name}</h6>
                    <p className="text-[10px] text-[#A0A0A0] mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#A0A0A0]">
              Customizes conversational style and follow-up tenacity without altering scoring rubrics.
            </p>
          </Card>
        </div>

        {/* 5. Resume Upload (Optional) */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#B8FF00]" />
              5. Upload Resume (Optional)
            </label>
            <span className="text-[11px] text-[#A0A0A0] font-mono">PDF or DOCX (Max 5MB)</span>
          </div>

          {!resumeData && !isUploadingResume && (
            <div className="border-2 border-dashed border-[#444444] hover:border-[#B8FF00] rounded-2xl p-6 text-center transition-colors bg-[#181818]">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeChange}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <FileText className="w-8 h-8 text-[#B8FF00] mx-auto mb-2" />
                <p className="text-xs font-bold text-white">
                  Click to upload resume or drag and drop
                </p>
                <p className="text-[11px] text-[#A0A0A0] mt-1">
                  Enables tailored questions regarding your actual work history, projects, and tech stack
                </p>
              </label>
            </div>
          )}

          {isUploadingResume && (
            <div className="p-6 rounded-2xl bg-[#181818] border border-[#333333] text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-[#B8FF00] animate-spin" />
              <p className="text-xs font-bold text-white">Extracting resume skills & projects...</p>
            </div>
          )}

          {resumeData && (
            <div className="p-4 rounded-xl bg-[#181818] border border-[#B8FF00]/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B8FF00]" />
                  <span className="text-xs font-bold text-white">
                    {resumeFile?.name || 'Resume Parsed Successfully'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeResume}
                  className="text-[#A0A0A0] hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove resume"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resumeData.skills?.length > 0 && (
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-[#A0A0A0]">Extracted Skills: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {resumeData.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#2A2A2A] text-white border border-[#444444] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {resumeData.skills.length > 10 && (
                      <span className="text-[10px] text-[#A0A0A0] self-center">
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
              <FileText className="w-4 h-4 text-[#B8FF00]" />
              6. Paste Job Description (Optional)
            </label>
            <span className="text-[11px] text-[#A0A0A0]">Tailors questions to JD requirements</span>
          </div>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description, responsibilities, or desired qualifications here..."
            className="w-full p-3.5 bg-[#2A2A2A] border border-[#5F5F5F] rounded-xl text-white placeholder-[#707070] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/40 focus:border-[#B8FF00] text-xs leading-relaxed"
          />
        </Card>

        {/* 7. Interview Format: Question Count vs Timed */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B8FF00]" />
              7. Interview Format
            </label>
            <span className="text-[11px] text-[#A0A0A0]">Select session pacing rule</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setInterviewType('question_count')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                interviewType === 'question_count'
                  ? 'border-[#B8FF00] bg-[#B8FF00]/10 ring-1 ring-[#B8FF00]/40'
                  : 'border-[#333333] bg-[#181818] hover:bg-[#2A2A2A]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <HelpCircle className={`w-5 h-5 ${interviewType === 'question_count' ? 'text-[#B8FF00]' : 'text-[#A0A0A0]'}`} />
                {interviewType === 'question_count' && <CheckCircle2 className="w-4 h-4 text-[#B8FF00]" />}
              </div>
              <div>
                <h6 className="text-xs font-bold text-white">Question Count Mode</h6>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">Fixed question limit (5, 7, 10)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setInterviewType('timed')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                interviewType === 'timed'
                  ? 'border-[#B8FF00] bg-[#B8FF00]/10 ring-1 ring-[#B8FF00]/40'
                  : 'border-[#333333] bg-[#181818] hover:bg-[#2A2A2A]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className={`w-5 h-5 ${interviewType === 'timed' ? 'text-[#B8FF00]' : 'text-[#A0A0A0]'}`} />
                {interviewType === 'timed' && <CheckCircle2 className="w-4 h-4 text-[#B8FF00]" />}
              </div>
              <div>
                <h6 className="text-xs font-bold text-white">Timed Interview Mode</h6>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">Unlimited questions within duration</p>
              </div>
            </button>
          </div>

          {/* Conditional sub-configuration */}
          {interviewType === 'question_count' ? (
            <div className="pt-2 border-t border-[#333333] space-y-2.5">
              <label className="text-xs font-bold text-[#D0D0D0] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#B8FF00]" />
                Number of Questions:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 7, 10].map((count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setTotalQuestionsTarget(count)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      totalQuestionsTarget === count
                        ? 'bg-[#B8FF00] text-[#222222] shadow-md shadow-[#B8FF00]/15'
                        : 'bg-[#181818] text-[#D0D0D0] hover:bg-[#2A2A2A] border border-[#383838]'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#A0A0A0]">
                Interview concludes strictly after Question {totalQuestionsTarget} is answered.
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#333333] space-y-2.5">
              <label className="text-xs font-bold text-[#D0D0D0] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#B8FF00]" />
                Interview Duration:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10, 20, 30].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-[#B8FF00] text-[#222222] shadow-md shadow-[#B8FF00]/15'
                        : 'bg-[#181818] text-[#D0D0D0] hover:bg-[#2A2A2A] border border-[#383838]'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#A0A0A0]">
                NO question limit. The AI will continue presenting questions dynamically until the {durationMinutes}-minute countdown finishes.
              </p>
            </div>
          )}
        </Card>

        {/* Submit */}
        <div className="pt-2">
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
