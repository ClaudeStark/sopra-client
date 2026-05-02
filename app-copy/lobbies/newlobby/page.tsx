"use client";


// import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
// import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input, Radio, InputNumber, App } from "antd";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";
import { useAuth } from "@/context/AuthContext";

const NewLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm<CreateLobbyPostDTO>();
  const { handleJoin } = useLobbyActions();
  const {message: antdMessage} = App.useApp();

  const {user:currentUser, token, login} = useAuth();



  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async (values: CreateLobbyPostDTO) => {
  
    // const rawToken = localStorage.getItem("token");
    // const token = rawToken ? JSON.parse(rawToken) : "";

    // const rawUserId = localStorage.getItem("userId");
    // const userId = rawUserId ? JSON.parse(rawUserId) : -1;

    const payload = {
      lobbyName: values.lobbyName,
      size: Number(values.size),
      maxRounds: Number(values.maxRounds),
      // WICHTIG: Boolean zu Enum-String konvertieren
      visibility: values.visibility,
    };

    console.log(currentUser ? currentUser.userId.toString() : "-1")

    // Aufruf mit 3 Argumenten:
    const response = await apiService.post<LobbyAccessDTO>(
      "/lobbies",              // 1. Endpoint
      payload,      // 2. Data (Body) - schicke direkt das DTO
      {                        // 3. Options (Headers)
        headers: {
          token: token ? token : "",
          userId: currentUser ? currentUser.userId.toString() : "-1",
        },
      }
    );

    // localStorage.setItem("token", JSON.stringify(response.token));
    // localStorage.setItem("userId", JSON.stringify(response.userId));
    await login(response.token, response.userId);

    const lobbyCodeDTO: LobbyCodeDTO = {
      lobbyCode: response.lobbyCode
    };

    handleJoin(response.lobbyId, lobbyCodeDTO, {userId: response.userId, token: response.token});

  };

  return (
  <div className="page-center page-content">
    <div className="card card--form card--lobby-form">

      {/* Card header */}
      <h2 className="form-title">
        <span aria-hidden="true">🎯</span> New Lobby
      </h2>
      <p className="form-subtitle">Set up your game.</p>

      <Form
        form={form}
        name="lobby-creation"
        size="large"
        variant="outlined"
        layout="vertical"
        onFinish={handleCreate}
      >
        <Form.Item
          name="lobbyName"
          label="Lobby Name"
          rules={[{ required: true, message: "Please enter a lobby name!" }]}
        >
          <Input placeholder="e.g. Pendler-Challenge" />
        </Form.Item>

        <Form.Item
          name="size"
          label="Amount of Players"
          rules={[{ required: true, message: "Please enter the amount of players!" }]}
        >
          <InputNumber
            placeholder="e.g. 5"
            min={2}
            max={20}
            className="lobby-form-number"
          />
        </Form.Item>

        <Form.Item
          name="maxRounds"
          label="Rounds"
          rules={[{ required: true, message: "Please select amount of rounds to be played!" }]}
        >
          <Radio.Group className="lobby-form-tiles lobby-form-tiles--rounds">
            {[1, 3, 5, 10].map((r) => (
              <Radio
                key={r}
                value={r}
                className="lobby-form-tile lobby-form-tile--round"
              >
                {r}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="visibility"
          label="Lobby Visibility"
          rules={[{ required: true, message: "Please select a visibility option!" }]}
        >
          <Radio.Group className="lobby-form-tiles lobby-form-tiles--vis">
            <Radio value="PUBLIC" className="lobby-form-tile lobby-form-tile--vis">
              <span className="lobby-form-tile-emoji" aria-hidden="true">🌍</span>
              <span className="lobby-form-tile-label">Public</span>
              <span className="lobby-form-tile-desc">Anyone can join</span>
            </Radio>
            <Radio value="PRIVATE" className="lobby-form-tile lobby-form-tile--vis">
              <span className="lobby-form-tile-emoji" aria-hidden="true">🔒</span>
              <span className="lobby-form-tile-label">Private</span>
              <span className="lobby-form-tile-desc">Invite only</span>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="form-submit-btn btn-full"
          >
            Create Lobby
          </Button>
        </Form.Item>

      </Form>
    </div>
  </div>
)};

export default NewLobbyPage;