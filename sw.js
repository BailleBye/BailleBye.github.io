/* ============================================================
   HomeBase — service worker
   - coquille de l'app (index, manifest, icônes) : cache d'abord
     -> ouverture instantanée et fonctionnement hors-ligne
   - repos.json : réseau d'abord, repli sur le cache hors-ligne
   - on n'intercepte QUE la racine de HomeBase : les sous-dossiers
     (tes autres projets, ex. /Course-List/) gardent leur comportement
     normal et leur propre service worker s'il existe.
   ============================================================ */

const CACHE = "homebase-v2";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

// chemins absolus de la coquille (ex. "/", "/index.html", ...) pour comparaison rapide
const SHELL_PATHS = new Set(SHELL.map(p => new URL(p, self.location).pathname));

self.addEventListener("install", (event) => {
  // pas de skipWaiting auto : la nouvelle version attend que l'utilisateur valide
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

// la page demande l'activation immédiate (bouton « mettre à jour »)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // on laisse passer le cross-origin

  // repos.json : on privilégie la fraîcheur, repli cache si hors-ligne
  if (url.pathname.endsWith("repos.json")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // coquille de l'app (et navigation vers la racine) : cache d'abord, maj en arrière-plan
  const isShell = SHELL_PATHS.has(url.pathname);
  const isRootNav = req.mode === "navigate" && SHELL_PATHS.has(url.pathname);

  if (isShell || isRootNav) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req)
          .then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached || caches.match("./index.html"));
        return cached || network;
      })
    );
  }
  // tout le reste : comportement réseau par défaut (on n'appelle pas respondWith)
});
