"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { UtensilsCrossed } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function RestaurantPage() {

  const router = useRouter();
  const { user } = useAuth();

  const hasAccess =
    user?.permissions?.zones.includes("restaurant") ?? false;


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
        title="Restaurant"
        subtitle="Gestion restaurant"
        icon={<UtensilsCrossed size={28} />}
      />


    </main>

  );
}