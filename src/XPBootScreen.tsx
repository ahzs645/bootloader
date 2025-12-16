import { useState, useEffect, useCallback } from 'react';
import './XPBootScreen.css';

type BootPhase = 'post' | 'bootloader' | 'boot' | 'login' | 'logging-in' | 'desktop';

type User = {
  id: string;
  name: string;
  avatar: string;
};

const defaultUsers: User[] = [
  { id: '1', name: 'Administrator', avatar: 'xp/images/user/astronaut.png' },
  { id: '2', name: 'Guest', avatar: 'xp/images/user/butterfly.png' },
];

type XPBootScreenProps = {
  users?: User[];
  postDuration?: number;
  bootloaderDuration?: number;
  bootDuration?: number;
  onLogin?: (user: User) => void;
  onExit?: () => void;
};

export default function XPBootScreen({
  users = defaultUsers,
  postDuration = 3500,
  bootloaderDuration = 5000,
  bootDuration = 4000,
  onLogin,
  onExit,
}: XPBootScreenProps) {
  const [phase, setPhase] = useState<BootPhase>('post');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loggingInUser, setLoggingInUser] = useState<User | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [postLines, setPostLines] = useState<string[]>([]);
  const [bootloaderIndex, setBootloaderIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);

  const bootOptions = [
    { id: 'start', label: 'Start Windows XP' },
    { id: 'safemode', label: 'Safe Mode' },
    { id: 'lastknown', label: 'Last Known Good Configuration' },
  ];

  // POST screen animation
  useEffect(() => {
    if (phase !== 'post') return;

    const totalMemory = 2097152; // 2GB in KB
    const memoryStep = totalMemory / 15;
    let currentMemory = 0;

    // Initial POST lines
    setPostLines([
      'Award Modular BIOS v4.51PG, An Energy Star Ally',
      'Copyright (C) 1984-2025, Award Software, Inc.',
      '',
      'Main Processor : Intel(R) Pentium(R) 4 CPU 2.80GHz',
      '',
    ]);

    // Memory count animation
    const memoryInterval = setInterval(() => {
      currentMemory += memoryStep;
      if (currentMemory >= totalMemory) {
        currentMemory = totalMemory;
        clearInterval(memoryInterval);
      }
      setMemoryCount(Math.floor(currentMemory));
    }, 120);

    // Add drive detection lines
    const addLinesTimeout = setTimeout(() => {
      setPostLines(prev => [
        ...prev,
        `Memory Testing : ${totalMemory}K OK`,
        '',
        'Detecting Pri Master ... Virtual Hard Disk C:',
        'Detecting Pri Slave  ... Virtual Hard Disk D:',
        'Detecting Sec Master ... Virtual CD/DVD E:',
        'Detecting Sec Slave  ... None',
        '',
        'Initializing USB Controllers ... Done',
        '',
      ]);
    }, 2000);

    // Transition to bootloader
    const transitionTimeout = setTimeout(() => {
      setPhase('bootloader');
    }, postDuration);

    return () => {
      clearInterval(memoryInterval);
      clearTimeout(addLinesTimeout);
      clearTimeout(transitionTimeout);
    };
  }, [phase, postDuration]);

  // Bootloader countdown
  useEffect(() => {
    if (phase !== 'bootloader') return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setPhase('boot');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [phase]);

  // Windows boot animation timer
  useEffect(() => {
    if (phase === 'boot') {
      const timer = setTimeout(() => {
        setPhase('login');
      }, bootDuration);
      return () => clearTimeout(timer);
    }
  }, [phase, bootDuration]);

  // Handle login
  const handleLogin = useCallback((user: User) => {
    setLoggingInUser(user);
    setPhase('logging-in');

    setTimeout(() => {
      setPhase('desktop');
      onLogin?.(user);
    }, 2000);
  }, [onLogin]);

  // Handle user click
  const handleUserClick = (user: User) => {
    if (selectedUser?.id === user.id) {
      handleLogin(user);
    } else {
      setSelectedUser(user);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC exits at any phase
      if (e.key === 'Escape') {
        onExit?.();
        return;
      }

      // Bootloader navigation
      if (phase === 'bootloader') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setBootloaderIndex(prev => (prev - 1 + bootOptions.length) % bootOptions.length);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setBootloaderIndex(prev => (prev + 1) % bootOptions.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setPhase('boot');
        }
      }

      // Login screen navigation
      if (phase === 'login') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = selectedUser
            ? users.findIndex(u => u.id === selectedUser.id)
            : -1;

          let newIndex: number;
          if (e.key === 'ArrowUp') {
            newIndex = currentIndex <= 0 ? users.length - 1 : currentIndex - 1;
          } else {
            newIndex = currentIndex >= users.length - 1 ? 0 : currentIndex + 1;
          }
          setSelectedUser(users[newIndex]);
        } else if (e.key === 'Enter' && selectedUser) {
          handleLogin(selectedUser);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selectedUser, users, handleLogin, onExit, bootOptions.length]);

  // POST screen
  if (phase === 'post') {
    return (
      <div className="xp-post">
        <div className="post-header">
          <img src="xp/images/energystar.png" alt="Energy Star" className="epa-logo" />
        </div>
        <div className="post-content">
          <pre className="post-text">
{postLines.join('\n')}
{memoryCount > 0 && memoryCount < 2097152 && `Memory Testing : ${memoryCount}K`}
          </pre>
        </div>
        <div className="post-footer">
          <pre>Press &lt;DEL&gt; to enter SETUP, &lt;F12&gt; for Boot Menu</pre>
        </div>
      </div>
    );
  }

  // Bootloader screen
  if (phase === 'bootloader') {
    return (
      <div className="xp-bootloader">
        <div className="bootloader-content">
          <p className="bootloader-hint">Use the ↑ and ↓ keys to move the selection.</p>
          <p className="bootloader-hint">Press ENTER to boot the selected OS, or ESC to exit.</p>
          <p className="bootloader-title">Please select an option:</p>
          <ul className="boot-options">
            {bootOptions.map((option, index) => (
              <li
                key={option.id}
                className={index === bootloaderIndex ? 'selected' : ''}
                onClick={() => {
                  setBootloaderIndex(index);
                  setPhase('boot');
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
          <p className="bootloader-countdown">
            Booting in <span>{countdown}</span>...
          </p>
        </div>
      </div>
    );
  }

  // Windows boot screen
  if (phase === 'boot') {
    return (
      <div className="xp-boot">
        <img src="xp/images/boot.gif" alt="Windows XP Boot" />
      </div>
    );
  }

  // Login screen
  if (phase === 'login' || phase === 'logging-in') {
    return (
      <div className="xp-login">
        <div className="xp-login-top" />
        <div className="xp-login-middle">
          <div className="xp-login-holder">
            <div className="xp-login-left">
              <img
                src="xp/images/logo/white.png"
                alt="Windows XP"
                className="xp-logo"
              />
              <div className="xp-login-msg">
                {phase === 'logging-in'
                  ? 'Loading your personal settings...'
                  : 'To begin, click your user name'}
              </div>
            </div>
            <div className="xp-login-right">
              <div className="xp-login-container">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`xp-login-user ${selectedUser?.id === user.id ? 'selected' : ''} ${loggingInUser?.id === user.id ? 'active' : ''}`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="xp-login-user-inner">
                      <img src={user.avatar} alt={user.name} className="xp-user-avatar" />
                      <div className="xp-user-info">
                        <div className="xp-user-name">{user.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="xp-login-bottom">
          <div className="xp-login-footer">
            Press ESC to exit
          </div>
        </div>
      </div>
    );
  }

  // Desktop placeholder (after login)
  return (
    <div className="xp-desktop">
      <div className="xp-desktop-content">
        <h2>Welcome, {loggingInUser?.name}</h2>
        <p>Windows XP Desktop</p>
        <button onClick={onExit} className="xp-exit-btn">
          Exit to Bootloader
        </button>
      </div>
    </div>
  );
}
