'use client';

import React from 'react';

export function BuildingWireframe() {
  return (
    <div
      className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden select-none"
      style={{
        maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        /* Left Commercial Building: 14s cycle */
        .animate-draw-left,
        .animate-draw-left path,
        .animate-draw-left line,
        .animate-draw-left rect,
        .animate-draw-left polygon {
          stroke-dasharray: 2500;
          stroke-dashoffset: 2500;
          animation: drawLine 14s ease-in-out infinite alternate;
        }

        /* Center Signature Skyscraper: 18s stately cycle */
        .animate-draw-center,
        .animate-draw-center path,
        .animate-draw-center line,
        .animate-draw-center rect,
        .animate-draw-center polygon {
          stroke-dasharray: 2500;
          stroke-dashoffset: 2500;
          animation: drawLine 18s ease-in-out infinite alternate;
        }

        /* Right Stepped Residential Tower: 12s cycle with 2s offset */
        .animate-draw-right,
        .animate-draw-right path,
        .animate-draw-right line,
        .animate-draw-right rect,
        .animate-draw-right polygon {
          stroke-dasharray: 2500;
          stroke-dashoffset: 2500;
          animation: drawLine 12s ease-in-out infinite alternate;
          animation-delay: 2s;
        }
      `}</style>

      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full min-w-[1600px] xl:min-w-[1920px] max-w-none text-white transition-opacity"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ==================================================================== */}
        {/* 1. Panoramic Ground Baseline & Radial Perspective Grid (Full 1920)   */}
        {/* ==================================================================== */}
        <g className="stroke-white/20 stroke-[1]">
          {/* Main Ground Construction Datums */}
          <line x1="40" y1="960" x2="1880" y2="960" />
          <line x1="120" y1="990" x2="1800" y2="990" />
          <line x1="200" y1="1020" x2="1720" y2="1020" />
          <line x1="300" y1="1050" x2="1620" y2="1050" />

          {/* Perspective Vanishing Vectors */}
          <line x1="80" y1="960" x2="180" y2="1060" />
          <line x1="260" y1="960" x2="330" y2="1060" />
          <line x1="480" y1="960" x2="520" y2="1060" />
          <line x1="720" y1="960" x2="730" y2="1060" />
          <line x1="960" y1="960" x2="960" y2="1060" strokeDasharray="4 6" />
          <line x1="1200" y1="960" x2="1190" y2="1060" />
          <line x1="1440" y1="960" x2="1400" y2="1060" />
          <line x1="1660" y1="960" x2="1590" y2="1060" />
          <line x1="1840" y1="960" x2="1740" y2="1060" />

          {/* Structural Zone Division Axes */}
          <line x1="420" y1="360" x2="420" y2="960" strokeDasharray="6 8" className="stroke-white/15" />
          <line x1="960" y1="60" x2="960" y2="960" strokeDasharray="6 8" className="stroke-white/25" />
          <line x1="1480" y1="180" x2="1480" y2="960" strokeDasharray="6 8" className="stroke-white/15" />

          {/* Zone Distance Dimension Ticks */}
          <g className="text-[10px] font-mono fill-white/40 select-none">
            <line x1="420" y1="935" x2="960" y2="935" strokeDasharray="3 3" />
            <text x="640" y="930" textAnchor="middle">◄── 54.0m CLEAR SPAN ──►</text>
            <line x1="960" y1="935" x2="1480" y2="935" strokeDasharray="3 3" />
            <text x="1220" y="930" textAnchor="middle">◄── 52.0m CLEAR SPAN ──►</text>
          </g>
        </g>

        {/* ==================================================================== */}
        {/* 2. STRUCTURE A (LEFT): 14-Story Commercial Tech Complex              */}
        {/* ==================================================================== */}
        <g className="animate-draw-left stroke-white/40 stroke-[1.4]">
          {/* Blueprint Elevation Label */}
          <text x="190" y="445" className="text-[10px] font-mono fill-white/40 stroke-none select-none">
            [ZONE A: COMMERCIAL CORE - B+G+14 FLOORS]
          </text>
          <text x="190" y="465" className="text-[10px] font-mono fill-white/40 stroke-none select-none">
            EL +56.0m [ROOFTOP HVAC LEVEL]
          </text>

          {/* Foundation & Basement Transfer Box */}
          <rect x="180" y="900" width="480" height="60" />
          <line x1="180" y1="930" x2="660" y2="930" />
          <line x1="240" y1="900" x2="240" y2="960" />
          <line x1="300" y1="900" x2="300" y2="960" />
          <line x1="360" y1="900" x2="360" y2="960" />
          <line x1="420" y1="900" x2="420" y2="960" />
          <line x1="480" y1="900" x2="480" y2="960" />
          <line x1="540" y1="900" x2="540" y2="960" />
          <line x1="600" y1="900" x2="600" y2="960" />

          {/* Podium Lower Envelope (Floors 1-4) */}
          <rect x="200" y="780" width="440" height="120" />
          <line x1="200" y1="810" x2="640" y2="810" />
          <line x1="200" y1="840" x2="640" y2="840" />
          <line x1="200" y1="870" x2="640" y2="870" />

          {/* Podium Vertical Pillars */}
          <line x1="260" y1="780" x2="260" y2="900" />
          <line x1="320" y1="780" x2="320" y2="900" />
          <line x1="380" y1="780" x2="380" y2="900" />
          <line x1="440" y1="780" x2="440" y2="900" />
          <line x1="500" y1="780" x2="500" y2="900" />
          <line x1="560" y1="780" x2="560" y2="900" />
          <line x1="620" y1="780" x2="620" y2="900" />

          {/* Commercial Tower Upper Envelope (Floors 5-14) */}
          <rect x="230" y="480" width="380" height="300" />
          <line x1="230" y1="510" x2="610" y2="510" />
          <line x1="230" y1="540" x2="610" y2="540" />
          <line x1="230" y1="570" x2="610" y2="570" />
          <line x1="230" y1="600" x2="610" y2="600" />
          <line x1="230" y1="630" x2="610" y2="630" />
          <line x1="230" y1="660" x2="610" y2="660" />
          <line x1="230" y1="690" x2="610" y2="690" />
          <line x1="230" y1="720" x2="610" y2="720" />
          <line x1="230" y1="750" x2="610" y2="750" />

          {/* Curtain Wall Mullion Grids */}
          <line x1="280" y1="480" x2="280" y2="780" />
          <line x1="330" y1="480" x2="330" y2="780" />
          <line x1="380" y1="480" x2="380" y2="780" />
          <line x1="430" y1="480" x2="430" y2="780" />
          <line x1="480" y1="480" x2="480" y2="780" />
          <line x1="530" y1="480" x2="530" y2="780" />
          <line x1="580" y1="480" x2="580" y2="780" />

          {/* Rooftop HVAC & Mechanical Enclosure */}
          <rect x="330" y="430" width="180" height="50" className="stroke-white/50" />
          <line x1="330" y1="455" x2="510" y2="455" />
          <line x1="375" y1="430" x2="375" y2="480" />
          <line x1="420" y1="430" x2="420" y2="480" />
          <line x1="465" y1="430" x2="465" y2="480" />
          {/* Exhaust stacks */}
          <line x1="360" y1="430" x2="360" y2="410" />
          <line x1="480" y1="430" x2="480" y2="410" />

          {/* Construction Scaffolding Structure (Far Left Wing) */}
          <g className="stroke-white/30 stroke-[1]">
            <line x1="180" y1="520" x2="230" y2="520" />
            <line x1="180" y1="560" x2="230" y2="560" />
            <line x1="180" y1="600" x2="230" y2="600" />
            <line x1="180" y1="640" x2="230" y2="640" />
            <line x1="180" y1="680" x2="230" y2="680" />
            <line x1="180" y1="720" x2="230" y2="720" />
            <line x1="180" y1="760" x2="230" y2="760" />
            <line x1="180" y1="520" x2="180" y2="900" />
            {/* Scaffolding X-Ties */}
            <line x1="180" y1="520" x2="230" y2="600" />
            <line x1="230" y1="520" x2="180" y2="600" />
            <line x1="180" y1="600" x2="230" y2="680" />
            <line x1="230" y1="600" x2="180" y2="680" />
            <line x1="180" y1="680" x2="230" y2="760" />
            <line x1="230" y1="680" x2="180" y2="760" />
          </g>
        </g>

        {/* ==================================================================== */}
        {/* 3. STRUCTURE B (CENTER): Signature Skyscraper & Primary Tower Crane  */}
        {/* ==================================================================== */}
        <g className="animate-draw-center stroke-white/45 stroke-[1.5]">
          {/* Blueprint Elevation Labels */}
          <text x="730" y="360" className="text-[10px] font-mono fill-white/50 stroke-none select-none">
            [ZONE B: REAA PINNACLE TOWER - 48 FLOORS]
          </text>
          <text x="730" y="380" className="text-[10px] font-mono fill-white/50 stroke-none select-none">
            EL +210.0m [STRUCTURAL SPIRE]
          </text>

          {/* Heavy Foundation Footing */}
          <rect x="740" y="900" width="440" height="60" />
          <line x1="740" y1="930" x2="1180" y2="930" />
          <line x1="790" y1="900" x2="790" y2="960" />
          <line x1="850" y1="900" x2="850" y2="960" />
          <line x1="910" y1="900" x2="910" y2="960" />
          <line x1="970" y1="900" x2="970" y2="960" />
          <line x1="1030" y1="900" x2="1030" y2="960" />
          <line x1="1090" y1="900" x2="1090" y2="960" />
          <line x1="1140" y1="900" x2="1140" y2="960" />

          {/* Tier 1 Podium (Floors 1-8) */}
          <rect x="770" y="740" width="380" height="160" />
          <line x1="770" y1="780" x2="1150" y2="780" />
          <line x1="770" y1="820" x2="1150" y2="820" />
          <line x1="770" y1="860" x2="1150" y2="860" />
          {/* Tier 1 Columns */}
          <line x1="820" y1="740" x2="820" y2="900" />
          <line x1="890" y1="740" x2="890" y2="900" />
          <line x1="960" y1="740" x2="960" y2="900" />
          <line x1="1030" y1="740" x2="1030" y2="900" />
          <line x1="1100" y1="740" x2="1100" y2="900" />

          {/* Tier 2 Mid-Rise with Mega-Trusses (Floors 9-22) */}
          <rect x="810" y="540" width="300" height="200" />
          <line x1="810" y1="590" x2="1110" y2="590" />
          <line x1="810" y1="640" x2="1110" y2="640" />
          <line x1="810" y1="690" x2="1110" y2="690" />
          {/* Columns */}
          <line x1="860" y1="540" x2="860" y2="740" />
          <line x1="910" y1="540" x2="910" y2="740" />
          <line x1="960" y1="540" x2="960" y2="740" />
          <line x1="1010" y1="540" x2="1010" y2="740" />
          <line x1="1060" y1="540" x2="1060" y2="740" />
          {/* Structural X-Bracing */}
          <line x1="810" y1="540" x2="910" y2="640" />
          <line x1="910" y1="540" x2="810" y2="640" />
          <line x1="1010" y1="540" x2="1110" y2="640" />
          <line x1="1110" y1="540" x2="1010" y2="640" />
          <line x1="810" y1="640" x2="910" y2="740" />
          <line x1="910" y1="640" x2="810" y2="740" />
          <line x1="1010" y1="640" x2="1110" y2="740" />
          <line x1="1110" y1="640" x2="1010" y2="740" />

          {/* Tier 3 High-Rise Setback (Floors 23-36) */}
          <rect x="850" y="380" width="220" height="160" />
          <line x1="850" y1="420" x2="1070" y2="420" />
          <line x1="850" y1="460" x2="1070" y2="460" />
          <line x1="850" y1="500" x2="1070" y2="500" />
          <line x1="890" y1="380" x2="890" y2="540" />
          <line x1="960" y1="380" x2="960" y2="540" />
          <line x1="1030" y1="380" x2="1030" y2="540" />
          {/* Tier 3 Cross Bracing */}
          <line x1="850" y1="380" x2="960" y2="460" />
          <line x1="960" y1="380" x2="850" y2="460" />
          <line x1="960" y1="380" x2="1070" y2="460" />
          <line x1="1070" y1="380" x2="960" y2="460" />
          <line x1="850" y1="460" x2="960" y2="540" />
          <line x1="960" y1="460" x2="850" y2="540" />
          <line x1="960" y1="460" x2="1070" y2="540" />
          <line x1="1070" y1="460" x2="960" y2="540" />

          {/* Tier 4 Crown & Upper Spire (Floors 37-48) */}
          <rect x="890" y="240" width="140" height="140" />
          <line x1="890" y1="275" x2="1030" y2="275" />
          <line x1="890" y1="310" x2="1030" y2="310" />
          <line x1="890" y1="345" x2="1030" y2="345" />
          <line x1="925" y1="240" x2="925" y2="380" />
          <line x1="960" y1="240" x2="960" y2="380" />
          <line x1="995" y1="240" x2="995" y2="380" />

          {/* Vertical Spire Mast */}
          <path d="M935 240 L958 110 L962 110 L985 240 Z" />
          <line x1="943" y1="200" x2="977" y2="200" />
          <line x1="950" y1="160" x2="970" y2="160" />
          {/* Pinnacle Antenna */}
          <line x1="960" y1="110" x2="960" y2="40" className="stroke-white/80 stroke-[2]" />
          <circle cx="960" cy="40" r="3" className="fill-white" />

          {/* Primary Heavy Tower Crane 1 */}
          <g className="stroke-white/70 stroke-[1.4]">
            {/* Crane Lattice Mast */}
            <rect x="990" y="140" width="18" height="100" />
            <line x1="990" y1="160" x2="1008" y2="160" />
            <line x1="990" y1="180" x2="1008" y2="180" />
            <line x1="990" y1="200" x2="1008" y2="200" />
            <line x1="990" y1="220" x2="1008" y2="220" />
            <line x1="990" y1="140" x2="1008" y2="160" />
            <line x1="1008" y1="140" x2="990" y2="160" />
            <line x1="990" y1="160" x2="1008" y2="180" />
            <line x1="1008" y1="160" x2="990" y2="180" />

            {/* Turntable & Cab */}
            <polygon points="986,140 1012,140 1008,126 990,126" />
            <polygon points="995,126 1003,126 999,105" />

            {/* Horizontal Jib Arm */}
            <line x1="870" y1="126" x2="1038" y2="126" className="stroke-white stroke-[1.8]" />
            <line x1="870" y1="132" x2="1038" y2="132" />
            {/* Jib Webbing */}
            <line x1="890" y1="126" x2="900" y2="132" />
            <line x1="910" y1="126" x2="920" y2="132" />
            <line x1="930" y1="126" x2="940" y2="132" />
            <line x1="950" y1="126" x2="960" y2="132" />
            <line x1="970" y1="126" x2="980" y2="132" />

            {/* Counterweight Block */}
            <rect x="1024" y="122" width="20" height="14" className="stroke-white/80" />

            {/* Suspension Cable Ropes */}
            <line x1="999" y1="105" x2="900" y2="126" strokeDasharray="3 3" />
            <line x1="999" y1="105" x2="950" y2="126" strokeDasharray="3 3" />
            <line x1="999" y1="105" x2="1034" y2="126" strokeDasharray="3 3" />

            {/* Hoist Trolley, Cable & Hoisted Steel Girder */}
            <rect x="915" y="132" width="10" height="4" />
            <line x1="920" y1="136" x2="920" y2="190" strokeDasharray="3 2" className="stroke-white/80" />
            <polygon points="917,190 923,190 920,196" />
            {/* Hoisted Horizontal I-Beam Girder */}
            <g className="stroke-white stroke-[2.2]">
              <line x1="895" y1="202" x2="945" y2="202" />
              <line x1="895" y1="198" x2="895" y2="206" />
              <line x1="945" y1="198" x2="945" y2="206" />
              <line x1="920" y1="196" x2="905" y2="202" className="stroke-white/70 stroke-[1]" />
              <line x1="920" y1="196" x2="935" y2="202" className="stroke-white/70 stroke-[1]" />
            </g>
          </g>
        </g>

        {/* ==================================================================== */}
        {/* 4. STRUCTURE C (RIGHT): Stepped Residential Tower & Secondary Crane  */}
        {/* ==================================================================== */}
        <g className="animate-draw-right stroke-white/40 stroke-[1.4]">
          {/* Blueprint Elevation Label */}
          <text x="1270" y="275" className="text-[10px] font-mono fill-white/40 stroke-none select-none">
            [ZONE C: STEPPED RESIDENTIAL TOWERS - 32 FLOORS]
          </text>
          <text x="1270" y="295" className="text-[10px] font-mono fill-white/40 stroke-none select-none">
            EL +124.0m [TERRACE GARDEN SKY-DECK]
          </text>

          {/* Residential Foundation Base Box */}
          <rect x="1250" y="900" width="480" height="60" />
          <line x1="1250" y1="930" x2="1730" y2="930" />
          <line x1="1310" y1="900" x2="1310" y2="960" />
          <line x1="1370" y1="900" x2="1370" y2="960" />
          <line x1="1430" y1="900" x2="1430" y2="960" />
          <line x1="1490" y1="900" x2="1490" y2="960" />
          <line x1="1550" y1="900" x2="1550" y2="960" />
          <line x1="1610" y1="900" x2="1610" y2="960" />
          <line x1="1670" y1="900" x2="1670" y2="960" />

          {/* Tier 1 Podium & Clubhouse (Floors 1-6) */}
          <rect x="1270" y="760" width="440" height="140" />
          <line x1="1270" y1="795" x2="1710" y2="795" />
          <line x1="1270" y1="830" x2="1710" y2="830" />
          <line x1="1270" y1="865" x2="1710" y2="865" />
          <line x1="1330" y1="760" x2="1330" y2="900" />
          <line x1="1400" y1="760" x2="1400" y2="900" />
          <line x1="1470" y1="760" x2="1470" y2="900" />
          <line x1="1540" y1="760" x2="1540" y2="900" />
          <line x1="1610" y1="760" x2="1610" y2="900" />
          <line x1="1670" y1="760" x2="1670" y2="900" />

          {/* Tier 2 Stepped Balcony Terraces (Floors 7-18) */}
          <rect x="1300" y="560" width="380" height="200" />
          <line x1="1300" y1="600" x2="1680" y2="600" />
          <line x1="1300" y1="640" x2="1680" y2="640" />
          <line x1="1300" y1="680" x2="1680" y2="680" />
          <line x1="1300" y1="720" x2="1680" y2="720" />
          {/* Cantilevered Balconies */}
          <line x1="1280" y1="600" x2="1300" y2="600" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1280" y1="640" x2="1300" y2="640" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1280" y1="680" x2="1300" y2="680" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1280" y1="720" x2="1300" y2="720" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1680" y1="600" x2="1700" y2="600" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1680" y1="640" x2="1700" y2="640" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1680" y1="680" x2="1700" y2="680" className="stroke-white/70 stroke-[1.5]" />
          <line x1="1680" y1="720" x2="1700" y2="720" className="stroke-white/70 stroke-[1.5]" />

          {/* Tier 3 Upper Stepped Penthouse Tower (Floors 19-32) */}
          <rect x="1350" y="320" width="280" height="240" />
          <line x1="1350" y1="360" x2="1630" y2="360" />
          <line x1="1350" y1="400" x2="1630" y2="400" />
          <line x1="1350" y1="440" x2="1630" y2="440" />
          <line x1="1350" y1="480" x2="1630" y2="480" />
          <line x1="1350" y1="520" x2="1630" y2="520" />

          <line x1="1400" y1="320" x2="1400" y2="560" />
          <line x1="1460" y1="320" x2="1460" y2="560" />
          <line x1="1520" y1="320" x2="1520" y2="560" />
          <line x1="1580" y1="320" x2="1580" y2="560" />

          {/* Stepped Sky-Villa Terrace Cuts */}
          <line x1="1350" y1="320" x2="1350" y2="400" />
          <line x1="1300" y1="400" x2="1350" y2="400" />
          <line x1="1630" y1="320" x2="1630" y2="440" />
          <line x1="1630" y1="440" x2="1680" y2="440" />

          {/* Rooftop Pergola Canopy & Architectural Fins */}
          <line x1="1350" y1="310" x2="1630" y2="310" className="stroke-white/70 stroke-[1.6]" />
          <line x1="1370" y1="310" x2="1370" y2="290" />
          <line x1="1410" y1="310" x2="1410" y2="290" />
          <line x1="1450" y1="310" x2="1450" y2="290" />
          <line x1="1490" y1="310" x2="1490" y2="290" />
          <line x1="1530" y1="310" x2="1530" y2="290" />
          <line x1="1570" y1="310" x2="1570" y2="290" />
          <line x1="1610" y1="310" x2="1610" y2="290" />

          {/* Secondary Tower Crane 2 (Operating on Right Tower) */}
          <g className="stroke-white/60 stroke-[1.2]">
            {/* Crane 2 Mast */}
            <rect x="1530" y="210" width="16" height="110" />
            <line x1="1530" y1="230" x2="1546" y2="230" />
            <line x1="1530" y1="250" x2="1546" y2="250" />
            <line x1="1530" y1="270" x2="1546" y2="270" />
            <line x1="1530" y1="290" x2="1546" y2="290" />
            <line x1="1530" y1="210" x2="1546" y2="230" />
            <line x1="1546" y1="210" x2="1530" y2="230" />
            <line x1="1530" y1="230" x2="1546" y2="250" />
            <line x1="1546" y1="230" x2="1530" y2="250" />

            {/* Cab & Apex */}
            <polygon points="1526,210 1550,210 1546,198 1530,198" />
            <polygon points="1534,198 1542,198 1538,180" />

            {/* Horizontal Boom / Jib (Extending across Penthouse) */}
            <line x1="1420" y1="198" x2="1575" y2="198" className="stroke-white stroke-[1.5]" />
            <line x1="1420" y1="203" x2="1575" y2="203" />
            <line x1="1440" y1="198" x2="1450" y2="203" />
            <line x1="1460" y1="198" x2="1470" y2="203" />
            <line x1="1480" y1="198" x2="1490" y2="203" />
            <line x1="1500" y1="198" x2="1510" y2="203" />

            {/* Counterweight */}
            <rect x="1562" y="195" width="18" height="12" className="stroke-white/80" />

            {/* Suspension Ropes */}
            <line x1="1538" y1="180" x2="1450" y2="198" strokeDasharray="3 3" />
            <line x1="1538" y1="180" x2="1500" y2="198" strokeDasharray="3 3" />
            <line x1="1538" y1="180" x2="1570" y2="198" strokeDasharray="3 3" />

            {/* Hoist Trolley, Cable & Concrete Bucket */}
            <rect x="1465" y="203" width="8" height="3" />
            <line x1="1469" y1="206" x2="1469" y2="255" strokeDasharray="3 2" className="stroke-white/70" />
            {/* Concrete Skip/Bucket */}
            <polygon points="1464,255 1474,255 1472,266 1466,266" className="stroke-white stroke-[1.5]" />
          </g>
        </g>
      </svg>
    </div>
  );
}
