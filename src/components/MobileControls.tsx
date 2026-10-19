import React, { useRef, useState } from 'react';

interface MobileControlsProps {
  onJoystickMove: (x: number, z: number) => void;
  onPass: () => void;
  onThrough: () => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  onTackle: () => void;
  onSprintToggle: (active: boolean) => void;
  shootPower: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onPass,
  onThrough,
  onShootStart,
  onShootEnd,
  onTackle,
  onSprintToggle,
  shootPower,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  const [sprintActive, setSprintActive] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 8;

    let clampedX = dx;
    let clampedY = dy;
    if (distance > maxRadius) {
      clampedX = (dx / distance) * maxRadius;
      clampedY = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: clampedX, y: clampedY });
    // Invert Y to match pitch Z coordinate (moving up pushes player forward -Z or +X)
    const normX = clampedX / maxRadius;
    const normZ = clampedY / maxRadius;
    // Rotate to match horizontal broadcast perspective (joystick right = +X towards opponent goal, up = -Z)
    onJoystickMove(normX, normZ);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* Virtual Joystick (Bottom Left) */}
      <div className="pointer-events-auto absolute bottom-8 left-6 md:hidden">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-sm"
          aria-label="Movement Joystick"
        >
          {/* Inner Deadzone Ring */}
          <div className="h-12 w-12 rounded-full border border-white/10" />
          {/* Draggable Knob */}
          <div
            className={`absolute h-14 w-14 rounded-full border-2 border-emerald-400 bg-emerald-500/80 shadow-lg transition-transform ${
              isTouching ? 'scale-110' : 'scale-100'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="pointer-events-auto absolute bottom-8 right-6 flex flex-col items-end gap-3 md:hidden">
        {/* Top Row: Sprint & Through */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !sprintActive;
              setSprintActive(next);
              onSprintToggle(next);
            }}
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-bold text-xs shadow-lg active:scale-95 ${
              sprintActive
                ? 'border-cyan-300 bg-cyan-600 text-white shadow-cyan-500/50'
                : 'border-white/20 bg-gray-900/80 text-white/90'
            }`}
            aria-label="Sprint Boost"
          >
            SPRINT
          </button>

          <button
            type="button"
            onClick={onThrough}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-600/90 font-bold text-xs text-white shadow-lg active:scale-95"
            aria-label="Through Ball"
          >
            THROUGH
          </button>
        </div>

        {/* Bottom Cluster: Shoot, Pass, Tackle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTackle}
            className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-purple-400/40 bg-purple-700/90 font-bold text-xs text-white shadow-lg active:scale-95"
            aria-label="Slide Tackle"
          >
            SLIDE
          </button>

          <button
            type="button"
            onClick={onPass}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-600/90 font-extrabold text-sm text-white shadow-xl active:scale-95"
            aria-label="Short Pass"
          >
            PASS
          </button>

          {/* Shoot Button with Live Power Meter Arc */}
          <div className="relative">
            {shootPower > 0 && (
              <div
                className="absolute -top-3 left-0 right-0 h-2 overflow-hidden rounded-full bg-black/60 border border-white/20"
                style={{ width: '100%' }}
              >
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 transition-all"
                  style={{ width: `${shootPower * 100}%` }}
                />
              </div>
            )}
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                onShootStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onShootEnd();
              }}
              onMouseDown={onShootStart}
              onMouseUp={onShootEnd}
              className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-red-400/60 bg-gradient-to-br from-red-600 to-amber-600 font-black text-base text-white shadow-2xl active:scale-95"
              aria-label="Shoot Power"
            >
              SHOOT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
