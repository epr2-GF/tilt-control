"use client";

import type { User } from "@/types/user";
import { copyDeploymentInfo } from "@/lib/deployment";
import { useToast } from "@/context/ToastContext";

export default function DeployButton({ user }: { user: User }) {
  const { showToast } = useToast();

  async function handleClick() {
    try {
      await copyDeploymentInfo(user);

      showToast("Informations de déploiement copiées", "success");
    } catch {
      showToast("Échec de la copie des informations de déploiement", "error");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 transition"
    >
      Déployer
    </button>
  );
}