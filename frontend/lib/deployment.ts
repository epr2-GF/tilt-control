import type { User } from "@/types/user";

export function generateDeploymentMessage(user: User) {
  return `
🔐 Tilt Système de contrôle

Nom d'utilisateur: ${user.username}
Mot de passe: ${user.password}

Temps d'accès:
${user.accessStart || "00:00"} → ${user.accessEnd || "23:59"}

Lien de connexion:

http://192.168.0.180:3000

Veuillez conserver ces identifiants en lieu sûr.

📱 Si le lien n'est pas cliquable dans WhatsApp,
copiez-le dans votre navigateur.

Après connexion, ajoutez l'application à l'écran d'accueil.

  `.trim();
}

export async function copyDeploymentInfo(user: User) {
  const message = generateDeploymentMessage(user);

  // TRY modern clipboard API first
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
      return message;
    }
  } catch (err) {
    console.warn("Clipboard API failed, falling back...");
  }

  // FALLBACK (WORKS ON HTTP + ALL DEVICES)
  const textArea = document.createElement("textarea");
  textArea.value = message;

  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }

  return message;
}