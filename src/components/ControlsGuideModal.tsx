import React from 'react';
import { X, Keyboard, Gamepad2, Smartphone } from 'lucide-react';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-white">Match Controls & Commands</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Close Controls Guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Keyboard */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-3">
              <Keyboard className="h-4 w-4" />
              <h3 className="font-extrabold text-sm uppercase">PC Keyboard</h3>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-white/80">
              <li className="flex justify-between">
                <span className="text-white/60">Dribble / Move:</span>
                <span className="font-mono font-bold text-amber-300">W A S D / Arrow Keys</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Short Pass:</span>
                <span className="font-mono font-bold text-emerald-400">X or K</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Shoot (Hold for Power & Curve):</span>
                <span className="font-mono font-bold text-red-400">C or J</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Sprint Turbo:</span>
                <span className="font-mono font-bold text-cyan-400">Shift</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Through Ball:</span>
                <span className="font-mono font-bold text-amber-400">Z or L</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Slide Tackle / Switch Player:</span>
                <span className="font-mono font-bold text-purple-400">V or Space</span>
              </li>
            </ul>
          </div>

          {/* Mobile & Gamepad */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <Smartphone className="h-4 w-4" />
              <h3 className="font-extrabold text-sm uppercase">Mobile Touch & Gamepad</h3>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-white/80">
              <li className="flex justify-between">
                <span className="text-white/60">Analog Thumbstick:</span>
                <span className="font-mono font-bold text-white">Left Floating Stick</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Shoot Action:</span>
                <span className="font-mono font-bold text-red-400">Red Button (Hold power)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Pass Action:</span>
                <span className="font-mono font-bold text-emerald-400">Green Button</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Sprint Action:</span>
                <span className="font-mono font-bold text-cyan-400">Cyan Button (Toggle)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Slide Tackle:</span>
                <span className="font-mono font-bold text-purple-400">Purple Button</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/60">Controller:</span>
                <span className="font-mono font-bold text-amber-300">Xbox / PS Auto-detect</span>
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 font-bold text-xs uppercase text-white hover:bg-blue-500"
        >
          Got It, Resume Match
        </button>
      </div>
    </div>
  );
};
