import { useRef } from 'react';

export function useAudio() {
  const spinLoopAudio = useRef(null);

  const playSpinLoop = () => {
    if (spinLoopAudio.current) {
      spinLoopAudio.current.pause();
      spinLoopAudio.current.currentTime = 0;
    }
    spinLoopAudio.current = new Audio('/assets/spin_loop.mp3');
    spinLoopAudio.current.loop = true;
    spinLoopAudio.current.play();
  };

  const stopSpinLoop = () => {
    if (spinLoopAudio.current) {
      spinLoopAudio.current.pause();
      spinLoopAudio.current.currentTime = 0;
      spinLoopAudio.current = null;
    }
  };

  const playSpinClick = () => {
    const audio = new Audio('/assets/spin.mp3');
    audio.play();
  };

  return {
    playSpinLoop,
    stopSpinLoop,
    playSpinClick
  };
} 