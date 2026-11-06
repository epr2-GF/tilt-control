"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export default function BackButton({
  href = "/",
  label = "Retour Accueil",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
className="
  flex items-center gap-1.5
  px-3 py-1.5
  text-sm
  rounded-lg
  bg-slate-800
  hover:bg-slate-700
  transition
"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}