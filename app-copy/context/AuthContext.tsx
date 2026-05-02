"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MyUserDTO, UserDTO } from "@/types/user";
import { ApiService } from "@/api/apiService";
import { AuthContextType } from "@/types/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiService = new ApiService();


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ userId: number; username: string } | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async (token: string, userId: number) => {
        try {
            const userData = await apiService.get<MyUserDTO | UserDTO>(
                `/users/${userId}`,
                { headers: { token: token } });

            if (userData && "email" in userData) {
                setUser({
                    userId: userId,
                    username: userData.username
                });
            } else {
                logout()
            }

        } catch (e) {
            logout(); // Token ungültig? Ausloggen.
        } finally {
            setIsLoading(false);
        }
    };

    // Im AuthContext.tsx
    useEffect(() => {
        if (typeof window === "undefined") return;

        const rawToken = localStorage.getItem("token");
        const rawUserId = localStorage.getItem("userId");

        if (rawToken && rawUserId) {
            try {
                // WICHTIG: Da dein Hook JSON.stringify nutzt, 
                // MÜSSEN wir hier JSON.parse nutzen.
                const parsedToken = JSON.parse(rawToken);
                const parsedUserId = JSON.parse(rawUserId);

                setToken(parsedToken);
                fetchUser(parsedToken, Number(parsedUserId));
            } catch (e) {
                // Falls im Storage Müll steht (kein validiertes JSON), 
                // löschen wir alles sauber.
                console.error("Fehler beim Parsen der Auth-Daten", e);
                logout();
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (token: string, userId: number) => {
        localStorage.setItem("token", JSON.stringify(token));
        localStorage.setItem("userId", JSON.stringify(userId));
        setToken(token);
        await fetchUser(token, userId);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};