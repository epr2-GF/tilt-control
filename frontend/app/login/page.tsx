
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginService } from "@/lib/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // While context is checking storage
  if (user === undefined) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  // Only show the form if user is unauthenticated
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-800 rounded-3xl p-6 shadow-2xl">

        <h1 className="text-3xl font-bold text-white mb-2">
          Bienvenue chez TILT
        </h1>

        <p className="text-slate-400 mb-6">
          Connexion Sécurisée
        </p>

        <div className="space-y-4">

          {/* Username */}
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="
              w-full
              rounded-2xl
              p-4
              bg-slate-700
              text-white
              outline-none
            "
          />

          {/* Password */}
          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full
                rounded-2xl
                p-4
                pr-14
                bg-slate-700
                text-white
                outline-none
              "
            />

            {/* Show / Hide password */}
            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-slate-300
                hover:text-white
                p-2
                rounded-lg
                transition
              "
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              title={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={2} />
              ) : (
                <Eye size={20} strokeWidth={2} />
              )}
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login */}
          <button
            type="button"
            onClick={handleLogin}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-500
              transition
              rounded-2xl
              p-4
              text-white
              font-semibold
            "
          >
            Connexion
          </button>

        </div>
      </div>
    </div>
  );
}

