const STORAGE = {
  favorites: "cpcpm_favorites",
  recent: "cpcpm_recent",
  studied: "cpcpm_studied",
  openedCpcs: "cpcpm_opened_cpcs",
  accessedResources: "cpcpm_accessed_resources",
  theme: "cpcpm_theme"
};

const resources = [
  { key: "pdf", title: "Pronunciamento Oficial", subtitle: "PDF oficial do CPC", icon: "📄" },
  { key: "resumo", title: "Resumo do Professor Moreira", subtitle: "Resumo completo e didático", icon: "📝" },
  { key: "mapa", title: "Mapa Mental", subtitle: "Organização visual do conteúdo", icon: "🧠" },
  { key: "casos", title: "Casos Práticos", subtitle: "Aplicações comentadas", icon: "📚" },
  { key: "dicionario", title: "Dicionário", subtitle: "Principais conceitos", icon: "📖" },
  { key: "flashcards", title: "Flashcards", subtitle: "Cartões para revisão", icon: "🎯" },
  { key: "quizzes", title: "Quizzes", subtitle: "Questões com correção imediata", icon: "❓" },
  { key: "comentarios", title: "Questões Comentadas", subtitle: "Questões explicadas", icon: "📋" },
  { key: "banco", title: "Banco de Questões", subtitle: "Questões organizadas por tema e banca", icon: "📚" },
  { key: "simulado", title: "Simulado Final", subtitle: "Avaliação completa", icon: "🏆" },
  { key: "macetes", title: "Macetes", subtitle: "Dicas e pontos de memorização", icon: "💡" },
  { key: "erros", title: "Erros Mais Comuns", subtitle: "Pegadinhas e interpretações incorretas", icon: "⚠️" },
  { key: "checklist", title: "Checklist de Revisão", subtitle: "Revisão antes da prova", icon: "📌" }
];

const $ = (selector) => document.querySelector(selector);
const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

let activeCpc = null;

