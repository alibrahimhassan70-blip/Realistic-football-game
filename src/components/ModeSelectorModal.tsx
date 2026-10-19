import React, { useState } from 'react';
import { GameMode, PlayerData } from '../game/types';
import { SUPERSTARS } from '../game/playersData';
import { X, Play, Trophy, Crosshair, Star, Dumbbell, Sparkles, ShieldCheck } from 'lucide-react';

interface ModeSelectorModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onClose: () => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  currentMode,
  onSelectMode,
  onClose,
}) => {
  const [selectedSuperstar, setSelectedSuperstar] = useState<PlayerData>(SUPERSTARS[0]);
  const [activeTab, setActiveTab] = useState<'modes' | 'squad'>('modes');

  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
              <Trophy className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                Apex Match Operations
              </h2>
              <p className="text-xs text-white/60">Select Competition Mode or Inspect Ultimate Roster</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch */}
            <div className="flex rounded-lg bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('modes')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'modes' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                MODES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('squad')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'squad' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                SUPERSTARS
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Game Modes */}
        {activeTab === 'modes' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {/* Kick Off */}
            <div
              onClick={() => {
                onSelectMode('kickoff');
                onClose();
              }}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                currentMode === 'kickoff'
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Play className="h-6 w-6 text-emerald-400" />
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  FEATURED
                </span>
              </div>
              <h3 className="mt-3 font-black text-lg text-white">Champions Kick Off</h3>
              <p className="mt-1 text-xs text-white/60">
                Play a full Champions League final with realistic 3D ball physics, superstar dribbling, and broadcast cameras.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-xs font-black uppercase text-white hover:bg-emerald-500 transition-colors"
              >
                Play Match
              </button>
            </div>

            {/* Penalty Shootout */}
            <div
              onClick={() => {
                onSelectMode('shootout');
                onClose();
              }}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                currentMode === 'shootout'
                  ? 'border-amber-500 bg-amber-950/30'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Crosshair className="h-6 w-6 text-amber-400" />
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  DRAMA 1V1
                </span>
              </div>
              <h3 className="mt-3 font-black text-lg text-white">Penalty Shootout</h3>
              <p className="mt-1 text-xs text-white/60">
                1-on-1 penalty showdown against the goalkeeper. Curl your shot into the top corner or test keeper reflexes!
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-amber-600 py-2 text-xs font-black uppercase text-white hover:bg-amber-500 transition-colors"
              >
                Start Shootout
              </button>
            </div>

            {/* Tournament Mode */}
            <div
              onClick={() => {
                onSelectMode('tournament');
                onClose();
              }}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                currentMode === 'tournament'
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Trophy className="h-6 w-6 text-blue-400" />
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                  ROAD TO GLORY
                </span>
              </div>
              <h3 className="mt-3 font-black text-lg text-white">Champions Cup</h3>
              <p className="mt-1 text-xs text-white/60">
                Tournament bracket mode. Advance through the knockout stages to lift the coveted European Champions Trophy.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-xs font-black uppercase text-white hover:bg-blue-500 transition-colors"
              >
                Enter Cup
              </button>
            </div>

            {/* Training Mode */}
            <div
              onClick={() => {
                onSelectMode('training');
                onClose();
              }}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                currentMode === 'training'
                  ? 'border-purple-500 bg-purple-950/30'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Dumbbell className="h-6 w-6 text-purple-400" />
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  DRILLS
                </span>
              </div>
              <h3 className="mt-3 font-black text-lg text-white">Training Ground</h3>
              <p className="mt-1 text-xs text-white/60">
                Practice free kicks, curve shooting, slide tackles, and sprint bursts with zero pressure.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-purple-600 py-2 text-xs font-black uppercase text-white hover:bg-purple-500 transition-colors"
              >
                Practice Drills
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Ultimate Squad Showcase */}
        {activeTab === 'squad' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Player Roster List */}
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-2">
              {SUPERSTARS.map((star) => (
                <div
                  key={star.id}
                  onClick={() => setSelectedSuperstar(star)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                    selectedSuperstar.id === star.id
                      ? 'border-amber-400 bg-amber-950/30'
                      : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-black text-slate-950 shadow">
                      <span className="text-sm font-black">{star.stats.overall}</span>
                      <span className="text-[9px] uppercase font-bold">{star.position}</span>
                    </div>
                    <div>
                      <div className="font-black text-sm text-white">{star.name}</div>
                      <div className="text-[11px] text-white/60">#{star.number} · {star.team === 'home' ? 'Madrid Royals' : 'Global Titans'}</div>
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
              ))}
            </div>

            {/* Selected Superstar Spotlight Card */}
            <div className="md:col-span-2 flex flex-col justify-between rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 shadow-2xl">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <span className="font-extrabold text-xs uppercase tracking-widest text-amber-300">
                      OFFICIAL NEXT-GEN CARD
                    </span>
                  </div>
                  <span className="rounded bg-blue-600 px-2 py-0.5 font-mono text-xs font-black text-white">
                    {selectedSuperstar.rarity.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <h3 className="font-black text-2xl md:text-3xl text-white">
                      {selectedSuperstar.name}
                    </h3>
                    <p className="text-sm text-emerald-400 font-bold">
                      #{selectedSuperstar.number} · {selectedSuperstar.position}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 font-black text-slate-950 shadow-xl">
                    <span className="text-2xl font-black">{selectedSuperstar.stats.overall}</span>
                    <span className="text-[10px] font-bold">OVR</span>
                  </div>
                </div>

                {/* Radar Attributes */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">PACE</span>
                    <p className="font-black text-xl text-white">{selectedSuperstar.stats.pace}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">SHOOTING</span>
                    <p className="font-black text-xl text-amber-400">{selectedSuperstar.stats.shooting}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">PASSING</span>
                    <p className="font-black text-xl text-white">{selectedSuperstar.stats.passing}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">DRIBBLING</span>
                    <p className="font-black text-xl text-cyan-400">{selectedSuperstar.stats.dribbling}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">DEFENSE</span>
                    <p className="font-black text-xl text-white">{selectedSuperstar.stats.defense}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-bold text-white/50">PHYSICAL</span>
                    <p className="font-black text-xl text-emerald-400">{selectedSuperstar.stats.physical}</p>
                  </div>
                </div>

                {/* Signature Moves */}
                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-black/40 p-4 border border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white/70">Signature Skill:</span>
                    <span className="text-xs font-black text-emerald-300">{selectedSuperstar.signatureSkill}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white/70">Signature Celebration:</span>
                    <span className="text-xs font-black text-amber-300">{selectedSuperstar.celebration}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-black text-sm uppercase tracking-wider text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
              >
                Deploy into Current Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
