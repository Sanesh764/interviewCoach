import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

export const AudioPlayer = ({ audioUrl, autoPlay = false, onEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      if (autoPlay) {
        audioRef.current.play().catch((err) => {
          console.warn('[AudioPlayer] Autoplay was prevented by browser:', err);
        });
      }
    }
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error(err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (onEnded) onEnded();
  };

  if (!audioUrl) return null;

  return (
    <div className="flex items-center space-x-3 bg-surface-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
        title={isPlaying ? 'Pause Audio' : 'Play Question Audio'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      {/* Progress track */}
      <div className="w-28 sm:w-40 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 font-mono">
        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
        Joanna Neural
      </span>
    </div>
  );
};

