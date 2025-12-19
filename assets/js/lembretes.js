// 1: LÓGICA DO MENU LATERAL
(function () {
  const btn = document.getElementById("toggleMenu");
  const aside = document.querySelector("aside");

  if (btn) {
    btn.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  }

  if (!btn || !aside) return;

  // --- 1. Lógica de Abrir/Fechar (Toggle) ---
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    aside.classList.toggle("menu-open");
  });

  // --- 2. Fechar ao Clicar Fora (melhor usabilidade mobile) ---
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 900 &&
      aside.classList.contains("menu-open") &&
      !aside.contains(e.target) &&
      e.target !== btn
    ) {
      aside.classList.remove("menu-open");
    }
  });

  // --- 3. Fechar em Desktop e Resize ---
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      aside.classList.remove("menu-open");
    }
  });

  // --- 4. Lógica de Esconder/Mostrar ao Rolar (Scroll em Mobile) ---
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.innerWidth <= 900) {
      if (window.scrollY > 200) {
        if (window.scrollY > lastScrollY) {
          btn.style.opacity = "0";
          btn.style.pointerEvents = "none";
          btn.style.transform = "translateY(-20px)";
        } else {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
          btn.style.transform = "translateY(0)";
        }
      } else {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.style.transform = "translateY(0)";
      }
      lastScrollY = window.scrollY;
    } else {
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      btn.style.transform = "translateY(0)";
    }
  });
})();

