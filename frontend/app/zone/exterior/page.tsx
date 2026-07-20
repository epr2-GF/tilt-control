"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { Trees } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function ExteriorPage() {

  const router = useRouter();
  const { user } = useAuth();

  const hasAccess =
    user?.permissions?.zones.includes("exterior") ?? false;


  useEffect(() => {

    if (user === null) {
      router.push("/login");
      return;
    }

    if (user && !hasAccess) {
      router.push("/");
    }

  }, [user, hasAccess, router]);


  if (!user) return null;

  if (!hasAccess) return null;


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