"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
// import useLocalStorage from "@/hooks/useLocalStorage";
import { MyUserDTO, UserDTO } from "@/types/user";
import { useApi } from "@/hooks/useApi";
// import { fetchUser } from "@/utils/fetchUser";
import { Button, Tabs, Input, Form, App } from "antd";
import { useAuth } from "@/context/AuthContext";

type ProfileFormValues = {
  username: string;
  userBio?: string;
  password?: string;
};

// Dummy Game History
const DUMMY_HISTORY = [
  { name: "Pendler-Challenge", date: "10. Mar", rounds: "5R", score: 4280 },
  { name: "Mittagspause Express", date: "09. Mar", rounds: "3R", score: 2340 },
  { name: "SBB Marathon", date: "08. Mar", rounds: "10R", score: 7820 },
  { name: "Anfänger Runde", date: "07. Mar", rounds: "1R", score: 620 },
  { name: "Geheime Runde", date: "06. Mar", rounds: "5R", score: 3950 },
];

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

const Profile: React.FC = () => {
  const {message} = App.useApp();
  const apiService = useApi();
  const router = useRouter();
  const profileId = Number(useParams().id);
  // const [user, setUser] = useState<MyUserDTO | UserDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { user: currentUser, token, login, isLoading } = useAuth();

  const [profileData, setProfileData] = useState<MyUserDTO | UserDTO | null>(null);

  const isOwnProfile = currentUser?.userId === profileId;

  useEffect(() => {
    // const token = JSON.parse(localStorage.getItem("token") || '""') as string;
    if (!token) return;



    const loadProfile = async () => {
      try {
        const data = await apiService.get<MyUserDTO | UserDTO>(
          `/users/${profileId}`,
          {
            headers: { token: token },
          }
        );


        if ("email" in data) {
          // Es ist ein MyUserDTO (wahrscheinlich mein eigenes Profil)
          setProfileData(data as MyUserDTO);
        } else {
          // Es ist ein UserDTO (ein fremdes Profil)
          setProfileData(data as UserDTO);
        }
      }
      catch (error) {
        router.push("/lobbies");

      }
    }

    loadProfile();

  }, [profileId, token, router, apiService]);

  if (isLoading || !profileData) {
    return (
      <div className="page-center page-content">
        <p className="u-text-muted">Loading profile...</p>
      </div>
    );
  }

  const initial = profileData.username ? profileData.username[0].toUpperCase() : "?";
  const creationDate = profileData.creationDate
    ? new Date(profileData.creationDate).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : "";

  const scoreboard = profileData.userScoreboard;
  const totalPoints = scoreboard?.totalPoints ?? 0;
  const gamesPlayed = scoreboard?.gamesPlayed ?? 0;
  const gamesWon = scoreboard?.gamesWon ?? 0;
  const precision = scoreboard?.guessingPrecision ?? 0;
  const avgPoints = gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const handleEdit = () => {
    // Wir nehmen die Daten von profileData (dem User, den wir gerade sehen)
    if (profileData) {
      form.setFieldsValue({
        username: profileData.username,
        userBio: profileData.userBio || "",
        password: "", // Passwort bleibt leer zur Sicherheit
      });
      setEditing(true);
    }
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!token) return;

    try {
      await apiService.put(`/users/${profileId}`, {
        ...values,
        token: token, // Falls deine API das im Body braucht
      }, { headers: { token: token ?? undefined } });

      message.success("Profil aktualisiert!");

      const updatedData = {...profileData, ...values };
      setProfileData(updatedData);

      form.setFieldsValue(updatedData);

      // Seite neu laden oder State updaten
      setEditing(false);

      if (isOwnProfile && values.username) {
        await login(token, profileId);
       // Hier müsstest du deine login-Logik aus dem Context evtl. erweitern
       // oder einfach die Seite refreshen, falls der Context das noch nicht kann.
    }

      // Profi-Tipp: Wenn der Username geändert wurde, 
      // müsste man hier eigentlich login(token, profileId) nochmal triggern
      // um den globalen Context (Navbar!) zu aktualisieren.
    } catch (error) {
      message.error("Update fehlgeschlagen.");
    }
  };

  return (
    <div className="page-root page-content">
      <div className="profile-card card--wide">

        {/* ── Header ── */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar" style={{ background: "var(--red)" }}>
              {initial}
            </div>
            <div className="profile-online-dot" />
          </div>
          <div className="profile-header-info">
            <h2 className="profile-username">{profileData.username}</h2>
            {profileData.userBio && <p className="profile-bio">{profileData.userBio}</p>}
            <div className="profile-meta-row">
              <span className="badge badge-online">Online</span>
              {creationDate && (
                <span className="profile-joined">Mitglied seit {creationDate}</span>
              )}
            </div>
          </div>
          {isOwnProfile &&(
            !editing ? (
            <Button className="profile-edit-btn" size="middle" onClick={handleEdit}>
              ⚙️ Edit
            </Button>
          ) : (
            <Button className="profile-edit-btn" size="middle" onClick={() => setEditing(false)}>
              ⊘ Close
            </Button>)
          )}
        </div>

        {/* ── Edit Form (toggles with editing state) ── */}
        {editing && (
          <div className="profile-edit-form">
            <Form
              form={form}
              layout="vertical"
              size="large"
              onFinish={handleSave}
            >
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Username is required" }]}
              >
                <Input placeholder="Your username" />
              </Form.Item>
              <div className="profile-edit-hint">
                Must be unique. Changing it updates your profile everywhere.
              </div>

              <Form.Item name="userBio" label="Bio">
                <Input.TextArea placeholder="Tell us about yourself" rows={3} maxLength={200} />
              </Form.Item>

              <Form.Item name="password" label="New password">
                <Input.Password placeholder="Leave empty to keep current" />
              </Form.Item>
              <div className="profile-edit-hint">
                Changing your password will log you out. You&apos;ll need to log in again.
              </div>

              <div className="profile-edit-actions">
                <Button type="primary" htmlType="submit" className="form-submit-btn">
                  Save changes
                </Button>
                <Button size="large" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* ── Stats Cards — nur sichtbar wenn NICHT editing ── */}
        {!editing && (
          <>
            <div className="profile-stats-cards">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🏅</div>
                <div className="profile-stat-card-value">#—</div>
                <div className="profile-stat-card-label">World Wide Ranking</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">⭐</div>
                <div className="profile-stat-card-value">{formatNumber(totalPoints)}</div>
                <div className="profile-stat-card-label">Overall Points</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🎮</div>
                <div className="profile-stat-card-value">{gamesPlayed}</div>
                <div className="profile-stat-card-label">Overall Games</div>
              </div>
            </div>
            <div className="profile-stats-cards">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">📊</div>
                <div className="profile-stat-card-value">{formatNumber(avgPoints)}</div>
                <div className="profile-stat-card-label">Ø Points / Game</div>
              </div>
              <div className="profile-stat-card profile-stat-card--highlight">
                <div className="profile-stat-icon">🎯</div>
                <div className="profile-stat-card-value profile-stat-value--red">
                  {(precision * 100).toFixed(1)}%
                </div>
                <div className="profile-stat-card-label">Overall Precision</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🏆</div>
                <div className="profile-stat-card-value">{gamesWon} ({winRate}%)</div>
                <div className="profile-stat-card-label">Games Won</div>
              </div>
            </div>
          </>
        )}

        {/* ── Tabs ── */}
        <div className="profile-tabs-wrapper">
          <Tabs
            defaultActiveKey="history"
            items={[
              {
                key: "history",
                label: "Game History",
                children: (
                  <div>
                    {DUMMY_HISTORY.map((game, i) => (
                      <div key={i} className="profile-history-row">
                        <span className="profile-history-icon">⚡</span>
                        <div className="profile-history-info">
                          <div className="profile-history-name">{game.name}</div>
                          <div className="profile-history-meta">{game.date} · {game.rounds}</div>
                        </div>
                        <div className="profile-history-score">{formatNumber(game.score)}</div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "friends",
                label: `Friends (${profileData.friends?.length ?? 0})`,
                children: <p className="u-text-muted">No friends yet.</p>,
              },
              {
                key: "success",
                label: "Success (0/10)",
                children: <p className="u-text-muted">No achievements yet.</p>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;