const VERSAO = "cidade-energia-v1";
const ESTATICOS = /^\/(_next\/static\/|icone|.*\.(?:woff2|svg|png)$)/;

const PAGINA_SEM_CONEXAO = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sem conexão · Cidade Energia</title><style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#F5F8FC;color:#0F2240;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box}main{max-width:28rem}h1{font-size:1.75rem;margin:0 0 .5rem}p{color:#4B5A72;line-height:1.5}a{display:inline-flex;align-items:center;min-height:52px;padding:0 24px;margin-top:1rem;border:2px solid #0F2240;border-radius:8px;background:#F2B705;color:#0F2240;font-weight:700;text-decoration:none;box-shadow:3px 3px 0 #0F2240}</style></head><body><main><h1>Você está sem internet</h1><p>O Cidade Energia precisa de conexão para carregar esta tela. Confira o Wi-Fi ou os dados móveis e tente de novo.</p><a href="">Tentar de novo</a></main></body></html>`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== VERSAO).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido).catch(
        () => new Response(PAGINA_SEM_CONEXAO, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    );
    return;
  }

  if (ESTATICOS.test(url.pathname)) {
    evento.respondWith(
      caches.open(VERSAO).then((cache) =>
        cache.match(pedido).then(
          (guardado) =>
            guardado ||
            fetch(pedido).then((resposta) => {
              if (resposta.ok) cache.put(pedido, resposta.clone());
              return resposta;
            }),
        ),
      ),
    );
  }
});
