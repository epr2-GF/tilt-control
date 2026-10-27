"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import type { User, Role } from "@/types/user";
import {getUsers,} from "@/lib/userService";
import CreateUserModal from "@/components/CreateUserModal";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  UserPlus,
  Pencil,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth(); 
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);


// -----------------------------
  // AUTH GUARD
  // -----------------------------
useEffect(() => {

 if(user === null){
   router.push("/login");
   return;
 }

 if(
   user &&
   user.role !== "admin" &&
   user.role !== "superadmin"
 ){
   router.push("/");
 }

},[user]);
  // -----------------------------
  // LOAD USERS
  // -----------------------------
  useEffect(() => {
    loadUsers();
  }, []);

async function loadUsers() {
  try {
    const data = await getUsers();
    setUsers(data);
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

// -----------------------------
  // LOADING / INITIALIZATION
  // -----------------------------
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">



{/* HEADER */}
<div className="flex justify-between items-center mb-6">

  <div className="flex items-center gap-3">
    <Shield />
    <h1 className="text-2xl font-bold">
      Administration
    </h1>
  </div>

  <button
    onClick={() => router.push("/")}
    className="
      flex
      items-center
      gap-2
      bg-slate-800
      hover:bg-slate-700
      px-4
      py-2
      rounded-lg
      transition
    "
  >
    <ArrowLeft size={16} />
    Accueil
  </button>

</div>

{/* CREATE USER */}
<div className="mb-6 flex justify-end">
  <button
    type="button"
    onClick={() => setShowCreateUser(true)}
    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium transition hover:bg-green-500"
  >
    <UserPlus size={18} />
    Ajouter un utilisateur
  </button>
</div>


{/* USER LIST */}
<div className="space-y-2">
  {[...users]
    .sort((a, b) =>
      a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    )
    .map((u) => (
      <div
        key={u.id}
        className={`
          flex items-center justify-between gap-4
          rounded-lg border px-4 py-2.5 transition-colors
          ${
            u.disabled
              ? "border-orange-600/70 bg-orange-950/40 hover:bg-orange-950/60"
              : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
          }
        `}
      >
        <div
          className={`min-w-0 truncate font-semibold ${
            u.disabled ? "text-orange-400" : "text-white"
          }`}
        >
          {u.username}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(`/admin/users/${encodeURIComponent(u.id)}`)
          }
          aria-label={`Modifier ${u.username}`}
          title={`Modifier ${u.username}`}
          className="
            flex shrink-0 items-center justify-center
            rounded-lg border border-slate-600
            bg-slate-700 p-2
            transition hover:bg-blue-600
          "
        >
          <Pencil size={18} />
        </button>
      </div>
    ))}
</div>

  
      {/* CREATE USER DIALOGUE */}
{showCreateUser && (
  <CreateUserModal
    onClose={() => setShowCreateUser(false)}
    onCreated={setUsers}
  />
)}
    </div>
  );
}