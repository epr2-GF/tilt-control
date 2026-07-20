"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PartyPopper } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function SalleDesFetesPage() {

    const router = useRouter();
    const { user } = useAuth();

useEffect(() => {
  if (!user) {
    router.push("/login");
    return;
  }

  if (user.permissions?.zones.includes("salle-des-fetes")) {
    router.push("/");
  }
}, [user, router]);

if (!user) return null;

if (user.permissions?.zones.includes("salle-des-fetes")) {
  return null;
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      <div className="mb-6">
        <BackButton />
      </div>

      <ZoneHeader
        title="Salle des Fêtes"
        subtitle="Gestion de la salle des fêtes"
        icon={<PartyPopper size={28} />}
      />

    </main>
  );
}