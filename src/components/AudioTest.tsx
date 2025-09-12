"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Volume2, VolumeOff, Play, Pause } from "lucide-react";

export default function AudioTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handlePlay = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      }
    } catch (err) {
      console.error('Audio play error:', err);
      setError(`Play error: ${err}`);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-sm">
      <h3 className="text-sm font-semibold mb-3">Audio Test</h3>
      
      <audio 
        ref={audioRef}
        src="/hello.mp3"
        preload="auto"
        onError={(e) => {
          console.error('Audio error:', e);
          setError('Audio file failed to load');
        }}
        onCanPlayThrough={() => {
          console.log('Audio ready');
          setError(null);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={isPlaying ? handlePause : handlePlay}
            className="flex-1"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleMuteToggle}
          >
            {isMuted ? <VolumeOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-600">Volume: {Math.round(volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500">
          Status: {isPlaying ? 'Playing' : 'Paused'} | 
          Muted: {isMuted ? 'Yes' : 'No'} | 
          Volume: {Math.round(volume * 100)}%
        </div>
      </div>
    </div>
  );
}
