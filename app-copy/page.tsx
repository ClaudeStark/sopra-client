"use client";

/**
 * Main Page  –  route: /
 *
 * Design ref: /01-home.html prototype
 * Classnames used (all defined in globals.css):
 *   page-root, page-cards-row, page-section, page-hero-actions
 *   card, card--wide
 *   btn-outline-red
 *   home-hero-*, home-step-*, home-stats-*
 */

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "antd";

// ─── SVG Illustrations (inline, decorative only) ────────────────────────────
const PinIcon = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size}
    height={size * 1.25}
    viewBox="0 0 48 60"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF1A2B" />
        <stop offset="100%" stopColor="#C00010" />
      </linearGradient>
    </defs>
    {/* Bodenschatten – lässt den Pin "stehen" */}
    <ellipse cx="24" cy="57" rx="7" ry="1.8" fill="rgba(0,0,0,0.2)" />
    {/* Pin-Körper mit Gradient */}
    <path
      d="M24 2C13.5 2 5 10.5 5 21c0 13 19 33 19 33s19-20 19-33c0-10.5-8.5-19-19-19z"
      fill="url(#pinGrad)"
    />
    {/* Weißer Ring */}
    <circle cx="24" cy="21" r="7.5" fill="#FFFFFF" />
    {/* Roter Punkt in der Mitte */}
    <circle cx="24" cy="21" r="3.5" fill="#E30613" />
    {/* Subtiler Glanz oben links */}
    <path
      d="M15 12 Q14 8, 19 6"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const TrainIllustration = () => (
  <svg
    viewBox="0 0 160 100"
    fill="none"
    aria-hidden="true"
    className="home-hero-train"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="trainBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF1A2B" />
        <stop offset="100%" stopColor="#C00010" />
      </linearGradient>
      <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8F4FF" />
        <stop offset="100%" stopColor="#B8D8F0" />
      </linearGradient>
    </defs>

    {/* Motion Lines links (Speed-Effekt) */}
    <g opacity="0.5" stroke="#E30613" strokeLinecap="round">
      <path d="M2 35 L14 35" strokeWidth="2" />
      <path d="M0 48 L12 48" strokeWidth="2.5" />
      <path d="M4 61 L16 61" strokeWidth="2" />
    </g>

    {/* Schatten unter Zug */}
    <ellipse cx="88" cy="88" rx="60" ry="3" fill="rgba(0,0,0,0.15)" />

    {/* Hauptkorpus */}
    <rect x="24" y="28" width="120" height="50" rx="10" fill="url(#trainBody)" />

    {/* Abgerundete Nase vorne (rechts) */}
    <path d="M144 35 Q156 52, 144 72 Z" fill="#B80010" />

    {/* Oberer dunkler Streifen (SBB-Dach) */}
    <rect x="24" y="28" width="120" height="6" rx="10" fill="rgba(0,0,0,0.18)" />

    {/* Drei Passagierfenster */}
    <rect x="34" y="42" width="26" height="16" rx="2" fill="url(#windowGlass)" />
    <rect x="64" y="42" width="26" height="16" rx="2" fill="url(#windowGlass)" />
    <rect x="94" y="42" width="26" height="16" rx="2" fill="url(#windowGlass)" />
    {/* Führerstand-Fenster (schräg) */}
    <path d="M126 42 L138 42 Q142 48, 138 58 L126 58 Z" fill="url(#windowGlass)" />

    {/* SBB-Logo-Quadrat */}
    <rect x="40" y="64" width="14" height="10" rx="1.5" fill="#FFFFFF" />
    <text x="47" y="72" textAnchor="middle" fontSize="6" fontWeight="900" fill="#E30613">
      SBB
    </text>

    {/* Türlinien */}
    <line x1="92" y1="60" x2="92" y2="75" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
    <line x1="122" y1="60" x2="122" y2="75" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />

    {/* Zwei Drehgestelle mit Rädern */}
    <g>
      <circle cx="48" cy="82" r="7" fill="#1A1A1A" />
      <circle cx="48" cy="82" r="3.5" fill="#888" />
      <circle cx="68" cy="82" r="7" fill="#1A1A1A" />
      <circle cx="68" cy="82" r="3.5" fill="#888" />
      <circle cx="108" cy="82" r="7" fill="#1A1A1A" />
      <circle cx="108" cy="82" r="3.5" fill="#888" />
      <circle cx="128" cy="82" r="7" fill="#1A1A1A" />
      <circle cx="128" cy="82" r="3.5" fill="#888" />
    </g>

    {/* Gleis + Schwellen */}
    <rect x="20" y="92" width="132" height="2" fill="#2D2D2D" />
    <g fill="#8B6F47">
      <rect x="24" y="95" width="8" height="2.5" />
      <rect x="44" y="95" width="8" height="2.5" />
      <rect x="64" y="95" width="8" height="2.5" />
      <rect x="84" y="95" width="8" height="2.5" />
      <rect x="104" y="95" width="8" height="2.5" />
      <rect x="124" y="95" width="8" height="2.5" />
      <rect x="140" y="95" width="8" height="2.5" />
    </g>

    {/* Scheinwerfer vorne */}
    <circle cx="140" cy="60" r="2" fill="#FFF9C4" />
  </svg>
);

