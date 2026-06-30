"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Safe for routing side effects
import { loginService } from "@/lib/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* -------------------------------------------------------------
     🛡️ ANTI-AUTH ROUTER GUARD
     If a logged-in user lands on /login, seamlessly push them away
  ------------------------------------------------------------- */

const handleLogin = async () => {
  try {
    setError("");

    const data = await loginService(username, password);

    await loginUser(data.token);

    router.replace("/");
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Échec de connexion");
  }
};

  // 1. While context is checking storage (undefined), show nothing or a blank screen
  if (user === undefined) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  // 3. Only show the form if user is strictly null (unauthenticated)
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-800 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Contrôle du Tilt</h1>
        <p className="text-slate-400 mb-6">Connexion Sécurisée</p>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl p-4 bg-slate-700 text-white outline-none"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl p-4 bg-slate-700 text-white outline-none"
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-2xl p-4 text-white font-semibold"
          >
            Connexion
          </button>
        </div>
      </div>
    </div>
  );
}