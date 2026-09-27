export function normalizeCompanyName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function normalizeProductName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function moneyFromCents(cents = 0) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function centsFromInput(value) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

export async function identifierEmail(normalizedName) {
  const bytes = new TextEncoder().encode(normalizedName);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hash}@sistema-gestao.firebaseapp.com`;
}

export function friendlyFirebaseError(error) {
  const code = error?.code || "";
  const map = {
    "auth/email-already-in-use": "Esta empresa já possui um login.",
    "auth/invalid-credential": "Nome da empresa ou senha incorretos.",
    "auth/invalid-login-credentials": "Nome da empresa ou senha incorretos.",
    "auth/wrong-password": "Nome da empresa ou senha incorretos.",
    "auth/user-not-found": "Nome da empresa ou senha incorretos.",
    "auth/weak-password": "A senha não foi aceita pelo Firebase.",
    "auth/network-request-failed": "Não foi possível conectar ao Firebase. Verifique a internet.",
    "auth/requires-recent-login": "Por segurança, confirme sua senha novamente.",
    "permission-denied": "O Firebase recusou esta operação. Confira as regras do Firestore.",
    "failed-precondition": "Esta operação precisa de uma configuração adicional no Firebase.",
  };
  return map[code] || error?.message || "Ocorreu um erro inesperado.";
}

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}
