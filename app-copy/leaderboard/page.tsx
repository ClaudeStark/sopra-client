"use client";

/**
 * Leaderboard Page  –  route: /leaderboard
 *
 * Design ref: /08-leaderboard.html prototype
 * Classnames used (all defined in globals.css):
 *   page-root, page-content
 *   leaderboard-*
 *
 * NOTE: Design only — no dummy player data included.
 * Claude Stark: fetch player list via API and .map() into .leaderboard-row elements
 * where the "TODO: player rows" comment is below.
 */

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

const LeaderboardPage: React.FC = () => {
  return (
    <div className="page-root page-content">
      <div className="leaderboard-wrapper">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <h1 className="leaderboard-title">🏆 Leaderboard</h1>
        <p className="leaderboard-subtitle">Top GuesSBB players worldwide.</p>

        {/* ── Search pill ──────────────────────────────────────────────── */}
        <label className="leaderboard-search" htmlFor="leaderboard-search-input">
          <Search size={16} className="leaderboard-search-icon" />
          <input
            id="leaderboard-search-input"
            className="leaderboard-search-input"
            placeholder="Search players..."
          />
        </label>

        {/* ── Guest banner — TODO (Claude Stark): wrap in {!user && ...} with useAuth ── */}
        <div className="leaderboard-guest-banner">
          Log in to appear on the leaderboard.{" "}
          <Link href="/register" className="leaderboard-guest-banner-link">
            Register →
          </Link>
        </div>

        {/* ── Player list ──────────────────────────────────────────────── */}
        <div className="leaderboard-list">

          {/* Empty state — shown while the list is empty.
              Once the API is wired up, show this only when
              filtered.length === 0. */}
          <div className="leaderboard-empty">
            No players to show yet.
          </div>

          {/*
            TODO (Claude Stark): map over fetched players
            Expected JSX per player:

            <div className="leaderboard-row">
              <div className="leaderboard-rank leaderboard-rank--medal">🥇</div>
              <div className="leaderboard-player-info">
                <div className="leaderboard-name">
                  {player.username}
                  {isMe && <span className="badge badge-host">You</span>}
                </div>
                <div className="leaderboard-meta">
                  {player.games} games · Ø {player.avg} pts
                </div>
              </div>
              <div className="leaderboard-score">
                {player.total.toLocaleString("de-CH")}
              </div>
            </div>

            - Use class `leaderboard-rank--medal` for ranks 1–3 (emoji 🥇🥈🥉)
            - Use class `leaderboard-rank` only for rank ≥ 4 (plain number)
            - Add class `leaderboard-row--you` on the row if player is current user
          */}

        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;