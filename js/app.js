const STORAGE = {
  favorites: "cpcpm_favorites",
  recent: "cpcpm_recent",
  studied: "cpcpm_studied",
  theme: "cpcpm_theme"
};

const resources = [
  { title: "Pronunciamento Oficial", subtitle: "PDF oficial do CPC", icon: "📄" },
  { title: "Resumo do Professor Moreira", subtitle: "Síntese didática e objetiva", icon: "📝" },
  { title: "Mapa Mental", subtitle: "Revisão visual dos pontos-chave", icon: "🧠" },
  { title: "Casos Práticos", subtitle: "Aplicações contábeis comentadas", icon: "📚" },
  { title: "Quizzes", subtitle: "Teste seus conhecimentos", icon: "❓" },
  { title: "Questões Comentadas", subtitle: "Questões com explicações detalhadas", icon: "📋" },
  { title: "Pergunte ao Professor Moreira", subtitle: "Estrutura preparada para futura IA", icon: "💬" }
];

const $ = (selector) => document.querySelector(selector);
const read = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

let activeCpc = null;

function normalize(text) {
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function cardTemplate(cpc) {
  const favorites = read(STORAGE.favorites);
  const isFavorite = favorites.includes(cpc.numero);
  return `
    <article class="cpc-card" data-number="${cpc.numero}" tabindex="0" role="button" aria-label="Abrir CPC ${cpc.numero}">
      <div class="cpc-number"><div><small>CPC</small>${cpc.numero}</div></div>
      <div>
        <h3>CPC ${cpc.numero}</h3>
        <p>${cpc.nome}</p>
      </div>
      <div class="card-actions">
        <button class="favorite-btn" data-favorite="${cpc.numero}" aria-label="Favoritar CPC ${cpc.numero}">${isFavorite ? "★" : "☆"}</button>
        <span class="arrow">›</span>
      </div>
    </article>`;
}

function renderCpcs(list = window.CPCS) {
  $("#cpcGrid").innerHTML = list.map(cardTemplate).join("");
  $("#resultCount").textContent = `${list.length} CPC${list.length === 1 ? "" : "s"}`;
  $("#emptyState").classList.toggle("hidden", list.length > 0);
}

function renderMiniList(containerId, numbers) {
  const container = $(containerId);
  container.innerHTML = numbers.map(number => {
    const cpc = window.CPCS.find(item => item.numero === number);
    if (!cpc) return "";
    return `<button class="mini-card" data-open="${cpc.numero}"><strong>CPC ${cpc.numero}</strong><span>${cpc.nome}</span></button>`;
  }).join("");
}

function refreshSections() {
  const favorites = read(STORAGE.favorites);
  const recent = read(STORAGE.recent);
  renderMiniList("#favoritesList", favorites);
  renderMiniList("#recentList", recent);
  $("#favoritesSection").classList.toggle("hidden", favorites.length === 0);
  $("#recentSection").classList.toggle("hidden", recent.length === 0);
}

function updateProgress() {
  const studied = read(STORAGE.studied);
  const total = window.CPCS.length;
  const percent = Math.round((studied.length / total) * 100);
  $("#studiedCount").textContent = studied.length;
  $("#totalCount").textContent = total;
  $("#remainingCount").textContent = total - studied.length;
  $("#progressPercent").textContent = `${percent}%`;
  $("#progressCircle").style.background = `conic-gradient(var(--red) ${percent * 3.6}deg, #e7edf5 0deg)`;
  if (activeCpc) {
    $("#markStudied").textContent = studied.includes(activeCpc.numero) ? "✓ CPC estudado" : "✓ Marcar como estudado";
  }
}

function toggleFavorite(number) {
  const favorites = read(STORAGE.favorites);
  const next = favorites.includes(number) ? favorites.filter(n => n !== number) : [number, ...favorites];
  write(STORAGE.favorites, next);
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
  if (activeCpc?.numero === number) {
    $("#dialogFavorite").textContent = next.includes(number) ? "★" : "☆";
  }
}

function addRecent(number) {
  const recent = read(STORAGE.recent).filter(n => n !== number);
  recent.unshift(number);
  write(STORAGE.recent, recent.slice(0, 5));
  refreshSections();
}

function openCpc(number) {
  activeCpc = window.CPCS.find(cpc => cpc.numero === number);
  if (!activeCpc) return;
  addRecent(number);
  $("#dialogNumber").textContent = `CPC ${activeCpc.numero}`;
  $("#dialogName").textContent = activeCpc.nome;
  $("#dialogBadge").textContent = activeCpc.numero;
  $("#dialogFavorite").textContent = read(STORAGE.favorites).includes(number) ? "★" : "☆";
  $("#resourceGrid").innerHTML = resources.map((resource, index) => `
    <button class="resource-btn" data-resource="${index}">
      <span class="resource-icon">${resource.icon}</span>
      <span><strong>${resource.title}</strong><small>${resource.subtitle}</small></span>
      <span class="arrow">›</span>
    </button>`).join("");
  updateProgress();
  $("#cpcDialog").showModal();
}

function openPlaceholder(index) {
  const resource = resources[index];
  $("#placeholderIcon").textContent = resource.icon;
  $("#placeholderCpc").textContent = `CPC ${activeCpc.numero}`;
  $("#placeholderTitle").textContent = resource.title;
  $("#placeholderDialog").showModal();
}

function filterCpcs(term) {
  const query = normalize(term.trim());
  if (!query) return window.CPCS;
  return window.CPCS.filter(cpc => {
    const haystack = normalize([cpc.numero, `cpc ${cpc.numero}`, cpc.nome, ...cpc.palavras].join(" "));
    return haystack.includes(query);
  });
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE.theme, theme);
  $("#themeToggle").textContent = theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
}

