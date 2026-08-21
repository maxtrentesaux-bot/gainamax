// Service worker de GainaMax.
//
// Objectif : l'app reste utilisable hors connexion (salle en sous-sol, mode avion)
// et devient installable depuis Chrome / Samsung Internet sur Android.
//
// Stratégie volontairement simple, l'app tenant dans un seul fichier :
//   - navigation  -> réseau d'abord, cache en secours.
//     Ce sens-là est important : une nouvelle mise en ligne est prise en compte
//     dès le chargement suivant, au lieu de rester figée dans le cache.
//   - polices Google -> cache d'abord, rafraîchi en arrière-plan.
//     Elles ne changent jamais et c'est ce qui manque le plus hors connexion.
//   - le reste -> laissé au navigateur.

var VERSION = 'gainamax-v1';
var CACHE_APP = VERSION + '-app';
var CACHE_POLICES = VERSION + '-polices';
var PAGE = './index.html';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_APP)
      .then(function (c) { return c.add(new Request(PAGE, { cache: 'reload' })); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (noms) {
        return Promise.all(noms.map(function (n) {
          return n.indexOf(VERSION) === 0 ? null : caches.delete(n);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function estPolice(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  // Page : réseau d'abord, cache en secours.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(function (rep) {
          var copie = rep.clone();
          caches.open(CACHE_APP).then(function (c) { c.put(PAGE, copie); }).catch(function () {});
          return rep;
        })
        .catch(function () {
          return caches.match(PAGE, { ignoreSearch: true })
            .then(function (rep) { return rep || Response.error(); });
        })
    );
    return;
  }

  // Polices : cache d'abord, mise à jour silencieuse derrière.
  if (estPolice(url)) {
    e.respondWith(
      caches.open(CACHE_POLICES).then(function (c) {
        return c.match(req).then(function (dansLeCache) {
          var reseau = fetch(req).then(function (rep) {
            if (rep && (rep.ok || rep.type === 'opaque')) c.put(req, rep.clone());
            return rep;
          }).catch(function () { return dansLeCache; });
          return dansLeCache || reseau;
        });
      })
    );
  }
});
