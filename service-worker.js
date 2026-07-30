const CACHE_NAME = "cpc-na-palma-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon.png",
  "./pdf/CPC-00-R2-Estrutura-Conceitual.pdf",
  "./assets/cpc00.css",
  "./resumos/cpc00-dicionario.html",
  "./resumos/cpc00-flashcards.json",
  "./resumos/cpc00-flashcards.html",
  "./resumos/cpc00-resumo.html",
  "./mapas/cpc00-mapa.html",
  "./casos/cpc00-casos.html",
  "./quizzes/cpc00-quiz-05.html",
  "./quizzes/cpc00-quiz-03.html",
  "./quizzes/cpc00-quiz-09.html",
  "./quizzes/cpc00-quiz-04.html",
  "./quizzes/cpc00-quiz-08.html",
  "./quizzes/cpc00-quiz-07.html",
  "./quizzes/cpc00-simulado.html",
  "./quizzes/cpc00-quiz-01.html",
  "./quizzes/cpc00-quiz-10.html",
  "./quizzes/cpc00-quiz-06.html",
  "./quizzes/cpc00-quiz-02.html",
  "./quizzes/cpc00-index.html",
  "./comentarios/cpc00-questoes.json",
  "./comentarios/cpc00-questoes.html",
  "./ia/cpc00-ia.html"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