function toggleTheme() {
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
}

document.addEventListener("click", (event) => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    event.stopPropagation();
    toggleFavorite(favorite.dataset.favorite);
    return;
  }
  const card = event.target.closest("[data-number]");
  if (card) openCpc(card.dataset.number);
  const mini = event.target.closest("[data-open]");
  if (mini) openCpc(mini.dataset.open);
  const resource = event.target.closest("[data-resource]");
  if (resource) openPlaceholder(Number(resource.dataset.resource));
});

$("#searchInput").addEventListener("input", (event) => renderCpcs(filterCpcs(event.target.value)));
$("#themeToggle").addEventListener("click", toggleTheme);
$("#settingsTheme").addEventListener("click", toggleTheme);
$("#openSettings").addEventListener("click", () => $("#settingsDialog").showModal());
$("#dialogFavorite").addEventListener("click", () => activeCpc && toggleFavorite(activeCpc.numero));

$("#markStudied").addEventListener("click", () => {
  const studied = read(STORAGE.studied);
  const next = studied.includes(activeCpc.numero)
    ? studied.filter(n => n !== activeCpc.numero)
    : [...studied, activeCpc.numero];
  write(STORAGE.studied, next);
  updateProgress();
});

$("[data-close-dialog]").addEventListener("click", () => $("#cpcDialog").close());
$("[data-close-placeholder]").addEventListener("click", () => $("#placeholderDialog").close());
$("[data-close-settings]").addEventListener("click", () => $("#settingsDialog").close());

$("#clearFavorites").addEventListener("click", () => {
  write(STORAGE.favorites, []);
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
});
$("#clearHistory").addEventListener("click", () => {
  write(STORAGE.recent, []);
  refreshSections();
});
$("#clearProgress").addEventListener("click", () => {
  write(STORAGE.studied, []);
  updateProgress();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-number]")) {
    openCpc(event.target.dataset.number);
  }
});

setTheme(localStorage.getItem(STORAGE.theme) || "light");
renderCpcs();
refreshSections();
updateProgress();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