function normalize(text) {
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getResourceId(cpcNumber, resourceKey) {
  return `${cpcNumber}:${resourceKey}`;
}

function getCpcStatus(cpc) {
  const studied = read(STORAGE.studied);
  const opened = read(STORAGE.openedCpcs);

  if (studied.includes(cpc.numero)) return "completed";
  if (opened.includes(cpc.numero)) return "accessed";
  return "new";
}

function cardTemplate(cpc) {
  const favorites = read(STORAGE.favorites);
  const isFavorite = favorites.includes(cpc.numero);
  const status = getCpcStatus(cpc);

  const statusText = status === "completed"
    ? "✓ Estudado"
    : status === "accessed"
      ? "Em andamento"
      : "Não iniciado";

  return `
    <article
      class="cpc-card cpc-status-${status}"
      data-number="${cpc.numero}"
      tabindex="0"
      role="button"
      aria-label="Abrir CPC ${cpc.numero}"
    >
      <div class="cpc-number">
        <div><small>CPC</small>${cpc.numero}</div>
      </div>

      <div class="cpc-card-copy">
        <h3>CPC ${cpc.numero}</h3>
        <p>${cpc.nome}</p>
        <span class="cpc-status-label">${statusText}</span>
      </div>

      <div class="card-actions">
        <button
          class="favorite-btn"
          data-favorite="${cpc.numero}"
          aria-label="Favoritar CPC ${cpc.numero}"
        >${isFavorite ? "★" : "☆"}</button>
        <span class="arrow">›</span>
      </div>
    </article>`;
}

function visibleCpcs() {
  return window.CPCS.filter(cpc => cpc.ativo !== false);
}

function renderCpcs(list = visibleCpcs()) {
  $("#cpcGrid").innerHTML = list.map(cardTemplate).join("");
  $("#resultCount").textContent = `${list.length} CPC${list.length === 1 ? "" : "s"}`;
  $("#emptyState").classList.toggle("hidden", list.length > 0);
}

function renderMiniList(containerId, numbers) {
  const container = $(containerId);
  container.innerHTML = numbers.map(number => {
    const cpc = visibleCpcs().find(item => item.numero === number);
    if (!cpc) return "";

    const status = getCpcStatus(cpc);
    return `
      <button class="mini-card mini-status-${status}" data-open="${cpc.numero}">
        <strong>CPC ${cpc.numero}</strong>
        <span>${cpc.nome}</span>
      </button>`;
  }).join("");
}

function refreshSections() {
  const favorites = read(STORAGE.favorites);
  const recent = read(STORAGE.recent).slice(0, 1);
  renderMiniList("#favoritesList", favorites);
  renderMiniList("#recentList", recent);
  $("#favoritesSection").classList.toggle("hidden", favorites.length === 0);
  $("#recentSection").classList.toggle("hidden", recent.length === 0);
}

function updateProgress() {
  const cpcs = visibleCpcs();
  const studied = read(STORAGE.studied).filter(number =>
    cpcs.some(cpc => cpc.numero === number)
  );
  const total = cpcs.length;
  const percent = total ? Math.round((studied.length / total) * 100) : 0;

  $("#studiedCount").textContent = studied.length;
  $("#totalCount").textContent = total;
  $("#remainingCount").textContent = Math.max(0, total - studied.length);
  $("#progressPercent").textContent = `${percent}%`;
  $("#progressCircle").style.background =
    `conic-gradient(var(--red) ${percent * 3.6}deg, #e7edf5 0deg)`;

  if (activeCpc) {
    const completed = studied.includes(activeCpc.numero);
    $("#markStudied").textContent = completed
      ? "✓ CPC estudado"
      : "✓ Marcar como estudado";
    $("#markStudied").classList.toggle("is-completed", completed);
  }
}

function toggleFavorite(number) {
  const favorites = read(STORAGE.favorites);
  const next = favorites.includes(number)
    ? favorites.filter(n => n !== number)
    : [number, ...favorites];

  write(STORAGE.favorites, next);
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();

  if (activeCpc?.numero === number) {
    $("#dialogFavorite").textContent = next.includes(number) ? "★" : "☆";
  }
}

function addRecent(number) {
  write(STORAGE.recent, [number]);
  refreshSections();
}

function markCpcOpened(number) {
  const opened = read(STORAGE.openedCpcs);
  if (!opened.includes(number)) {
    write(STORAGE.openedCpcs, [number, ...opened]);
  }
}

function isResourceAccessed(cpcNumber, resourceKey) {
  return read(STORAGE.accessedResources).includes(
    getResourceId(cpcNumber, resourceKey)
  );
}

function markResourceAccessed(cpcNumber, resourceKey) {
  const id = getResourceId(cpcNumber, resourceKey);
  const accessed = read(STORAGE.accessedResources);

  if (!accessed.includes(id)) {
    write(STORAGE.accessedResources, [id, ...accessed]);
  }
}

function resourceTemplate(resource, index) {
  const available = Boolean(activeCpc[resource.key]);
  const accessed = isResourceAccessed(activeCpc.numero, resource.key);

  let statusClass = "resource-pending";
  let statusText = "EM BREVE";
  let subtitle = `${resource.subtitle} • Em preparação`;

  if (available && !accessed) {
    statusClass = "resource-available";
    statusText = "ABRIR";
    subtitle = "Disponível agora";
  }

  if (available && accessed) {
    statusClass = "resource-accessed";
    statusText = "✓ ACESSADO";
    subtitle = "Conteúdo já acessado";
  }

  return `
    <button
      class="resource-btn ${statusClass}"
      data-resource="${index}"
      type="button"
    >
      <span class="resource-icon">${resource.icon}</span>
      <span class="resource-copy">
        <strong>${resource.title}</strong>
        <small>${subtitle}</small>
      </span>
      <span class="resource-status">${statusText}</span>
    </button>`;
}

function renderResources() {
  $("#resourceGrid").innerHTML = resources
    .map(resourceTemplate)
    .join("");
}

function openCpc(number) {
  activeCpc = visibleCpcs().find(cpc => cpc.numero === number);
  if (!activeCpc) return;

  addRecent(number);
  markCpcOpened(number);

  $("#dialogNumber").textContent = `CPC ${activeCpc.numero}`;
  $("#dialogName").textContent = activeCpc.nome;
  $("#dialogBadge").textContent = activeCpc.numero;
  $("#dialogFavorite").textContent =
    read(STORAGE.favorites).includes(number) ? "★" : "☆";

  renderResources();
  updateProgress();
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
  $("#cpcDialog").showModal();
}

function openResource(index) {
  const resource = resources[index];
  const target = activeCpc?.[resource.key];

  if (target) {
    markResourceAccessed(activeCpc.numero, resource.key);
    renderResources();

    // Pequeno atraso para o aluno perceber a mudança de cor antes da abertura.
    setTimeout(() => {
      window.open(target, "_blank", "noopener,noreferrer");
    }, 180);
    return;
  }

  $("#placeholderIcon").textContent = resource.icon;
  $("#placeholderCpc").textContent = `CPC ${activeCpc.numero}`;
  $("#placeholderTitle").textContent = resource.title;
  $("#placeholderDialog").showModal();
}

function filterCpcs(term) {
  const cpcs = visibleCpcs();
  const query = normalize(term.trim());

  if (!query) return cpcs;

  return cpcs.filter(cpc => {
    const palavras = Array.isArray(cpc.palavras) ? cpc.palavras : [];
    const haystack = normalize([
      cpc.numero,
      `cpc ${cpc.numero}`,
      cpc.nome,
      ...palavras
    ].join(" "));

    return haystack.includes(query);
  });
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE.theme, theme);
  $("#themeToggle").textContent =
    theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
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
  if (card) {
    openCpc(card.dataset.number);
    return;
  }

  const mini = event.target.closest("[data-open]");
  if (mini) {
    openCpc(mini.dataset.open);
    return;
  }

  const resource = event.target.closest("[data-resource]");
  if (resource) {
    openResource(Number(resource.dataset.resource));
  }
});

