import { useEffect, useState } from 'react';
import './BootDeviceNotFound.css';

type Phase = 'blank' | 'dell' | 'ide' | 'cd' | 'error' | 'recovery' | 'complete';

type BootDeviceNotFoundProps = {
  onExit?: () => void;
};

const phaseSchedule: Array<{ phase: Exclude<Phase, 'recovery' | 'complete'>; delay: number }> = [
  { phase: 'dell', delay: 500 },
  { phase: 'ide', delay: 2400 },
  { phase: 'cd', delay: 6200 },
  { phase: 'error', delay: 9800 },
];

export default function BootDeviceNotFound({ onExit }: BootDeviceNotFoundProps) {
  const [phase, setPhase] = useState<Phase>('blank');
  const [dotCount, setDotCount] = useState(1);
  const [recoveryProgress, setRecoveryProgress] = useState(0);

  useEffect(() => {
    const timers = phaseSchedule.map(({ phase: scheduledPhase, delay }) =>
      window.setTimeout(() => {
        setPhase(scheduledPhase);
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (phase !== 'ide' && phase !== 'cd') return;

    const dotInterval = window.setInterval(() => {
      setDotCount((current) => (current % 6) + 1);
    }, 220);

    return () => window.clearInterval(dotInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'recovery') return;

    setRecoveryProgress(0);
    const progressInterval = window.setInterval(() => {
      setRecoveryProgress((current) => {
        const next = Math.min(current + 4, 100);
        if (next === 100) {
          window.clearInterval(progressInterval);
          window.setTimeout(() => {
            setPhase('complete');
          }, 400);
        }
        return next;
      });
    }, 90);

    return () => window.clearInterval(progressInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'complete') return;

    const exitTimer = window.setTimeout(() => {
      onExit?.();
    }, 1600);

    return () => window.clearTimeout(exitTimer);
  }, [phase, onExit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit?.();
        return;
      }

      if (phase === 'error' && event.key === 'Enter') {
        event.preventDefault();
        setPhase('recovery');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, onExit]);

  const dots = '.'.repeat(dotCount);

  return (
    <div className="bdnf-screen">
      <div className="bdnf-panel">
        {phase === 'blank' && null}

        {phase === 'dell' && (
          <div className="bdnf-dell">
            <div className="bdnf-top-right">
              F2 - Setup Utility
              <br />
              Esc - Boot menu
            </div>
            <div className="bdnf-center">
              <img
                src="boot-device-not-found/dell.png"
                alt="Dell startup"
                className="bdnf-dell-logo"
              />
              <br />
              Bios Revision 2.18.0
              <br />
              <br />
              Welcome!
              <br />
              <br />
              Please Wait...
            </div>
          </div>
        )}

        {phase === 'ide' && (
          <div className="bdnf-text-block">
            Trying to boot from IDE0: WDC WD1600BEVT-223CHG{dots}
            <br />
            <br />
          </div>
        )}

        {phase === 'cd' && (
          <div className="bdnf-text-block">
            Trying to boot from CD/DVD: Optiarc DVD RW AD-98123-(P){dots}
            <br />
            <br />
          </div>
        )}

        {phase === 'error' && (
          <div className="bdnf-text-block">
            Boot Device Not Found
            <br />
            <br />
            Please install an operating system on your hard disk:
            <br />
            Hard Disk (3F0)
            <br />
            <br />
            <button
              className="bdnf-option"
              type="button"
              onClick={() => setPhase('recovery')}
            >
              Start The Last Known Good Configuration
            </button>
            <br />
            <br />
            Press Enter to continue or Esc to exit
          </div>
        )}

        {phase === 'recovery' && (
          <div className="bdnf-text-block">
            Attempting automatic recovery...
            <br />
            <br />
            Restoring boot configuration
            <div className="bdnf-progress" aria-hidden="true">
              <div
                className="bdnf-progress-bar"
                style={{ width: `${recoveryProgress}%` }}
              />
            </div>
            {recoveryProgress}%
          </div>
        )}

        {phase === 'complete' && (
          <div className="bdnf-text-block">
            Boot configuration restored.
            <br />
            <br />
            Restarting system...
          </div>
        )}
      </div>
    </div>
  );
}
