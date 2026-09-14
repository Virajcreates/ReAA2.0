'use client';

import React, { useMemo } from 'react';

interface BlockProps {
  x: number;
  y: number;
  size: number;
  height: number;
  delay: number;
  duration: number;
}

function Block({ x, y, size, height, delay, duration }: BlockProps) {
  return (
    <div
      className="absolute block-monolith"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transformStyle: 'preserve-3d',
        animation: `stackUp ${duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* 1. Top Face: Pure White */}
      <div
        className="absolute inset-0 bg-white border border-white/40 shadow-sm"
        style={{
          transform: `translateZ(${height}px)`,
        }}
      />

      {/* 2. Left Face: Light Gray (Simulating harsh directional lighting on screen-left) */}
      <div
        className="absolute bg-zinc-400 border border-zinc-300/40"
        style={{
          left: 0,
          top: 0,
          width: `${height}px`,
          height: `${size}px`,
          transformOrigin: '0 0',
          transform: 'rotateY(-90deg)',
        }}
      />

      {/* 3. Right Face: Dark Gray (Simulating deep shadow on screen-right) */}
      <div
        className="absolute bg-zinc-800 border border-zinc-700/50"
        style={{
          left: 0,
          top: `${size}px`,
          width: `${size}px`,
          height: `${height}px`,
          transformOrigin: '0 0',
          transform: 'rotateX(90deg)',
        }}
      />
    </div>
  );
}

export function IsometricCity() {
  const blocks = useMemo(() => {
    const rawBlocks: BlockProps[] = [];
    const size = 42;
    const gap = 16;
    const pitch = size + gap; // 58px pitch

    // 10x10 City Grid Heightmap with dynamic skyline clusters
    const heightMap: number[][] = [
      [35,  55,  75,  65,  45,  65,  85,  65,  45,  25],
      [45,  95, 145, 125,  85, 115, 165, 135,  75,  35],
      [65, 135, 230, 195, 115, 175, 245, 185,  95,  45],
      [75, 165, 290, 260, 145, 215, 320, 235, 125,  55],
      [55, 125, 215, 330, 185, 270, 290, 195, 105,  45],
      [65, 155, 270, 300, 165, 235, 270, 175,  95,  35],
      [55, 115, 195, 225, 135, 185, 205, 145,  85,  45],
      [45,  85, 135, 155,  95, 135, 155, 115,  65,  35],
      [35,  55,  85,  95,  65,  85,  95,  75,  45,  25],
      [25,  35,  45,  55,  35,  45,  55,  45,  35,  15],
    ];

    const rows = heightMap.length;
    const cols = heightMap[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const height = heightMap[r][c];

        // Architectural courtyards / plazas
        if ((r === 4 && c === 4) || (r === 2 && c === 4) || (r === 7 && c === 4)) {
          continue;
        }

        // Stagger delays organically across the isometric wave
        const diagonalDist = Math.sqrt(r * r + c * c);
        const delay = parseFloat(((diagonalDist * 0.4 + (r * 3 + c * 7) % 5 * 0.3) % 5.5).toFixed(2));
        const duration = 6.5 + ((r + c) % 4) * 1.2;

        rawBlocks.push({
          x: c * pitch,
          y: r * pitch,
          size,
          height,
          delay,
          duration,
        });
      }
    }

    // Depth sort: in rotateX(60deg) rotateZ(-45deg), screen depth sz is proportional to (y - x).
    // Sort ascending by (y - x) so background blocks are rendered first, foreground last.
    return rawBlocks.sort((a, b) => {
      const depthA = a.y - a.x;
      const depthB = b.y - b.x;
      if (depthA !== depthB) return depthA - depthB;
      return (a.x + a.y) - (b.x + b.y);
    });
  }, []);

  const gridWidth = 10 * 58;
  const gridHeight = 10 * 58;

  return (
    <div
      className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden select-none"
      style={{
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
        perspective: '1000px',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes stackUp {
          0% {
            transform: translateZ(-260px);
          }
          100% {
            transform: translateZ(0px);
          }
        }
      `}</style>

      {/* 3D Isometric City Grid Container */}
      <div
        className="relative"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          transform: 'rotateX(60deg) rotateZ(-45deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {blocks.map((block, idx) => (
          <Block key={idx} {...block} />
        ))}
      </div>
    </div>
  );
}