const MountainScene = () => (
  <svg
    viewBox="0 0 600 140"
    fill="none"
    aria-hidden="true"
    className="home-hero-mountains"
    preserveAspectRatio="xMidYMax slice"
  >
    {/* Hintere Bergkette */}
    <path
      d="M0 140 L70 55 L130 85 L210 25 L290 75 L360 40 L440 65 L510 20 L570 50 L600 35 V140 Z"
      fill="#E30613"
      opacity="0.08"
    />
    {/* Schneekappen auf den höchsten Peaks */}
    <path d="M200 30 L210 25 L222 32 L215 35 L210 30 L205 35 Z" fill="#FFFFFF" opacity="0.7" />
    <path d="M502 25 L510 20 L520 28 L513 30 L510 25 L506 30 Z" fill="#FFFFFF" opacity="0.7" />
    {/* Vordere Hügelkette (dunkler, mehr Tiefe) */}
    <path
      d="M0 140 L50 90 L110 105 L190 60 L270 95 L340 70 L420 90 L500 50 L560 80 L600 65 V140 Z"
      fill="#E30613"
      opacity="0.05"
    />

    {/* Sonne – nach den Bergen gerendert, damit sie nicht verdeckt wird */}
    {/* Sonne – in <g> eingewickelt, damit wir sie mit CSS animieren können */}
    <g className="home-hero-sun">
      <circle cx="100" cy="45" r="18" fill="#F4C862" opacity="0.55" />
      <circle cx="100" cy="45" r="12" fill="#F4B84A" opacity="0.9" />
    </g>
  </svg>
);

// ─── Page ───────────────────────────────────────────────────────────────────
const MainPage: React.FC = () => {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");

  const handlePlay = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/lobbies");
    }
  };

  return (
    <div className="page-root">

      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <section className="home-hero">
        <MountainScene />

        <div className="home-hero-content">
          <div className="home-hero-illustration">
            <div className="home-hero-pin">
              <div className="home-hero-pin-inner">
                <PinIcon size={64} />
              </div>
            </div>
            <TrainIllustration />
          </div>

          <h1 className="home-hero-title">
            Gues<span className="u-text-red">SBB</span>
          </h1>

          <p className="home-hero-tagline">Where is the train right now?</p>

          <p className="home-hero-description">
            Guess in real time where SBB trains are on the Swiss rail network. 
            Play against friends or the world. Who gets closest?
          </p>

          <div className="page-hero-actions">
            <Button type="primary" size="large" onClick={handlePlay}>
              ▶ Play now
            </Button>

            <Button
              size="large"
              className="btn-outline-red"
              onClick={() => router.push("/leaderboard")}
            >
              Leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* ── How-it-works cards ────────────────────────────────────────────── */}
      <section className="page-cards-row">
        <div className="card home-step-card">
          <div className="home-step-emoji-bg">🚂</div>
          <div className="home-step-emoji">🚂</div>
          <div className="home-step-number home-step-number--red">01</div>
          <div className="home-step-title">Read the train info</div>
          <div className="home-step-desc">
            You see the line, departure, and arrival of a real SBB train.
          </div>
        </div>

        <div className="card home-step-card">
          <div className="home-step-emoji-bg">📍</div>
          <div className="home-step-emoji">📍</div>
          <div className="home-step-number home-step-number--gold">02</div>
          <div className="home-step-title">Position guess</div>
          <div className="home-step-desc">
            Click on the Swiss map. The closer you are to the real position,
            the more points you get!
          </div>
        </div>

        <div className="card home-step-card">
          <div className="home-step-emoji-bg">🏆</div>
          <div className="home-step-emoji">🏆</div>
          <div className="home-step-number home-step-number--green">03</div>
          <div className="home-step-title">Collect points</div>
          <div className="home-step-desc">
            After each round you see the result. Become the best guesser of
            Switzerland!
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="page-section">
        <div className="card card--wide home-stats-bar">
          <div className="home-stat">
            <div className="home-stat-emoji">🎮</div>
            <div className="home-stat-value">2&apos;847</div>
            <div className="home-stat-label">Games today</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">👥</div>
            <div className="home-stat-value">342</div>
            <div className="home-stat-label">Players online</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">🗺️</div>
            <div className="home-stat-value">12&apos;504</div>
            <div className="home-stat-label">Trains guessed</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">🏅</div>
            <div className="home-stat-value home-stat-value--small">ZürichHB_Master</div>
            <div className="home-stat-label">#1 worldwide</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MainPage;