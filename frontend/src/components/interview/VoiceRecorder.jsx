import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Send, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const VoiceRecorder = ({ onSendAnswer, isProcessing = false, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError('');
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Error accessing microphone:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : err.message || 'Failed to start recording.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setError('');
  };

  const handlePlayToggle = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (isProcessing || disabled) return;
    if (!audioBlob) {
      setError('Please record an answer before submitting.');
      return;
    }
    onSendAnswer(audioBlob);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-indigo-400" />
          Voice Answer Recording
        </span>
        {isRecording && (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            LIVE {formatTime(recordingDuration)}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden Audio Player for Preview */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Control Area */}
      <div className="flex flex-col items-center justify-center py-6">
        {!isRecording && !audioUrl && (
          <div className="text-center space-y-4">
            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer mx-auto"
            >
              <Mic className="w-8 h-8" />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Click to Start Speaking</p>
              <p className="text-xs text-slate-400 mt-1">
                Record your answer naturally. You can review playback before sending.
              </p>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="text-center space-y-5">
            <div className="relative">
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 animate-pulse hover:scale-105 transition-all cursor-pointer mx-auto"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            </div>
            <div>
              <p className="text-lg font-mono font-bold text-white tracking-widest">
                {formatTime(recordingDuration)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Click red button when you finish speaking</p>
            </div>
          </div>
        )}

        {!isRecording && audioUrl && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayToggle}
                  className="w-10 h-10 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-semibold text-white">Answer Recorded</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Duration: {formatTime(recordingDuration)}
                  </p>
                </div>
              </div>

              <button
                onClick={resetRecording}
                disabled={isProcessing}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Record Again
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSend}
              isLoading={isProcessing}
              disabled={disabled || isProcessing}
              icon={Send}
            >
              Send Voice Answer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
