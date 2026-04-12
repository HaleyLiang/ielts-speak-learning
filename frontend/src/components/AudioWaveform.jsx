/**
 * AudioWaveform - Real-time audio visualization bars
 */

import { useState, useEffect, useRef } from 'react';

export default function AudioWaveform({ isActive, barCount = 20 }) {
  const [bars, setBars] = useState(Array(barCount).fill(4));
  const animationRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      const animate = () => {
        setBars(prev =>
          prev.map(() => Math.random() * 36 + 4)
        );
        animationRef.current = requestAnimationFrame(animate);
      };
      // Slow it down to ~20fps for visual smoothness
      const interval = setInterval(() => {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }, 80);

      return () => {
        clearInterval(interval);
        cancelAnimationFrame(animationRef.current);
      };
    } else {
      setBars(Array(barCount).fill(4));
    }
  }, [isActive, barCount]);

  return (
    <div className="waveform">
      {bars.map((height, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{ 
            height: `${height}px`,
            opacity: isActive ? 0.6 + Math.random() * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
