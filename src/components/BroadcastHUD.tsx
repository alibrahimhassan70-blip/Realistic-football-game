import React from 'react';
import { MatchScore, MatchState, PlayerData } from '../game/types';
import { Volume2, VolumeX, RotateCcw, Shield, Trophy } from 'lucide-react';

interface BroadcastHUDProps {
  score: MatchScore;
  matchState: MatchState;
  activePlayer: PlayerData | null;
  shootPower: number;
  isMuted: boolean;
  goalScorer: string | null;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenModes: () => void;
}

export const BroadcastHUD: React.FC<BroadcastHUDProps> = ({
  score,
  matchState,
  activePlayer,
  shootPower,
  isMuted,
  goalScorer,
  onToggleMute,
  onRestart,
  onOpenModes,
}) => {
  // Format match clock (0 to 90 minutes)
  const totalMinutes = Math.min(90, Math.floor(score.timeSeconds / 60));
  const seconds = Math.floor(score.timeSeconds % 60);
  const formattedTime = `${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      {/* Top Header: Broadcast TV Scoreboard & Utility Buttons */}
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        {/* Scoreboard Badge */}
        <div className="pointer-events-auto flex items-center rounded-lg border border-white/20 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-none">
          {/* UEFA Champions League Star Pill */}
          <div className="hidden xs:flex items-center gap-1 bg-gradient-to-r from-blue-900 to-indigo-900 px-2 sm:px-3 py-1.5 sm:py-2 border-r border-white/10">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-extrabold text-[10px] sm:text-xs uppercase tracking-wider text-amber-300">UCL</span>
          </div>

          {/* Teams & Score */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs">
            {/* Home Team */}
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 border border-white/40" />
              <span className="font-black text-xs sm:text-sm text-white">MAD</span>
            </div>

            {/* Scoreboard Numerals */}
            <div className="flex items-center gap-1 rounded bg-black/60 px-1.5 sm:px-2 py-0.5 font-mono text-xs sm:text-sm font-black text-white border border-white/10">
              <span className="text-emerald-400">{score.home}</span>
              <span className="text-white/40">-</span>
              <span className="text-red-400">{score.away}</span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-1">
              <span className="font-black text-xs sm:text-sm text-white">GLO</span>
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 border border-white/40" />
            </div>

            {/* Clock */}
            <div className="border-l border-white/10 pl-1.5 sm:pl-2">
              <span className="font-mono text-[11px] sm:text-xs font-bold text-amber-300 tabular-nums">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Utilities */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModes}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/80 px-3 py-2 text-xs font-bold text-amber-300 shadow-lg hover:bg-amber-900 transition-colors"
            aria-label="Game Modes & Squads"
          >
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">MODES & SQUADS</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-slate-900/90 text-white shadow-lg hover:bg-slate-800 transition-colors"
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-slate-900/90 text-white shadow-lg hover:bg-slate-800 transition-colors"
            aria-label="Restart Match"
          >
            <RotateCcw className="h-4 w-4 text-white/80" />
          </button>
        </div>
      </div>

      {/* Goal Celebration Banner */}
      {matchState === 'goal' && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center justify-center animate-bounce">
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 px-8 py-5 shadow-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              ⚡ SPECTACULAR GOAL ⚡
            </span>
            <h1 className="mt-1 font-black text-3xl md:text-5xl uppercase tracking-tight text-white drop-shadow-md">
              {goalScorer || 'KYLIAN MBAPPÉ'}
            </h1>
            <p className="mt-1 text-sm font-semibold text-emerald-300">
              Next-Gen Precision Strike · Replay in Progress
            </p>
          </div>
        </div>
      )}

      {/* Bottom Center Shot Power Meter (if charging on desktop or mobile) */}
      {shootPower > 0 && (
        <div className="pointer-events-none mx-auto mb-20 flex flex-col items-center gap-1">
          <span className="font-extrabold text-xs tracking-wider text-amber-300 drop-shadow">
            POWER {Math.round(shootPower * 100)}%
          </span>
          <div className="h-3 w-48 overflow-hidden rounded-full border border-white/30 bg-black/80">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 transition-all duration-75"
              style={{ width: `${shootPower * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Left: Active Player Card & Super Stats */}
      {activePlayer && (
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 rounded-xl border border-white/20 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-none max-w-sm">
          {/* Rating Badge */}
          <div className="flex h-13 w-13 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-black text-slate-950 shadow-md">
            <span className="text-lg leading-none font-black">{activePlayer.stats.overall}</span>
            <span className="text-[10px] uppercase font-bold tracking-tighter">{activePlayer.position}</span>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-wide">
                {activePlayer.name}
              </span>
              <span className="rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                #{activePlayer.number}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-white/70">
              <span>PAC {activePlayer.stats.pace}</span>
              <span>·</span>
              <span>SHO {activePlayer.stats.shooting}</span>
              <span>·</span>
              <span>DRI {activePlayer.stats.dribbling}</span>
            </div>

            {/* Signature Skill */}
            <span className="mt-1 text-[10px] font-bold text-emerald-400">
              ⚡ {activePlayer.signatureSkill}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
