export function SampleSheet() {
  return (
    <svg
      viewBox="0 0 1040 780"
      className="h-auto w-full bg-[#f6f3e8]"
      role="img"
      aria-label="Sample print FA-4417, flange adapter, revision C"
    >
      <rect x="10" y="10" width="1020" height="760" fill="none" stroke="#161616" strokeWidth="2" />
      <rect x="18" y="18" width="1004" height="744" fill="none" stroke="#161616" strokeWidth="0.6" />

      <text x="36" y="44" fill="#161616" fontFamily="Barlow, sans-serif" fontSize="13" letterSpacing="1.5">
        FRONT VIEW
      </text>
      <circle cx="230" cy="230" r="132" fill="none" stroke="#161616" strokeWidth="1.6" />
      <circle cx="230" cy="230" r="51" fill="none" stroke="#161616" strokeWidth="1.4" />
      <circle cx="230" cy="230" r="30" fill="none" stroke="#161616" strokeWidth="1.2" />
      <line x1="80" y1="230" x2="380" y2="230" stroke="#2c5f9a" strokeWidth="0.6" strokeDasharray="7 4" />
      <line x1="230" y1="80" x2="230" y2="380" stroke="#2c5f9a" strokeWidth="0.6" strokeDasharray="7 4" />
      {[
        [323, 137],
        [137, 137],
        [137, 323],
        [323, 323],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="none" stroke="#161616" strokeWidth="1.2" />
      ))}
      {[
        [296, 164],
        [164, 164],
        [164, 296],
        [296, 296],
      ].map(([x, y]) => (
        <circle
          key={`tap-${x}-${y}`}
          cx={x}
          cy={y}
          r="4.5"
          fill="none"
          stroke="#161616"
          strokeWidth="1"
          strokeDasharray="2 1.5"
        />
      ))}

      <g fill="#1a3654" fontFamily="IBM Plex Mono, monospace" fontSize="13">
        <text x="40" y="400">Ø3.250 ±.005 OD</text>
        <text x="40" y="420">Ø1.2500 / 1.2495 PILOT</text>
        <text x="40" y="440">4X Ø.266 THRU</text>
        <text x="40" y="460">C'BORE Ø.438 × .250 ON Ø2.500 BC</text>
        <text x="40" y="480">4X 1/4-20 UNC-2B × .50 DP</text>
        <text x="40" y="500">ON Ø1.750 BC</text>
      </g>

      <g fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#161616">
        <rect x="40" y="516" width="36" height="22" fill="none" stroke="#161616" />
        <text x="46" y="531">POS</text>
        <rect x="76" y="516" width="86" height="22" fill="none" stroke="#161616" />
        <text x="82" y="531">Ø.010 MMC</text>
        <rect x="162" y="516" width="22" height="22" fill="none" stroke="#161616" />
        <text x="169" y="531">A</text>
        <rect x="184" y="516" width="22" height="22" fill="none" stroke="#161616" />
        <text x="191" y="531">B</text>
        <text x="216" y="531" fill="#1a3654">
          4X Ø.266
        </text>
      </g>

      <text x="560" y="44" fill="#161616" fontFamily="Barlow, sans-serif" fontSize="13" letterSpacing="1.5">
        SIDE VIEW
      </text>
      <line x1="620" y1="250" x2="900" y2="250" stroke="#2c5f9a" strokeWidth="0.6" strokeDasharray="7 4" />
      <rect x="700" y="100" width="96" height="300" fill="none" stroke="#161616" strokeWidth="1.6" />
      <rect x="674" y="175" width="26" height="150" fill="none" stroke="#161616" strokeWidth="1.4" />
      <line x1="700" y1="214" x2="796" y2="214" stroke="#161616" strokeWidth="0.7" strokeDasharray="4 3" />
      <line x1="700" y1="286" x2="796" y2="286" stroke="#161616" strokeWidth="0.7" strokeDasharray="4 3" />
      <text x="688" y="168" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#161616">
        B
      </text>
      <text x="802" y="118" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#161616">
        A
      </text>

      <g fill="#1a3654" fontFamily="IBM Plex Mono, monospace" fontSize="13">
        <text x="820" y="150">1.125 ±.005 LG</text>
        <text x="820" y="172">.250 PILOT LG</text>
        <text x="820" y="194">.090 ±.005 WEB</text>
        <text x="820" y="216">DATUM A 32 µin Ra</text>
        <text x="820" y="238">FLATNESS 0.002</text>
        <text x="820" y="260">PILOT 63 µin Ra</text>
        <text x="820" y="282">⊥ Ø.005 TO A</text>
        <text x="820" y="304">Ø.125 × .750 OIL</text>
        <text x="820" y="326">Ø.2500/.2495 × .375</text>
        <text x="820" y="348">1X 1/4-28 UNF-3B</text>
        <text x="820" y="370">× .38 DP</text>
        <text x="820" y="392">R.015 MAX</text>
        <text x="820" y="414">.030 × 45° CHAMFER</text>
      </g>

      <g fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#161616">
        <text x="36" y="572">NOTES</text>
        <text x="36" y="592">1. INTERPRET GD&T PER ASME Y14.5-2018.</text>
        <text x="36" y="610">2. BREAK EDGES .005–.015. REMOVE ALL BURRS.</text>
        <text x="36" y="628">3. ANODIZE AFTER MACHINING.</text>
        <text x="36" y="646">4. MASK ALL THREADS AND THE Ø1.250 PILOT.</text>
        <text x="36" y="664">5. INSPECT THREADS WITH GO/NO-GO GAGES.</text>
        <text x="36" y="682">6. MATERIAL CERT REQUIRED.</text>
        <text x="36" y="700">7. BAG AND TAG WITH PART NUMBER AND REV.</text>
        <text x="36" y="724" fill="#1a3654">
          UNLESS NOTED: .XX ±.010 .XXX ±.005 ANG ±0.5°
        </text>
        <text x="36" y="744">125 µin Ra UOS · THIRD ANGLE · INCHES · 1:1</text>
      </g>

      <g stroke="#161616" fill="none">
        <rect x="620" y="500" width="386" height="230" />
        <line x1="620" y1="536" x2="1006" y2="536" />
        <line x1="620" y1="578" x2="1006" y2="578" />
        <line x1="620" y1="614" x2="1006" y2="614" />
        <line x1="620" y1="650" x2="1006" y2="650" />
        <line x1="620" y1="686" x2="1006" y2="686" />
        <line x1="860" y1="578" x2="860" y2="650" />
        <line x1="930" y1="578" x2="930" y2="650" />
      </g>
      <g fill="#161616" fontFamily="Barlow, sans-serif">
        <text x="632" y="526" fontSize="16" letterSpacing="1.4">
          NORTHLINE MACHINING
        </text>
        <text x="632" y="566" fontSize="22" fontFamily="Barlow Condensed, sans-serif" letterSpacing="0.5">
          FLANGE ADAPTER
        </text>
      </g>
      <g fill="#161616" fontFamily="IBM Plex Mono, monospace" fontSize="13">
        <text x="632" y="604">PART NO</text>
        <text x="760" y="604">FA-4417</text>
        <text x="872" y="604">REV</text>
        <text x="948" y="604">C</text>
        <text x="632" y="640">MATERIAL</text>
        <text x="760" y="640">6061-T6 ALUM</text>
        <text x="632" y="676">FINISH</text>
        <text x="760" y="668">TYPE II BLACK ANODIZE</text>
        <text x="760" y="684">MASK THREADS + PILOT</text>
        <text x="632" y="712">DRAWN J. OKONKWO</text>
        <text x="632" y="732">2026-03-12</text>
        <text x="860" y="712">SHEET 1 OF 1</text>
        <text x="860" y="732">AMS 4027</text>
      </g>
    </svg>
  );
}