$("#searchInput").addEventListener(
  "input",
  event => renderCpcs(filterCpcs(event.target.value))
);

$("#themeToggle").addEventListener("click", toggleTheme);
$("#settingsTheme").addEventListener("click", toggleTheme);
$("#openSettings").addEventListener(
  "click",
  () => $("#settingsDialog").showModal()
);

$("#dialogFavorite").addEventListener(
  "click",
  () => activeCpc && toggleFavorite(activeCpc.numero)
);

$("#markStudied").addEventListener("click", () => {
  if (!activeCpc) return;

  const studied = read(STORAGE.studied);
  const next = studied.includes(activeCpc.numero)
    ? studied.filter(n => n !== activeCpc.numero)
    : [...studied, activeCpc.numero];

  write(STORAGE.studied, next);
  updateProgress();
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
});

$("[data-close-dialog]").addEventListener(
  "click",
  () => $("#cpcDialog").close()
);

$("[data-close-placeholder]").addEventListener(
  "click",
  () => $("#placeholderDialog").close()
);

$("[data-close-settings]").addEventListener(
  "click",
  () => $("#settingsDialog").close()
);

$("#clearFavorites").addEventListener("click", () => {
  write(STORAGE.favorites, []);
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
});

$("#clearHistory").addEventListener("click", () => {
  write(STORAGE.recent, []);
  write(STORAGE.openedCpcs, []);
  write(STORAGE.accessedResources, []);
  refreshSections();
  renderCpcs(filterCpcs($("#searchInput").value));

  if (activeCpc) {
    renderResources();
  }
});

$("#clearProgress").addEventListener("click", () => {
  write(STORAGE.studied, []);
  updateProgress();
  renderCpcs(filterCpcs($("#searchInput").value));
  refreshSections();
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
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./service-worker.js")
  );
}
