"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { Building2, ArrowRightLeft, Warehouse } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import BinaryControl from "@/components/BinaryControl";


export default function TiltPage() {

  const router = useRouter();
  const { user } = useAuth();


  /*
    AUTH + PERMISSION CHECK
  */
  useEffect(() => {

    if (!user) {
      router.push("/login");
      return;
    }


    const allowed =
      user.permissions?.zones?.includes("tilt");


    if (!allowed) {
      router.push("/");
    }

  }, [user, router]);


  if (!user) return null;


  if (!user.permissions?.zones?.includes("tilt")) {
    return null;
  }



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">


      <div className="mb-6">
        <BackButton />
      </div>



      <ZoneHeader
        title="Zone Tilt"
        subtitle="Contrôle principal du site"
        icon={<Building2 size={28} />}
      />



      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">


        {user.permissions?.controls?.includes(
          "portail-principal"
        ) && (

          <BinaryControl
            controlId="portail-principal"

            commandEntity="input_boolean.fakegate"
            statusEntity="input_boolean.fakegate"

            title="Portail Principal"
            description="Entrée principale"

            icon={
              <ArrowRightLeft size={20} />
            }

            onText="Ouvert"
            offText="Fermé"

            buttonText="Commander"
          />

        )}
{user.permissions?.controls?.includes(
  "porte-entrepot"
) && (

  <BinaryControl
    controlId="porte-entrepot"

    commandEntity="input_boolean.fakedoor"
    statusEntity="input_boolean.fakedoor"

    title="Porte Entrepôt"
    description="Accès principal"

    icon={
      <Warehouse size={20} />
    }

    onText="Ouverte"
    offText="Fermé"

    buttonText="Commander"
  />

)}

      </section>


    </main>
  );
}