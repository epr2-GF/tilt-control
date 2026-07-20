import type { User } from "@/types/user";

export function generateDeploymentMessage(user: User) {
  return `
🔐 Tilt Système de contrôle

Nom d'utilisateur: ${user.username}
Mot de passe: ${user.password}

Temps d'accès:
${user.accessStart || "00:00"} → ${user.accessEnd || "23:59"}

Lien de connexion:

www.tilt44.com

Veuillez conserver ces identifiants en lieu sûr.

📱 Si le lien n'est pas cliquable dans WhatsApp, copiez-le dans votre navigateur.

Android:
Après connexion, appuyez sur l'icône à trois boutons - ajoutez l'application à l'écran d'accueil - Installer en tant qu'application si disponible

Iphone:
Ouvrez le lien dans le navigateur Safari, cliquez sur le bouton de partage (un carré avec une flèche vers le haut), 
puis ajoutez-le à l'écran d'accueil en tant qu'application, si cette option est disponible.

Les services de localisation doivent être activés lors de l'utilisation de l'application, faute de quoi celle-ci ne fonctionnera pas.

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