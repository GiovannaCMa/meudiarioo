// ================= MENU LATERAL =================
(function () {
  const btn = document.getElementById("toggleMenu");
  const aside = document.querySelector("aside");

  if (!btn || !aside) return;

  // Configura a transição inicial para o botão
  btn.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  // Função auxiliar para controlar o ícone do livro
  function updateIcon(isOpen) {
    const icon = btn.querySelector("i");
    if (!icon) return;

    if (isOpen) {
      icon.classList.remove("fa-book");
      icon.classList.add("fa-book-open");
    } else {
      icon.classList.remove("fa-book-open");
      icon.classList.add("fa-book");
    }
  }

  // --- 1. Lógica de Abrir/Fechar (Toggle) ---
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    aside.classList.toggle("menu-open");
    
    // Atualiza o ícone baseado se a classe menu-open foi adicionada ou não
    const isOpen = aside.classList.contains("menu-open");
    updateIcon(isOpen);
  });

  // --- 2. Fechar ao Clicar Fora e Resize ---
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 900 &&
      aside.classList.contains("menu-open") &&
      !aside.contains(e.target) &&
      e.target !== btn
    ) {
      aside.classList.remove("menu-open");
      updateIcon(false); // Fecha o livro
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      aside.classList.remove("menu-open");
      updateIcon(false); // Fecha o livro
    }
  });

  // --- 3. Lógica de Esconder/Mostrar ao Rolar (Scroll em Mobile) ---
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.innerWidth <= 900) {
      // Se o menu estiver aberto, não escondemos o botão para não confundir o usuário
      if (aside.classList.contains("menu-open")) return;

      if (window.scrollY > 200) {
        if (window.scrollY > lastScrollY) {
          // Rolando para baixo: Esconde o botão
          btn.style.opacity = "0";
          btn.style.pointerEvents = "none";
          btn.style.transform = "translateY(-20px)";
        } else {
          // Rolando para cima: Mostra o botão
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
          btn.style.transform = "translateY(0)";
        }
      } else {
        // No topo da página: Visível
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.style.transform = "translateY(0)";
      }
      lastScrollY = window.scrollY;
    } else {
      // Em Desktop: Garante estado padrão
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      btn.style.transform = "translateY(0)";
    }
  });
})();

