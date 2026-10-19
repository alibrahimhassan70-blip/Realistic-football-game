import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { MatchSimulation } from './game/MatchSimulation';
import { CameraViewMode, Formation, GameMode, MatchScore, MatchState, PlayerData, StadiumTime } from './game/types';
import { SUPERSTARS } from './game/playersData';
import { BroadcastHUD } from './components/BroadcastHUD';
import { MobileControls } from './components/MobileControls';
import { BottomDock } from './components/BottomDock';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { soundManager } from './game/audio/soundManager';
import { Trophy, Play, Sparkles, Shield, Zap, Settings2 } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<MatchSimulation | null>(null);

  // App & Game States
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [matchState, setMatchState] = useState<MatchState>('kickoff');
  const [gameMode, setGameMode] = useState<GameMode>('kickoff');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('broadcast');
  const [stadiumTime, setStadiumTime] = useState<StadiumTime>('night');
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [graphicsTier, setGraphicsTier] = useState<'4k' | 'high' | 'balanced'>('4k');

  const [score, setScore] = useState<MatchScore>({ home: 0, away: 0, timeSeconds: 0, period: 1 });
  const [activePlayer, setActivePlayer] = useState<PlayerData | null>(SUPERSTARS[0]);
  const [shootPower, setShootPower] = useState(0);
  const [goalScorer, setGoalScorer] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [isModesModalOpen, setIsModesModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Initialize Three.js WebGL Match Simulation once
  useEffect(() => {
    if (!mountRef.current) return;

    // Check for ?autostart=1
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    const sim = new MatchSimulation(
      mountRef.current,
      {
        onScoreUpdate: (newScore) => {
          setScore({ ...newScore });
        },
        onGoalScored: (scoringTeam, scorerName) => {
          setGoalScorer(scorerName);
          // Launch celebration confetti
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#ffd700', '#0047ab', '#ffffff', '#00ffcc'],
            });
          } catch {
            // Confetti optional
          }
        },
        onStateChange: (newState) => {
          setMatchState(newState);
        },
        onShootPowerChange: (power) => {
          setShootPower(power);
        },
        onActivePlayerChange: (player) => {
          setActivePlayer(player);
        },
      },
      'kickoff'
    );

    simRef.current = sim;

    if (autostart) {
      setGameState('playing');
      document.body.dataset.state = 'playing';
      sim.resetBallAndPlayers();
    } else {
      document.body.dataset.state = 'title';
    }

    return () => {
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  // Keyboard shortcut listener for Start, Pause, Mute, Restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startGame();
      } else if (gameState === 'playing' && (e.code === 'Escape' || e.code === 'KeyP')) {
        setGameState('paused');
        document.body.dataset.state = 'paused';
      } else if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        setGameState('playing');
        document.body.dataset.state = 'playing';
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyR') {
        restartMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const startGame = (mode: GameMode = gameMode) => {
    setGameState('playing');
    document.body.dataset.state = 'playing';
    if (simRef.current) {
      simRef.current.setGameMode(mode);
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (gameState === 'playing') {
      simRef.current?.setGameMode(mode);
    }
  };

  const handleCameraChange = (cam: CameraViewMode) => {
    setCameraMode(cam);
    simRef.current?.setCameraMode(cam);
  };

  const handleStadiumTimeChange = (time: StadiumTime) => {
    setStadiumTime(time);
    simRef.current?.setStadiumTime(time);
  };

  const handleFormationChange = (f: Formation) => {
    setFormation(f);
    simRef.current?.setTactics(f);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const restartMatch = () => {
    setScore({ home: 0, away: 0, timeSeconds: 0, period: 1 });
    setGoalScorer(null);
    simRef.current?.resetBallAndPlayers();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      {/* 1. Isolated WebGL 3D Mount Container */}
      <div
        ref={mountRef}
        data-testid="webgl-canvas-container"
        className="absolute inset-0 h-full w-full"
      />

      {/* 2. Title & Kick-off Landing Screen (when gameState === 'title') */}
      {gameState === 'title' && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-between bg-black/60 p-6 md:p-10 backdrop-blur-none">
          {/* Header Bar */}
          <div className="flex w-full max-w-5xl items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black">
                4K
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                Next-Gen Football Engine
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                Controls
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                {isMuted ? 'Unmute Audio' : 'Sound ON'}
              </button>
            </div>
          </div>

          {/* Central Hero Lockup */}
          <div className="flex flex-col items-center text-center max-w-2xl">
            {/* Custom SVG Crest Trophy Emblem */}
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 shadow-2xl border-2 border-white/30">
              <Trophy className="h-10 w-10 text-white drop-shadow-md" />
            </div>

            <h1 className="mt-4 text-4xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-lg">
              APEX FOOTBALL 3D
            </h1>

            <p className="mt-2 text-sm md:text-base font-semibold text-amber-300 drop-shadow">
              Ultra-Realistic Physics · Broadcast Camera · Champions League Atmosphere
            </p>

            {/* Matchup Banner */}
            <div className="mt-6 flex items-center justify-center gap-4 rounded-xl border border-white/20 bg-slate-950/80 px-6 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-blue-600 border border-white/40" />
                <span className="font-black text-sm text-white">Madrid Royals</span>
              </div>
              <span className="font-mono text-xs font-bold text-white/40">VS</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">Global All-Stars</span>
                <span className="h-3.5 w-3.5 rounded-full bg-red-600 border border-white/40" />
              </div>
            </div>

            {/* Primary Start CTA Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                data-start="true"
                onClick={() => startGame('kickoff')}
                className="flex items-center gap-3 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-4 font-black text-lg uppercase tracking-wide text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
                aria-label="Start Football Match"
              >
                <Play className="h-6 w-6 fill-white" />
                <span>KICK OFF MATCH</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectMode('shootout');
                  startGame('shootout');
                }}
                className="flex items-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-950/80 px-6 py-4 font-bold text-sm uppercase tracking-wide text-amber-300 shadow-xl hover:bg-amber-900 active:scale-95 transition-all"
              >
                <Zap className="h-5 w-5 text-amber-400" />
                <span>Penalty Shootout</span>
              </button>
            </div>

            {/* Quick Mode & Squad Preview Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsModesModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/90 hover:bg-white/10"
              >
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                <span>Superstar Roster: Mbappé, Haaland, CR7, Messi</span>
              </button>

              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Engine: 4K PBR Grass & Net Physics</span>
              </div>
            </div>
          </div>

          {/* Clean Flat Control Hint in Bottom Safe Margin */}
          <div className="border-t border-white/10 pt-4 text-center text-xs text-white/60">
            <span>WASD / Joystick Move · C Shoot · X Pass · Shift Sprint · V Tackle · Space Switch</span>
          </div>
        </div>
      )}

      {/* 3. In-Game Broadcast HUD (when gameState === 'playing' or 'paused') */}
      {gameState === 'playing' && (
        <>
          <BroadcastHUD
            score={score}
            matchState={matchState}
            activePlayer={activePlayer}
            shootPower={shootPower}
            isMuted={isMuted}
            goalScorer={goalScorer}
            onToggleMute={toggleMute}
            onRestart={restartMatch}
            onOpenModes={() => setIsModesModalOpen(true)}
          />

          {/* Mobile Touch Virtual Controls */}
          <MobileControls
            onJoystickMove={(x, z) => {
              simRef.current?.setVirtualJoystick(x, z);
            }}
            onPass={() => {
              simRef.current?.triggerPass();
            }}
            onThrough={() => {
              simRef.current?.triggerThrough();
            }}
            onShootStart={() => {
              simRef.current?.setVirtualShoot(true);
            }}
            onShootEnd={() => {
              simRef.current?.setVirtualShoot(false);
            }}
            onTackle={() => {
              simRef.current?.triggerTackle();
            }}
            onSprintToggle={(active) => {
              simRef.current?.setVirtualSprint(active);
            }}
            shootPower={shootPower}
          />

          {/* Collapsible Bottom Control Dock */}
          <BottomDock
            cameraMode={cameraMode}
            onCameraChange={handleCameraChange}
            stadiumTime={stadiumTime}
            onStadiumTimeChange={handleStadiumTimeChange}
            formation={formation}
            onFormationChange={handleFormationChange}
            onToggleHelp={() => setIsHelpModalOpen(true)}
          />
        </>
      )}

      {/* 4. Pause Status Modal Card */}
      {gameState === 'paused' && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase text-white">Match Paused</h2>
            <p className="mt-1 text-xs text-white/60">Tactical Pause & Match Settings</p>

            <div className="my-6 flex items-center justify-center gap-6 rounded-xl border border-white/10 bg-slate-900/80 p-4 w-full">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50">MADRID</span>
                <p className="text-2xl font-mono font-black text-white">{score.home}</p>
              </div>
              <span className="text-lg font-bold text-white/30">-</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50">ALL-STARS</span>
                <p className="text-2xl font-mono font-black text-white">{score.away}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setGameState('playing');
                  document.body.dataset.state = 'playing';
                }}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-xs uppercase text-white hover:bg-blue-500"
              >
                Resume Match (ESC)
              </button>

              <button
                type="button"
                onClick={restartMatch}
                className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 font-bold text-xs uppercase text-white hover:bg-white/10"
              >
                Restart Kickoff
              </button>

              <button
                type="button"
                onClick={() => {
                  setGameState('title');
                  document.body.dataset.state = 'title';
                }}
                className="w-full rounded-xl border border-red-500/20 bg-red-950/40 py-2.5 font-bold text-xs uppercase text-red-300 hover:bg-red-900/50"
              >
                Exit to Title Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      <ModeSelectorModal
        isOpen={isModesModalOpen}
        currentMode={gameMode}
        onSelectMode={handleSelectMode}
        onClose={() => setIsModesModalOpen(false)}
      />

      <ControlsGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
