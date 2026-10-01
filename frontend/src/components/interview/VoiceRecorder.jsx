import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Send, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

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
    <div className="bg-[#222222] border border-[#333333] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#B8FF00]" />
          Voice Answer Recording
        </span>
        {isRecording && (
          <Badge variant="rose" size="sm" dot>
            RECORDING {formatTime(recordingDuration)}
          </Badge>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
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
              className="w-20 h-20 rounded-full bg-[#B8FF00] hover:bg-[#A8EB00] text-[#222222] flex items-center justify-center shadow-xl shadow-[#B8FF00]/20 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer mx-auto ring-4 ring-[#B8FF00]/20"
            >
              <Mic className="w-9 h-9 stroke-[2.5]" />
            </button>
            <div>
              <p className="text-base font-bold text-white tracking-tight">Click to Start Speaking</p>
              <p className="text-xs text-[#A0A0A0] mt-1 max-w-sm mx-auto leading-relaxed">
                Record your response naturally. Media will be sent to Amazon Transcribe for speech-to-text conversion.
              </p>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="text-center space-y-5">
            <div className="relative inline-block">
              <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer mx-auto ring-4 ring-rose-500/30"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            </div>
            <div>
              <p className="text-3xl font-mono font-bold text-white tracking-widest">
                {formatTime(recordingDuration)}
              </p>
              <p className="text-xs text-[#A0A0A0] mt-1">Click the red square when you finish speaking</p>
            </div>
          </div>
        )}

        {!isRecording && audioUrl && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between bg-[#181818] border border-[#333333] rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayToggle}
                  className="w-10 h-10 rounded-full bg-[#B8FF00] hover:bg-[#A8EB00] text-[#222222] flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[#B8FF00]/15"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>
                <div>
                  <p className="text-xs font-bold text-white">Answer Recorded</p>
                  <p className="text-[11px] text-[#A0A0A0] font-mono">
                    Duration: {formatTime(recordingDuration)}
                  </p>
                </div>
              </div>

              <button
                onClick={resetRecording}
                disabled={isProcessing}
                className="text-xs text-[#A0A0A0] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
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