// ================= LISTAS =================
document.addEventListener("DOMContentLoaded", () => {
  // 1. MAPEAMENTO DE ELEMENTOS
  const elements = {
    modals: {
      createCat: document.getElementById("createCatModal"),
      editCat: document.getElementById("editCatModal"),
      createList: document.getElementById("createListModal"),
      viewList: document.getElementById("viewListModal"),
      editList: document.getElementById("editListModal"),
    },
    inputs: {
      createCatTitle: document.getElementById("createCatTitle"),
      editCatTitle: document.getElementById("editCatTitle"),
      createListTitle: document.getElementById("createListTitle"),
      createListDate: document.getElementById("createListDueDate"),
      editListTitle: document.getElementById("editListTitle"),
      editListDate: document.getElementById("editListDueDate"),
    },
    containers: {
      customLists: document.getElementById("customListsContainer"),
      createItens: document.getElementById("itensWrapper"),
      editItens: document.getElementById("editItensWrapper"),
      viewListItems: document.getElementById("viewListItems"),
    },
    btns: {
      addCat: document.getElementById("addCatBtn"),
      addListGlobal: document.getElementById("addListBtn"),
      saveCreateList: document.getElementById("saveCreateListBtn"),
      saveCreateCat: document.getElementById("saveCreateCatBtn"),
      saveEditCat: document.getElementById("saveEditCatBtn"),
      saveEditList: document.getElementById("saveEditListBtn"),
      addItem: document.getElementById("addItemBtn"),
      addEditItem: document.getElementById("addEditItemBtn"),
      uncheckAll: document.getElementById("uncheckAllBtn"),
      deleteList: document.getElementById("deleteListBtn"),
      editList: document.getElementById("editListBtn"),
    },
  };

  let allLists = [];
  let currentFilter = "all";

  const STATUS_LABELS = {
    pendente: "Pendente",
    "nao-iniciada": "Não iniciada",
    andamento: "Em andamento",
    concluida: "Concluída",
  };

  // 2. LÓGICA DE FECHAR MODAL
  const closeModal = () => {
    Object.values(elements.modals).forEach(m => {
      if (m) m.classList.remove("open");
    });
  };

  document.addEventListener("click", (e) => {
    if (e.target.id.startsWith("close") || 
        e.target.closest("[id^='close']") || 
        e.target.classList.contains("btn-cancel") ||
        e.target.classList.contains("modal")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // 3. UTILITÁRIOS
  const getListStatus = (list) => {
    const { items, dueDate } = list;
    if (!items || items.length === 0) return "nao-iniciada";
    const feitos = items.filter(i => i.done).length;
    if (items.length > 0 && feitos === items.length) return "concluida";
    if (dueDate) {
      const [y, m, d] = dueDate.split("-").map(Number);
      const due = new Date(y, m - 1, d).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (due < today && feitos < items.length) return "pendente";
    }
    return feitos === 0 ? "nao-iniciada" : "andamento";
  };

  const formatDueDate = (date) => {
    if (!date) return "Sem data";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const addItemInput = (wrapper, initialValue = "") => {
    const div = document.createElement("div");
    div.className = "item-input-group";
    div.innerHTML = `
      <input type="text" placeholder="Nome do Item" value="${initialValue}">
      <button type="button" class="remove-item-btn icon-action"><i class="fas fa-trash-alt"></i></button>
    `;
    div.querySelector(".remove-item-btn").onclick = () => div.remove();
    wrapper.appendChild(div);
  };

  const saveAll = () => {
    localStorage.setItem("diaryAppLists", JSON.stringify(allLists));
    const cats = [...document.querySelectorAll(".cardlist:not(.default-card)")].map(card => ({
      id: card.dataset.categoryId,
      title: card.querySelector("h2").textContent.trim()
    }));
    localStorage.setItem("diaryAppCategories", JSON.stringify(cats));
  };

  // 4. RENDERIZAÇÃO
   const createEmptyMessage = () => {
    const li = document.createElement("li");
    li.className = "list-item-summary empty-msg";
    li.style.display = "flex";
    li.style.justifyContent = "center";
    li.style.alignItems = "center";
    li.style.minHeight = "40px";
    li.style.color = "#888";
    li.style.fontStyle = "italic";
    li.innerHTML = `<span>Ainda não há listas aqui</span>`;
    return li;
  };

const renderLists = () => {
  // Limpa os containers antes de renderizar
  document.querySelectorAll(".listas-container").forEach(ul => ul.innerHTML = "");

  const statusWeights = {
    "pendente": 0,
    "andamento": 1,
    "nao-iniciada": 2,
    "concluida": 3
  };

  const sortedLists = [...allLists].sort((a, b) => {
    const statusA = getListStatus(a);
    const statusB = getListStatus(b);

    if (statusWeights[statusA] !== statusWeights[statusB]) {
      return statusWeights[statusA] - statusWeights[statusB];
    }

    const dateA = a.dueDate || "9999-12-31";
    const dateB = b.dueDate || "9999-12-31";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return a.title.localeCompare(b.title);
  });

  sortedLists.forEach(list => {
    const statusKey = getListStatus(list);
    const ul = document.getElementById(`listasContainer-${list.categoryId}`);

    if (ul) {
      const li = document.createElement("li");
      li.className = `list-item-summary ${statusKey}`;
      li.innerHTML = `
        <span style="text-transform:none;">${list.title}</span>
        <span class="due-date">${formatDueDate(list.dueDate)}</span>
      `;
      li.onclick = () => openViewListModal(list.id);
      ul.appendChild(li);
    }
  });

  // 👉 AQUI entra a mensagem de lista vazia
  document.querySelectorAll(".listas-container").forEach(ul => {
    if (ul.children.length === 0) {
      ul.appendChild(createEmptyMessage());
    }
  });

  renderTopWidgets();
};

  const renderTopWidgets = () => {
    const totalEl = document.getElementById("totalListas");
    if (totalEl) totalEl.textContent = allLists.length;
    
    const mapWidgets = {
      andamento: document.getElementById("listasAndamento"),
      pendente: document.getElementById("listasPendentes"),
      concluida: document.getElementById("listasConcluidas")
    };

    Object.values(mapWidgets).forEach(ul => { if (ul) ul.innerHTML = ""; });

    allLists.forEach(list => {
      const key = getListStatus(list);
      const ul = mapWidgets[key];
      if (ul) {
        const li = document.createElement("li");
        li.className = "summary-item";
        li.textContent = list.title;
        li.onclick = () => openViewListModal(list.id);
        ul.appendChild(li);
      }
    });
  };

  // 5. LÓGICA DE CATEGORIAS
  const createCategoryCard = (title, id) => {
    const article = document.createElement("article");
    article.className = "cardlist";
    article.dataset.categoryId = id;
    article.innerHTML = `
      <h2><i class="fa-solid fa-list-check"></i> ${title}</h2>
      <button class="btn btn-primary add-list-btn">+ Adicionar Lista</button>
      <ul class="listas-container" id="listasContainer-${id}"></ul>
      <div class="category-actions">
        <button class="btn btn-secondary edit-cat-btn"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-delete delete-cat-btn"><i class="fas fa-trash-alt"></i> Excluir</button>
      </div>
    `;

    article.querySelector(".add-list-btn").onclick = () => {
      elements.modals.createList.dataset.targetCat = id;
      elements.inputs.createListTitle.value = "";
      elements.containers.createItens.innerHTML = "";
      addItemInput(elements.containers.createItens);
      elements.modals.createList.classList.add("open");
    };

    article.querySelector(".edit-cat-btn").onclick = () => {
      elements.modals.editCat.dataset.editingCatId = id;
      elements.inputs.editCatTitle.value = title;
      elements.modals.editCat.classList.add("open");
    };

    article.querySelector(".delete-cat-btn").onclick = () => {
      if (confirm(`Excluir a categoria "${title}"?`)) {
        allLists = allLists.filter(l => l.categoryId !== id);
        article.remove();
        saveAll();
        renderLists();
      }
    };

    return article;
  };

  // 6. EVENTOS DE MODAIS
  const openViewListModal = (id) => {
    const list = allLists.find(l => l.id === id);
    if (!list) return;

    elements.modals.viewList.dataset.currentListId = id;
    document.getElementById("viewListTitle").textContent = list.title;
    document.getElementById("viewListDueDate").textContent = formatDueDate(list.dueDate);
    
    elements.containers.viewListItems.innerHTML = "";
    list.items.forEach((item, i) => {
      const li = document.createElement("li");
      if (item.done) li.classList.add("done");
      li.innerHTML = `
        <input type="checkbox" id="chk-${i}" ${item.done ? "checked" : ""}>
        <label for="chk-${i}">${item.name}</label>
      `;
      li.querySelector("input").onchange = (e) => {
        item.done = e.target.checked;
        saveAll(); renderLists(); li.classList.toggle("done", e.target.checked);
        updateModalStatus(list);
      };
      elements.containers.viewListItems.appendChild(li);
    });

    const updateModalStatus = (l) => {
      const key = getListStatus(l);
      const span = document.getElementById("viewListStatus");
      span.textContent = STATUS_LABELS[key];
      span.className = key;
      document.getElementById("contadorFeitos").textContent = l.items.filter(it => it.done).length;
      document.getElementById("contadorTotal").textContent = l.items.length;
    };
    updateModalStatus(list);
    elements.modals.viewList.classList.add("open");
  };

  const openEditListModal = (id) => {
    const list = allLists.find(l => l.id === id);
    if (!list) return;
    elements.modals.editList.dataset.editingId = id;
    elements.inputs.editListTitle.value = list.title;
    elements.inputs.editListDate.value = list.dueDate || "";
    elements.containers.editItens.innerHTML = "";
    list.items.forEach(it => addItemInput(elements.containers.editItens, it.name));
    elements.modals.editList.classList.add("open");
  };

  // 7. CLIQUES EM BOTÕES
  elements.btns.addCat.onclick = () => {
    elements.inputs.createCatTitle.value = "";
    elements.modals.createCat.classList.add("open");
  };

  elements.btns.saveCreateCat.onclick = () => {
    const title = elements.inputs.createCatTitle.value.trim();
    if (title) {
      const id = `cat-${Date.now()}`;
      elements.containers.customLists.appendChild(createCategoryCard(title, id));
      saveAll();
      closeModal();
    }
  };

  elements.btns.saveEditCat.onclick = () => {
    const id = elements.modals.editCat.dataset.editingCatId;
    const newTitle = elements.inputs.editCatTitle.value.trim();
    if (newTitle && id) {
      const card = document.querySelector(`[data-category-id="${id}"]`);
      if (card) {
        card.querySelector("h2").innerHTML = `<i class="fa-solid fa-list-check"></i> ${newTitle}`;
        saveAll();
        closeModal();
      }
    }
  };

  elements.btns.addListGlobal.onclick = () => {
    elements.modals.createList.dataset.targetCat = "default-listas";
    elements.inputs.createListTitle.value = "";
    elements.containers.createItens.innerHTML = "";
    addItemInput(elements.containers.createItens);
    elements.modals.createList.classList.add("open");
  };

  elements.btns.addItem.onclick = () => addItemInput(elements.containers.createItens);
  elements.btns.addEditItem.onclick = () => addItemInput(elements.containers.editItens);

  elements.btns.saveCreateList.onclick = () => {
    const title = elements.inputs.createListTitle.value.trim();
    const items = [...elements.containers.createItens.querySelectorAll("input")].map(i => ({
      name: i.value.trim(), done: false
    })).filter(i => i.name);
    
    if (title) {
      allLists.push({
        id: `list-${Date.now()}`,
        title,
        dueDate: elements.inputs.createListDate.value,
        categoryId: elements.modals.createList.dataset.targetCat || "default-listas",
        items
      });
      saveAll(); renderLists(); closeModal();
    }
  };

  elements.btns.saveEditList.onclick = () => {
    const id = elements.modals.editList.dataset.editingId;
    const list = allLists.find(l => l.id === id);
    if (list) {
      list.title = elements.inputs.editListTitle.value.trim();
      list.dueDate = elements.inputs.editListDate.value;
      list.items = [...elements.containers.editItens.querySelectorAll("input")].map((inp, idx) => ({
        name: inp.value.trim(),
        done: list.items[idx] ? list.items[idx].done : false
      })).filter(i => i.name);
      saveAll(); renderLists(); closeModal();
    }
  };

  elements.btns.uncheckAll.onclick = () => {
    const id = elements.modals.viewList.dataset.currentListId;
    const list = allLists.find(l => l.id === id);
    if (list) {
      list.items.forEach(i => i.done = false);
      saveAll(); renderLists(); openViewListModal(id);
    }
  };

  elements.btns.deleteList.onclick = () => {
    const id = elements.modals.viewList.dataset.currentListId;
    if (id && confirm("Excluir esta lista?")) {
      allLists = allLists.filter(l => l.id !== id);
      saveAll(); renderLists(); closeModal();
    }
  };

  elements.btns.editList.onclick = () => {
    const id = elements.modals.viewList.dataset.currentListId;
    if (id) { closeModal(); openEditListModal(id); }
  };

  // 8. INICIALIZAÇÃO
  const init = () => {
    const sL = localStorage.getItem("diaryAppLists");
    const sC = localStorage.getItem("diaryAppCategories");
    
    if (sL) allLists = JSON.parse(sL);
    if (sC) {
      JSON.parse(sC).forEach(c => {
        if (c.id !== "default-listas") {
          elements.containers.customLists.appendChild(createCategoryCard(c.title, c.id));
        }
      });
    }
    renderLists();
  };

  init();
});