// 2. LÓGICA PRINCIPAL
document.addEventListener("DOMContentLoaded", () => {
  /* 1. SELETORES E VARIÁVEIS */
  const elements = {
    modals: {
      createCat: document.getElementById("createLembCatModal"),
      editCat: document.getElementById("editLembCatModal"),
      createLemb: document.getElementById("reminderLembModal"),
      viewLemb: document.getElementById("viewLembModal"),
      editLemb: document.getElementById("editLembModal"),
    },
    inputs: {
      createCatTitle: document.getElementById("createLembCatTitle"),
      editCatTitle: document.getElementById("editLembCatTitle"),
      createLembTitle: document.getElementById("reminderTextId"),
      createLembDate: document.getElementById("reminderDateId"),
      editLembTitle: document.getElementById("editLembTitle"),
      editLembDate: document.getElementById("editLembDueDate"),
    },
    containers: {
      main: document.querySelector(".lemb-container-principal"),
      viewItems: document.getElementById("viewLembItems"),
    },
    widgets: {
      total: document.getElementById("totalLembs"),
      andamento: document.getElementById("lembsAndamento"),
      pendentes: document.getElementById("lembsPendentes"),
      concluidas: document.getElementById("lembsConcluidas"),
      proximas: document.getElementById("proximaslembs"),
    },
  };

  let allLembretes = [];
  const STORAGE_KEY = "meuDiario_lembretes_v3";
  let activeCategoryCard = null;

  /* 2. LÓGICA DE STATUS (Prioridade para Pendente) */
  const getLembStatus = (lemb) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataLimite = lemb.dueDate ? new Date(lemb.dueDate + "T00:00:00") : null;
    const estaVencido = dataLimite && dataLimite < hoje;

    if (!lemb.items || lemb.items.length === 0) {
      return estaVencido ? "pendente" : "normal";
    }

    const feitos = lemb.items.filter((i) => i.done).length;
    const total = lemb.items.length;
    const tudoConcluido = total > 0 && feitos === total;

    // 1. Se tudo está marcado, status é CONCLUÍDA
    if (tudoConcluido) return "concluida";
    
    // 2. Se NÃO está tudo marcado e a data passou, status é PENDENTE
    if (estaVencido) return "pendente";

    // 3. Se tem progresso mas não venceu, status é ANDAMENTO
    return feitos > 0 ? "andamento" : "normal";
  };

  const formatDueDate = (date) => {
    if (!date) return "Sem data";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const closeModal = () => {
    Object.values(elements.modals).forEach(m => m && m.classList.remove("open"));
  };

  /* 3. PERSISTÊNCIA */
  const saveAll = () => {
    localStorage.setItem(STORAGE_KEY + "_lembretes", JSON.stringify(allLembretes));
    const cats = [
      ...elements.containers.main.querySelectorAll(".cardlemb:not(.default-card)"),
    ].map((card) => ({
      id: card.dataset.categoryId,
      title: card.querySelector("h2").innerText.replace(/.*?\s/, "").trim(),
    }));
    localStorage.setItem(STORAGE_KEY + "_categorias", JSON.stringify(cats));
  };

  /* 4. RENDERIZAÇÃO */
  const createEmptyMessage = () => {
    const li = document.createElement("li");
    li.className = "lemb-item-summary empty-msg";
    li.style.display = "flex";
    li.style.justifyContent = "center";
    li.style.alignItems = "center";
    li.style.minHeight = "40px";
    li.style.color = "#888";
    li.style.fontStyle = "italic";
    li.innerHTML = `<span>Ainda não há lembretes aqui</span>`;
    return li;
  };

  const renderLembretes = () => {
    document.querySelectorAll(".lembretes-container").forEach(ul => ul.innerHTML = "");

    if (allLembretes.length === 0) {
      document.querySelectorAll(".lembretes-container").forEach(ul => ul.appendChild(createEmptyMessage()));
    } else {
      const weights = { pendente: 0, normal: 1, andamento: 1, concluida: 2 };
      const sorted = [...allLembretes].sort((a, b) => {
        const statusA = getLembStatus(a);
        const statusB = getLembStatus(b);
        if (weights[statusA] !== weights[statusB]) return weights[statusA] - weights[statusB];
        return a.title.localeCompare(b.title);
      });

      sorted.forEach((lemb) => {
        const ul = document.getElementById(`lembretesContainer-${lemb.categoryId}`);
        if (!ul) return;

        const status = getLembStatus(lemb);
        const li = document.createElement("li");
        li.className = `lemb-item-summary ${status}`;
        li.innerHTML = `
            <span class="lemb-item-text" title="${lemb.title}">${lemb.title}</span>
            <span class="due-date">${formatDueDate(lemb.dueDate)}</span>
            <div class="quick-actions">
                <button class="icon-action edit-lemb-item" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="icon-action undo-lemb-item" title="Alternar Status"><i class="fas fa-undo"></i></button>
                <button class="icon-action delete-lemb-item" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        li.querySelector(".undo-lemb-item").onclick = (e) => {
          e.stopPropagation();
          const statusAtual = getLembStatus(lemb);
          const marcarComoFeito = statusAtual !== "concluida";
          if (!lemb.items || lemb.items.length === 0) {
             lemb.items = [{ id: Date.now(), name: lemb.title, done: false }];
          }
          lemb.items.forEach(item => item.done = marcarComoFeito);
          saveAll(); renderLembretes();
        };

        li.querySelector(".edit-lemb-item").onclick = (e) => { e.stopPropagation(); openEditLembModal(lemb.id); };
        li.querySelector(".delete-lemb-item").onclick = (e) => {
          e.stopPropagation();
          if (confirm("Excluir lembrete?")) {
            allLembretes = allLembretes.filter(l => l.id !== lemb.id);
            saveAll(); renderLembretes();
          }
        };

        li.onclick = () => openViewLembModal(lemb.id);
        ul.appendChild(li);
      });

      document.querySelectorAll(".lembretes-container").forEach(ul => {
        if (ul.children.length === 0) ul.appendChild(createEmptyMessage());
      });
    }
    renderTopWidgets();
  };

  const renderTopWidgets = () => {
    if (elements.widgets.total) elements.widgets.total.textContent = allLembretes.length;
    Object.values(elements.widgets).forEach(ul => { if (ul && ul.tagName === "UL") ul.innerHTML = ""; });
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    allLembretes.sort((a, b) => a.title.localeCompare(b.title)).forEach((lemb) => {
      const status = getLembStatus(lemb);
      const li = document.createElement("li");
      li.className = "summary-item";
      li.innerHTML = `<span class="lemb-item-text" title="${lemb.title}">${lemb.title}</span>`;
      li.onclick = () => openViewLembModal(lemb.id);

      if (status === "andamento") elements.widgets.andamento?.appendChild(li);
      else if (status === "pendente") elements.widgets.pendentes?.appendChild(li);
      else if (status === "concluida") elements.widgets.concluidas?.appendChild(li);

      if (lemb.dueDate && status !== "concluida" && status !== "pendente") {
        const d = new Date(lemb.dueDate + "T00:00:00");
        const diffDias = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24));
        if (diffDias >= 0 && diffDias <= 7) {
          const proxLi = li.cloneNode(true);
          proxLi.onclick = () => openViewLembModal(lemb.id);
          let label = diffDias === 0 ? "Hoje" : diffDias === 1 ? "Amanhã" : `Faltam ${diffDias} dias`;
          proxLi.innerHTML += ` <small>(${label})</small>`;
          elements.widgets.proximas?.appendChild(proxLi);
        }
      }
    });
  };

  /* 5. APOIO E CARDS */
  const createCategoryCard = (title, id = `cat-${Date.now()}`) => {
    const card = document.createElement("article");
    card.className = "cardlemb";
    card.dataset.categoryId = id;
    const isDefault = id === "default-lembs";
    if (isDefault) card.classList.add("default-card");

    card.innerHTML = `
        <h2><i class="fas fa-clipboard-list"></i> ${title}</h2>
        <button class="btn btn-primary add-lemb-btn">+ Adicionar Lembrete</button>
        <ul class="lembretes-container" id="lembretesContainer-${id}"></ul>
        <div class="category-actions">
            <button class="btn btn-secondary edit-cat-btn" ${isDefault ? 'disabled' : ''}><i class="fas fa-edit"></i> Editar</button>
            <button class="btn btn-delete delete-cat-btn" ${isDefault ? 'disabled' : ''}><i class="fas fa-trash-alt"></i> Excluir</button>
        </div>
    `;

    card.querySelector(".add-lemb-btn").onclick = () => {
      activeCategoryCard = card;
      elements.inputs.createLembTitle.value = "";
      elements.inputs.createLembDate.value = "";
      elements.modals.createLemb.classList.add("open");
    };

    if (!isDefault) {
      card.querySelector(".delete-cat-btn").onclick = () => {
        if (confirm("Excluir categoria?")) {
          allLembretes = allLembretes.filter(l => l.categoryId !== id);
          card.remove(); saveAll(); renderLembretes();
        }
      };
      card.querySelector(".edit-cat-btn").onclick = () => {
        elements.inputs.editCatTitle.value = title;
        elements.modals.editCat.dataset.editingId = id;
        elements.modals.editCat.classList.add("open");
      };
    }
    return card;
  };

  const openEditLembModal = (id) => {
    const lemb = allLembretes.find(l => l.id === id);
    if (!lemb) return;
    elements.modals.editLemb.dataset.editingId = id;
    elements.inputs.editLembTitle.value = lemb.title;
    elements.inputs.editLembDate.value = lemb.dueDate || "";
    elements.modals.editLemb.classList.add("open");
  };

  document.getElementById("saveEditListBtn").onclick = () => {
    const id = elements.modals.editLemb.dataset.editingId;
    const lemb = allLembretes.find(l => l.id === id);
    if (lemb) {
      lemb.title = elements.inputs.editLembTitle.value.trim();
      lemb.dueDate = elements.inputs.editLembDate.value;
      saveAll(); renderLembretes(); closeModal();
    }
  };

  const openViewLembModal = (id) => {
    const lemb = allLembretes.find(l => l.id === id);
    if (!lemb) return;
    document.getElementById("viewLembTitle").textContent = lemb.title;
    elements.containers.viewItems.innerHTML = "";
    if (!lemb.items) lemb.items = [{ id: Date.now(), name: lemb.title, done: false }];
    
    lemb.items.forEach((item) => {
      const li = document.createElement("li");
      if (item.done) li.classList.add("done");
      li.innerHTML = `<label><input type="checkbox" ${item.done ? "checked" : ""}> ${item.name}</label>`;
      li.querySelector("input").onchange = (e) => {
        item.done = e.target.checked;
        saveAll(); renderLembretes(); openViewLembModal(id);
      };
      elements.containers.viewItems.appendChild(li);
    });
    elements.modals.viewLemb.classList.add("open");
  };

  document.getElementById("addLembCatBtn").onclick = () => {
    elements.inputs.createCatTitle.value = "";
    elements.modals.createCat.classList.add("open");
  };

  document.getElementById("saveLembCreateCatBtn").onclick = () => {
    const title = elements.inputs.createCatTitle.value.trim();
    if (title) {
      const catsData = JSON.parse(localStorage.getItem(STORAGE_KEY + "_categorias") || "[]");
      catsData.push({ id: `cat-${Date.now()}`, title });
      localStorage.setItem(STORAGE_KEY + "_categorias", JSON.stringify(catsData));
      init(); closeModal();
    }
  };

  document.getElementById("saveReminderLembBtn").onclick = () => {
    const title = elements.inputs.createLembTitle.value.trim();
    if (title) {
      allLembretes.push({
        id: `lemb-${Date.now()}`,
        title,
        dueDate: elements.inputs.createLembDate.value,
        categoryId: activeCategoryCard ? activeCategoryCard.dataset.categoryId : "default-lembs",
        items: [{ id: Date.now(), name: title, done: false }],
      });
      saveAll(); renderLembretes(); closeModal();
    }
  };

  document.querySelectorAll(".btn-cancel, [id^='close']").forEach(btn => btn.onclick = closeModal);

  /* 6. INICIALIZAÇÃO (ORDEM ALFABÉTICA) */
  const init = () => {
    const data = localStorage.getItem(STORAGE_KEY + "_lembretes");
    if (data) allLembretes = JSON.parse(data);
    
    let catsData = JSON.parse(localStorage.getItem(STORAGE_KEY + "_categorias") || "[]");
    catsData.sort((a, b) => a.title.localeCompare(b.title));

    elements.containers.main.innerHTML = "";
    elements.containers.main.appendChild(createCategoryCard("Meus Lembretes", "default-lembs"));

    catsData.forEach((c) => {
      if (c.id !== "default-lembs") elements.containers.main.appendChild(createCategoryCard(c.title, c.id));
    });

    renderLembretes();
  };

  init();
});
