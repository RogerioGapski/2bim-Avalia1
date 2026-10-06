const GOOGLE_CLIENT_ID = "273338381322-rhsu0ad9cbivag2cuma0femp21vq732r.apps.googleusercontent.com";
let idToken = "";
let ultimoSvg = "";
const $ = (id) => document.getElementById(id);

function mostrarErro(msg) {
  $("erro").textContent = msg;
  $("resultado").innerHTML = "";
  $("baixar").hidden = true;
}

function aoLogar(resp) {
  idToken = resp.credential;
  $("erro").textContent = "";
  $("status").textContent = "Login realizado. Já pode gerar o desenho.";
}

window.addEventListener("load", () => {
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: aoLogar });
  google.accounts.id.renderButton($("botao-google"), { theme: "outline", size: "large" });
});

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("erro").textContent = "";

  const bruto = $("numero").value.trim();
  const numero = bruto === "" ? null : Number(bruto);

  const headers = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = "Bearer " + idToken;

  try {
    const r = await fetch("/api/desenho", {
      method: "POST",
      headers,
      body: JSON.stringify({ numero }),
    });

    if (r.status === 200) {
      ultimoSvg = await r.text();
      $("resultado").innerHTML = ultimoSvg;
      $("baixar").hidden = false;
      return;
    }

    let detalhe = "";
    try { detalhe = (await r.json()).erro || ""; } catch {}
    if (r.status === 400) mostrarErro("Erro 400: requisição inválida. " + detalhe);
    else if (r.status === 401) mostrarErro("Erro 401: não autorizado. Faça login novamente. " + detalhe);
    else mostrarErro("Erro " + r.status + ". " + detalhe);
  } catch {
    mostrarErro("Falha de rede ao chamar o servidor.");
  }
});

$("baixar").addEventListener("click", () => {
  const blob = new Blob([ultimoSvg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exemplo.svg";
  a.click();
  URL.revokeObjectURL(a.href);
});