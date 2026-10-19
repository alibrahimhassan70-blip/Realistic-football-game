import React, { useState } from 'react';
import { CameraViewMode, Formation, StadiumTime } from '../game/types';
import { ChevronDown, ChevronUp, Camera, Sun, Compass, HelpCircle } from 'lucide-react';

interface BottomDockProps {
  cameraMode: CameraViewMode;
  onCameraChange: (mode: CameraViewMode) => void;
  stadiumTime: StadiumTime;
  onStadiumTimeChange: (time: StadiumTime) => void;
  formation: Formation;
  onFormationChange: (f: Formation) => void;
  onToggleHelp: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  cameraMode,
  onCameraChange,
  stadiumTime,
  onStadiumTimeChange,
  formation,
  onFormationChange,
  onToggleHelp,
}) => {
  // Start collapsed on small screens so virtual joystick has full clearance
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  return (
    <div
      className="pointer-events-auto fixed bottom-2 left-1/2 z-20 -translate-x-1/2 transition-transform duration-300 ease-out select-none max-w-[94vw] md:max-w-2xl"
      style={{
        transform: isCollapsed ? 'translate(-50%, calc(100% - 22px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 rounded-t-lg border-t border-x border-white/20 bg-slate-950/95 px-3 py-0.5 text-[10px] font-bold text-white/80 shadow-lg hover:text-white transition-colors"
          aria-label={isCollapsed ? 'Show Controls Dock' : 'Hide Controls Dock'}
        >
          {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{isCollapsed ? 'CAM & TACTICS' : 'COLLAPSE'}</span>
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-950/95 px-3 py-2 shadow-2xl backdrop-blur-none sm:gap-4 sm:px-4">
        {/* Camera Views */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 sm:pr-3">
          <Camera className="h-3.5 w-3.5 text-blue-400" />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onCameraChange('broadcast')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                cameraMode === 'broadcast'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Broadcast
            </button>
            <button
              type="button"
              onClick={() => onCameraChange('dynamic')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                cameraMode === 'dynamic'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Player Cam
            </button>
            <button
              type="button"
              onClick={() => onCameraChange('endline')}
              className={`hidden sm:inline rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                cameraMode === 'endline'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Goal Line
            </button>
          </div>
        </div>

        {/* Stadium Atmosphere Lighting */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 sm:pr-3">
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onStadiumTimeChange('night')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                stadiumTime === 'night'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              UCL Night
            </button>
            <button
              type="button"
              onClick={() => onStadiumTimeChange('sunset')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                stadiumTime === 'sunset'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sunset
            </button>
          </div>
        </div>

        {/* Formation Tactics */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 sm:pr-3">
          <Compass className="h-3.5 w-3.5 text-emerald-400" />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onFormationChange('4-3-3')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                formation === '4-3-3'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              4-3-3
            </button>
            <button
              type="button"
              onClick={() => onFormationChange('4-2-3-1')}
              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                formation === '4-2-3-1'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              4-2-3-1
            </button>
          </div>
        </div>

        {/* Controls Help */}
        <button
          type="button"
          onClick={onToggleHelp}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors"
          aria-label="Controls Guide"
        >
          <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
          <span>CONTROLS</span>
        </button>
      </div>
    </div>
  );
};
