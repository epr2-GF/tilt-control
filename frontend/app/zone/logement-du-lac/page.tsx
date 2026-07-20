"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import RollerShutterCard from "@/components/RollerShutterCard";
import { House } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function LogementDuLacPage() {

  const router = useRouter();
  const { user } = useAuth();

  const hasAccess =
    user?.permissions?.zones.includes("logement-du-lac") ?? false;


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
        title="Logement du Lac"
        subtitle="Gestion du logement du lac"
        icon={<House size={28} />}
      />


      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

        <RollerShutterCard />

      </div>


    </main>
  );
}