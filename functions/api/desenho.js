import { gerarDesenho } from "../../lib/desenho.js";

const resposta = (obj, status, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return resposta({ erro: "Método não permitido. Use POST." }, 405, { Allow: "POST" });
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: "Corpo ausente ou JSON inválido." }, 400);
  }
  if (corpo === null || typeof corpo !== "object" || Array.isArray(corpo)) {
    return resposta({ erro: "Corpo deve ser um objeto JSON." }, 400);
  }
  const numero = corpo.numero;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return resposta({ erro: "O campo numero deve ser um inteiro entre 1 e 100." }, 400);
  }

  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return resposta({ erro: "Token ausente." }, 401);

  let info;
  try {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(m[1].trim())
    );
    if (r.status !== 200) return resposta({ erro: "Token inválido ou expirado." }, 401);
    info = await r.json();
  } catch {
    return resposta({ erro: "Não foi possível validar o token." }, 401);
  }

  if (!env.GOOGLE_CLIENT_ID || info.aud !== env.GOOGLE_CLIENT_ID) {
    return resposta({ erro: "Token não pertence a este aplicativo." }, 401);
  }
  if (String(info.email_verified) !== "true" || !info.email) {
    return resposta({ erro: "E-mail não verificado." }, 401);
  }

  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}