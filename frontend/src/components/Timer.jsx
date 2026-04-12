/**
 * Timer - Circular countdown timer with SVG progress ring
 */

import { useState, useEffect, useRef } from 'react';

export default function Timer({ 
  duration = 60, 
  isRunning = false, 
  onComplete,
  size = 100,
  label = '',
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const circumference = 2 * Math.PI * 42;
  const progress = ((duration - timeLeft) / duration) * circumference;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="timer-circle" style={{ width: size, height: size }}>
      <svg className="timer-svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle className="timer-track" cx="48" cy="48" r="42" />
        <circle
          className="timer-progress"
          cx="48"
          cy="48"
          r="42"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
      <div className="timer-text">
        <div>
          <div>{`${minutes}:${seconds.toString().padStart(2, '0')}`}</div>
          {label && <div style={{ fontSize: '0.5em', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}
