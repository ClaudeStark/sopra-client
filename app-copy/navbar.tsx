"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Input } from "antd";
import { ApiService } from "./api/apiService";
import { MyUserDTO, UserDTO } from "./types/user";
import { Bell, LogOut, Search, Menu, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// ---------------------------------------------------------------------------
// GuessSBB SVG logo mark (simplified train-pin icon)
// ---------------------------------------------------------------------------
function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#E30613" />
      <path
        d="M16 4C12.134 4 9 7.134 9 11c0 5.25 7 14 7 14s7-8.75 7-14c0-3.866-3.134-7-7-7z"
        fill="white"
      />
      <circle cx="16" cy="11" r="3" fill="#E30613" />
    </svg>
  );
}

// ---------------------------------------------------------------------------


export default function Navbar() {

  // const [resolvedUser, setResolvedUser] = useState<{ userId: number; username: string } | null>(null);
  const [notificationCount, setNotificationCount] = useState(3); // Placeholder for notification count, replace with actual logic to fetch count
  // const [showLinks, setShowLinks] = useState(false);
  const{user,logout,isLoading} = useAuth();

  const pathname = usePathname();
  const router = useRouter();
  // const apiService = new ApiService();


//   useEffect(() => {
//     const token = JSON.parse(localStorage.getItem("token") || '""');
// const userId = JSON.parse(localStorage.getItem("userId") || "-1");
    

//     console.log("Navbar - Retrieved token from localStorage:", token);
//     console.log("Navbar - Retrieved userId from localStorage:", userId);

    

//     if (!token || userId === -1) {
//       setResolvedUser(null);
//       setShowLinks(true);
//       return;
//     }

//     const fetchAndSetUser = async () => {
//       try {
//         const userData = await apiService.get(
//           `/users/${Number(userId)}`,
//           {
//             headers: { token: token },
//           }) as MyUserDTO | UserDTO;
//         if ("email" in userData) {
//           setResolvedUser({ userId: userId, username: userData.username });
//         } else {
//           setResolvedUser(null);
//         }
//       }
//       catch (error) {
//         //console.error("Error fetching user data in Navbar:", error);
//         setResolvedUser(null);
//       }

//     };

//     fetchAndSetUser();
//     setShowLinks(true);
//   }, []);



  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("userId");

  //   setResolvedUser(null);

  //   router.push("/login");
  // };


  function handleLobbySearch(e: React.KeyboardEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value.trim();
    if (e.key === "Enter" && value) {
      router.push(`/lobbies/${value}`);
    }
  }

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `navbar-link${active ? " active" : ""}`;
  }

const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Helper: route + close menu (for mobile menu links)
  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="navbar">
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <Link href="/" className="navbar-brand">
          <LogoMark />
          <span className="navbar-brand-text">
            Gues<span>SBB</span>
          </span>
        </Link>

        {/* ── Center: Lobby ID search (desktop only) ─────────────────────── */}
        <label className="navbar-search" htmlFor="lobby-id-search">
          <Search size={16} className="navbar-search-icon" />
          <input
            id="lobby-id-search"
            className="navbar-search-input"
            placeholder="Enter Lobby ID"
            onKeyDown={handleLobbySearch}
          />
        </label>

        {/* ── Right: desktop actions ─────────────────────────────────────── */}
        {!isLoading && (
          <div className="navbar-actions">

            {user && (
              <Badge count={notificationCount} size="small" offset={[4, -2]}>
                <button className="navbar-icon-btn" aria-label="Notifications">
                  <Bell size={20} />
                </button>
              </Badge>
            )}

            <Link href="/lobbies" className={linkClass("/lobbies")}>
              Lobbies
            </Link>

            <Link href="/leaderboard" className={linkClass("/leaderboard")}>
              Leaderboard
            </Link>

            {user ? (
              <>
                <Link
                  href={`/users/${user.userId}`}
                  className={linkClass(`/users/${user.userId}`)}
                >
                  {user.username}
                </Link>
                <button
                  className="navbar-icon-btn"
                  onClick={logout}
                  aria-label="Logout"
                  title="Abmelden"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass("/login")}>
                  Login
                </Link>
                <Link href="/register" className="navbar-register-pill">
                  Registration
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── Burger button (mobile/tablet only) ─────────────────────────── */}
        <button
          className="navbar-burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ── Full-screen mobile menu overlay ──────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-menu">

          <label className="mobile-menu-search" htmlFor="mobile-lobby-id-search">
            <Search size={18} className="navbar-search-icon" />
            <input
              id="mobile-lobby-id-search"
              className="navbar-search-input"
              placeholder="Enter Lobby ID"
              onKeyDown={handleLobbySearch}
            />
          </label>

          <button
            className="mobile-menu-link"
            onClick={() => go("/lobbies")}
          >
            Lobbies
          </button>

          <button
            className="mobile-menu-link"
            onClick={() => go("/leaderboard")}
          >
            Leaderboard
          </button>

          {!isLoading && user && (
            <>
              <button
                className="mobile-menu-link"
                onClick={() => go(`/users/${user.userId}`)}
              >
                {user.username}
              </button>
              <button
                className="mobile-menu-link mobile-menu-link--muted"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Logout
              </button>
            </>
          )}

          {!isLoading && !user && (
            <>
              <button
                className="mobile-menu-link"
                onClick={() => go("/login")}
              >
                Login
              </button>
              <button
                className="mobile-menu-link mobile-menu-link--primary"
                onClick={() => go("/register")}
              >
                Registration
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}