"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessZone } from "@/lib/permissions";

import { Trees } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function ExteriorPage() {

    const router = useRouter();
    const { user } = useAuth();

useEffect(() => {
  if (!user) {
    router.push("/login");
    return;
  }

  if (!canAccessZone(user.role, "exterior")) {
    router.push("/");
  }
}, [user, router]);

if (!user) return null;

if (!canAccessZone(user.role, "exterior")) {
  return null;
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      <div className="mb-6">
        <BackButton />
      </div>

      <ZoneHeader
        title="Exterior"
        subtitle="Équipements et capteurs extérieurs"
        icon={<Trees size={28} />}
      />

    </main>
  );
}