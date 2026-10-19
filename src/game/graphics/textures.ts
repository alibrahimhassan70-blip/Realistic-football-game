import * as THREE from 'three';
import { PITCH_LENGTH, PITCH_WIDTH, HALF_LENGTH, HALF_WIDTH } from '../constants';

export function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Base grass stripes (12 vertical mow stripes)
  const stripes = 14;
  const stripeW = w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1b6422' : '#22782a';
    ctx.fillRect(i * stripeW, 0, stripeW, h);
  }

  // 2. Add grass blade noise texture overlay
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 1.2));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  // Helper coordinate converter from pitch meters to canvas pixels
  const toX = (mX: number) => ((mX + HALF_LENGTH) / PITCH_LENGTH) * (w - 120) + 60;
  const toY = (mZ: number) => ((mZ + HALF_WIDTH) / PITCH_WIDTH) * (h - 120) + 60;

  const leftX = toX(-HALF_LENGTH);
  const rightX = toX(HALF_LENGTH);
  const topY = toY(-HALF_WIDTH);
  const bottomY = toY(HALF_WIDTH);

  // 3. Crisp white UEFA lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'square';

  // Perimeter boundary lines
  ctx.strokeRect(leftX, topY, rightX - leftX, bottomY - topY);

  // Halfway line
  const midX = toX(0);
  ctx.beginPath();
  ctx.moveTo(midX, topY);
  ctx.lineTo(midX, bottomY);
  ctx.stroke();

  // Center circle (radius 9.15m -> ~9.15 / PITCH_LENGTH * (w-120))
  const circleRadius = (9.15 / PITCH_LENGTH) * (w - 120);
  ctx.beginPath();
  ctx.arc(midX, (topY + bottomY) / 2, circleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(midX, (topY + bottomY) / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Boxes (16.5m length, 32m width)
  const penBoxLen = (14 / PITCH_LENGTH) * (w - 120);
  const penBoxW = (28 / PITCH_WIDTH) * (h - 120);
  const penTop = (topY + bottomY) / 2 - penBoxW / 2;

  // Left penalty box
  ctx.strokeRect(leftX, penTop, penBoxLen, penBoxW);
  // Right penalty box
  ctx.strokeRect(rightX - penBoxLen, penTop, penBoxLen, penBoxW);

  // Goal Areas (six yard box: 5.5m x 16m)
  const sixLen = (5.5 / PITCH_LENGTH) * (w - 120);
  const sixW = (16 / PITCH_WIDTH) * (h - 120);
  const sixTop = (topY + bottomY) / 2 - sixW / 2;

  ctx.strokeRect(leftX, sixTop, sixLen, sixW);
  ctx.strokeRect(rightX - sixLen, sixTop, sixLen, sixW);

  // Penalty Spots (10m from goal line)
  const penSpotDist = (10 / PITCH_LENGTH) * (w - 120);
  const midY = (topY + bottomY) / 2;
  ctx.beginPath();
  ctx.arc(leftX + penSpotDist, midY, 6, 0, Math.PI * 2);
  ctx.arc(rightX - penSpotDist, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Penalty D Arcs
  ctx.beginPath();
  ctx.arc(leftX + penSpotDist, midY, circleRadius, -Math.PI * 0.32, Math.PI * 0.32);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rightX - penSpotDist, midY, circleRadius, Math.PI * 0.68, Math.PI * 1.32);
  ctx.stroke();

  // Corner Arcs (1m radius)
  const cornerR = (1.5 / PITCH_LENGTH) * (w - 120);
  const corners = [
    { x: leftX, y: topY, start: 0, end: Math.PI * 0.5 },
    { x: leftX, y: bottomY, start: -Math.PI * 0.5, end: 0 },
    { x: rightX, y: topY, start: Math.PI * 0.5, end: Math.PI },
    { x: rightX, y: bottomY, start: Math.PI, end: Math.PI * 1.5 },
  ];
  corners.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, cornerR, c.start, c.end);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createPitchBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = 120 + Math.random() * 60;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 16);
  return texture;
}

export function createSoccerBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base pearl white
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 512, 256);

  // Modern UEFA Champions Star & Pentagon pattern
  ctx.fillStyle = '#0f224a';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      if ((row + col) % 2 === 0) {
        const cx = col * 85 + 40;
        const cy = row * 64 + 32;
        // Draw star-pentagon
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const angle = (p * Math.PI * 2) / 5 - Math.PI / 2;
          const r = 22;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Gold trim
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  // Panel seam lines
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createKitTexture(
  primaryColor: string,
  secondaryColor: string,
  number: number,
  playerName: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base jersey color
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 256, 256);

  // Modern athletic side stripes & collar accent
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(0, 0, 30, 256);
  ctx.fillRect(226, 0, 30, 256);
  ctx.fillRect(90, 0, 76, 24); // collar V

  // Club Crest Badge
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(60, 60, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(60, 60, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FC', 60, 64);

  // Front Sponsor Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('EMIRATES', 128, 110);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 94, 116, 22);

  // Back Name & Number
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(playerName.toUpperCase(), 128, 175);

  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(String(number), 128, 225);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createAdBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050a18';
  ctx.fillRect(0, 0, 1024, 64);

  // Glowing cyber/broadcast sponsors
  const sponsors = [
    { text: '⚽ APEX FOOTBALL 3D', color: '#00ffcc' },
    { text: '🏆 CHAMPIONS FINAL 2026', color: '#ffd700' },
    { text: '⚡ 4K NEXT-GEN SIMULATOR', color: '#ff007f' },
    { text: '🎮 EA-KILLER PHYSICS', color: '#00e5ff' },
  ];

  sponsors.forEach((s, idx) => {
    const x = idx * 256 + 128;
    ctx.fillStyle = s.color;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.text, x, 38);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(idx * 256 + 10, 8, 236, 48);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createCrowdTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 512, 128);

  const colors = ['#0047ab', '#c8102e', '#ffffff', '#ffd700', '#10b981', '#3b82f6'];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 64; c++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      const x = c * 8 + (r % 2) * 4;
      const y = r * 16 + 4;
      // Head
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(x - 3, y + 3, 6, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 4);
  return texture;
}
