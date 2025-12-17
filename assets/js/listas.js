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
  /* 1. VARIÁVEIS E SELETORES */
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
      editList: document.getElementById("editListBtn")
    }
  };

  let allLists = [];
  let currentFilter = "all";

  /* 2. UTILITÁRIOS */
  
  const getListStatus = (list) => {
    const { items, dueDate } = list;
    if (!items || items.length === 0) return "nao-iniciada"; 
    const total = items.length;
    const feitos = items.filter((i) => i.done).length;
    if (total > 0 && feitos === total) return "concluida";
    if (dueDate) {
      const dueDateTime = Date.parse(dueDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      if (dueDateTime < today.getTime()) return "pendente";
    }
    return feitos === 0 ? "nao-iniciada" : "andamento";
  };

  const formatDueDate = (date) => {
    if (!date) return "Sem data";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const closeModal = () => {
    Object.values(elements.modals).forEach(m => m && m.classList.remove("open"));
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

  /* 3. LOCAL STORAGE */
  const saveAll = () => {
    localStorage.setItem("diaryAppLists", JSON.stringify(allLists));
    const cats = [...elements.containers.customLists.querySelectorAll(".cardlist:not(.default-card)")].map(card => ({
      id: card.dataset.categoryId,
      title: card.querySelector("h2").textContent.replace(/^\S+\s/, "").trim()
    }));
    localStorage.setItem("diaryAppCategories", JSON.stringify(cats));
  };

  /* 4. RENDERIZAÇÃO */

  const renderLists = () => {
    document.querySelectorAll(".listas-container").forEach(ul => ul.innerHTML = "");
    const weights = { "pendente": 0, "nao-iniciada": 1, "andamento": 1, "concluida": 2 };

    const sortedLists = [...allLists].sort((a, b) => {
      const statusA = getListStatus(a);
      const statusB = getListStatus(b);
      if (weights[statusA] !== weights[statusB]) return weights[statusA] - weights[statusB];
      return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
    });

    sortedLists.forEach(list => {
      const status = getListStatus(list);
      if (currentFilter !== "all" && currentFilter !== status) return;
      const ul = document.getElementById(`listasContainer-${list.categoryId}`);
      if (!ul) return;

      const li = document.createElement("li");
      li.className = `list-item-summary ${status}`;
      li.innerHTML = `<span>${list.title}</span><span class="due-date">${formatDueDate(list.dueDate)}</span>`;
      li.onclick = () => openViewListModal(list.id);
      ul.appendChild(li);
    });

    document.querySelectorAll(".listas-container").forEach(ul => {
      if (ul.children.length === 0) {
        const li = document.createElement("li");
        li.className = "list-item-summary";
        li.style.opacity = "0.5";
        li.style.cursor = "default";
        li.innerHTML = `<span style="width:100%; text-align:center;">Ainda não há listas aqui</span>`;
        ul.appendChild(li);
      }
    });
    renderTopWidgets();
  };

const renderTopWidgets = () => {
    const totalEl = document.getElementById("totalListas");
    if (totalEl) totalEl.textContent = allLists.length;
    const ids = ["listasAndamento", "listasNaoIniciadas", "listasConcluidas", "proximaslistas", "listasPendentes"];
    const uls = {};
    ids.forEach(id => {
      uls[id] = document.getElementById(id);
      if (uls[id]) uls[id].innerHTML = "";
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // CRIAMOS UMA CÓPIA ORDENADA ALFABETICAMENTE PELO TÍTULO
    const sortedAlphabetically = [...allLists].sort((a, b) => 
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );

    // USAMOS O ARRAY ORDENADO PARA DISTRIBUIR NOS WIDGETS
    sortedAlphabetically.forEach(list => {
      const status = getListStatus(list); 
      const feitos = list.items.filter(i => i.done).length;
      const total = list.items.length;

      const li = document.createElement("li");
      li.className = "summary-item";
      li.textContent = list.title;
      li.onclick = () => openViewListModal(list.id);

      if (status === "concluida") {
        if (uls.listasConcluidas) uls.listasConcluidas.appendChild(li);
      } else {
        // Aparece em ANDAMENTO se tiver pelo menos 1 item feito
        if (feitos > 0 && uls.listasAndamento) {
          const andamentoLi = li.cloneNode(true);
          andamentoLi.onclick = () => openViewListModal(list.id);
          uls.listasAndamento.appendChild(andamentoLi);
        }
        // Aparece em PENDENTE se a data venceu
        if (status === "pendente" && uls.listasPendentes) {
          const pendenteLi = li.cloneNode(true);
          pendenteLi.onclick = () => openViewListModal(list.id);
          uls.listasPendentes.appendChild(pendenteLi);
        }
        // Aparece em NÃO INICIADA
        if (feitos === 0 && status !== "pendente" && uls.listasNaoIniciadas) {
          uls.listasNaoIniciadas.appendChild(li);
        }
      }

      // Widget Próximos 7 dias
      if (list.dueDate && status !== "concluida" && status !== "pendente") {
        const due = new Date(list.dueDate + "T00:00:00");
        if (due >= today && due <= nextWeek) {
          const proxyLi = li.cloneNode(true);
          proxyLi.onclick = () => openViewListModal(list.id);
          const diff = Math.ceil((due - today) / 86400000);
          proxyLi.textContent = `${list.title} (${diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : diff + ' dias'})`;
          if (uls.proximaslistas) uls.proximaslistas.appendChild(proxyLi);
        }
      }
    });

    // Mensagens de "Vazio"
    ids.forEach(id => {
      if (uls[id] && uls[id].children.length === 0) {
        const emptyLi = document.createElement("li");
        emptyLi.style.opacity = "0.5";
        emptyLi.style.fontSize = "0.85rem";
        emptyLi.style.textAlign = "center";
        emptyLi.style.listStyle = "none";
        emptyLi.textContent = "Vazio";
        uls[id].appendChild(emptyLi);
      }
    });
  };

  /* 5. CATEGORIAS */

  const createCategoryCard = (title, id = `cat-${Date.now()}`) => {
    const card = document.createElement("article");
    card.className = "cardlist";
    card.dataset.categoryId = id;
    const isDefault = id === "default-listas";
    if (isDefault) card.classList.add("default-card");

    card.innerHTML = `
      <h2><i class="fa-solid fa-list-check"></i> ${title}</h2>
      <button class="btn btn-primary add-list-btn">+ Adicionar Lista</button>
      <ul class="listas-container" id="listasContainer-${id}"></ul>
      <div class="category-actions">
          <button class="btn btn-secondary edit-cat-btn" ${isDefault ? 'disabled' : ''}><i class="fas fa-edit"></i> Editar Categoria</button>
          <button class="btn btn-delete delete-cat-btn" ${isDefault ? 'disabled' : ''}><i class="fas fa-trash-alt"></i> Excluir Categoria</button>
      </div>`;

    card.querySelector(".add-list-btn").onclick = (e) => {
        e.stopPropagation();
        openCreateListModal(id);
    };
    
    if (!isDefault) {
      card.querySelector(".delete-cat-btn").onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Excluir categoria "${title}"?`)) {
          allLists = allLists.filter(l => l.categoryId !== id);
          card.remove();
          saveAll();
          renderLists();
        }
      };
      card.querySelector(".edit-cat-btn").onclick = (e) => {
        e.stopPropagation();
        elements.inputs.editCatTitle.value = title;
        elements.modals.editCat.dataset.editingId = id;
        elements.modals.editCat.classList.add("open");
      };
    }
    return card;
  };

  /* 6. MODAIS E EVENTOS */

  const openCreateListModal = (catId) => {
    closeModal();
    elements.modals.createList.dataset.targetCat = catId;
    elements.inputs.createListTitle.value = "";
    elements.inputs.createListDate.value = "";
    elements.containers.createItens.innerHTML = "";
    addItemInput(elements.containers.createItens);
    elements.modals.createList.classList.add("open");
  };

  const openViewListModal = (id) => {
    const listIndex = allLists.findIndex(l => l.id === id);
    const list = allLists[listIndex];
    if (!list) return;

    document.getElementById("viewListTitle").textContent = list.title;
    
    // Exibe a Data no Modal
    const dateEl = document.getElementById("viewListDueDate");
    if (dateEl) dateEl.textContent = formatDueDate(list.dueDate);

    elements.containers.viewListItems.innerHTML = "";
    list.items.forEach((item, i) => {
      const li = document.createElement("li");
      if (item.done) li.classList.add("done");
      const checkboxId = `chk-${id}-${i}`;
      li.innerHTML = `<input type="checkbox" id="${checkboxId}" ${item.done ? 'checked' : ''}><label for="${checkboxId}">${item.name}</label>`;

      li.querySelector("input").onchange = (e) => {
        allLists[listIndex].items[i].done = e.target.checked;
        saveAll();
        renderLists();
        if (e.target.checked) li.classList.add("done");
        else li.classList.remove("done");
        updateModalStatus(allLists[listIndex]);
      };
      elements.containers.viewListItems.appendChild(li);
    });

    const updateModalStatus = (currentList) => {
      const status = getListStatus(currentList);
      const statusSpan = document.getElementById("viewListStatus");
      statusSpan.textContent = status.toUpperCase();
      statusSpan.className = status;
      document.getElementById("contadorFeitos").textContent = currentList.items.filter(it => it.done).length;
      document.getElementById("contadorTotal").textContent = currentList.items.length;
    };

    updateModalStatus(list);

    elements.btns.uncheckAll.onclick = () => {
      allLists[listIndex].items.forEach(item => item.done = false);
      saveAll();
      renderLists();
      openViewListModal(id);
    };

    elements.btns.deleteList.onclick = () => {
      if (confirm("Excluir esta lista?")) {
        allLists.splice(listIndex, 1);
        saveAll();
        renderLists();
        closeModal();
      }
    };

    elements.btns.editList.onclick = () => {
      closeModal();
      openEditListModal(id);
    };

    elements.modals.viewList.classList.add("open");
  };

  const openEditListModal = (id) => {
    const listIndex = allLists.findIndex(l => l.id === id);
    const list = allLists[listIndex];
    if (!list) return;

    elements.modals.editList.dataset.editingId = id;
    elements.inputs.editListTitle.value = list.title;
    elements.inputs.editListDate.value = list.dueDate;
    elements.containers.editItens.innerHTML = "";
    list.items.forEach(item => addItemInput(elements.containers.editItens, item.name));
    elements.modals.editList.classList.add("open");
  };

  elements.btns.addEditItem.onclick = () => addItemInput(elements.containers.editItens);

  elements.btns.saveEditList.onclick = () => {
    const id = elements.modals.editList.dataset.editingId;
    const listIndex = allLists.findIndex(l => l.id === id);
    const title = elements.inputs.editListTitle.value.trim();
    const items = [...elements.containers.editItens.querySelectorAll("input")].map((i, idx) => {
        const wasDone = allLists[listIndex].items[idx] ? allLists[listIndex].items[idx].done : false;
        return { name: i.value.trim(), done: wasDone };
    }).filter(i => i.name);

    if (title && items.length) {
      allLists[listIndex].title = title;
      allLists[listIndex].dueDate = elements.inputs.editListDate.value;
      allLists[listIndex].items = items;
      saveAll();
      renderLists();
      closeModal();
    }
  };

  if (elements.btns.addListGlobal) {
    elements.btns.addListGlobal.onclick = () => openCreateListModal("default-listas");
  }

  elements.btns.saveCreateList.onclick = () => {
    const title = elements.inputs.createListTitle.value.trim();
    const items = [...elements.containers.createItens.querySelectorAll("input")].map(i => ({ name: i.value.trim(), done: false })).filter(i => i.name);
    if (title && items.length) {
      allLists.push({
        id: `list-${Date.now()}`,
        title,
        dueDate: elements.inputs.createListDate.value,
        categoryId: elements.modals.createList.dataset.targetCat || "default-listas",
        items
      });
      saveAll();
      renderLists();
      closeModal();
    }
  };

  elements.btns.saveCreateCat.onclick = () => {
    const title = elements.inputs.createCatTitle.value.trim();
    if (title) {
      saveAll();
      const savedCats = JSON.parse(localStorage.getItem("diaryAppCategories") || "[]");
      savedCats.push({ id: `cat-${Date.now()}`, title });
      localStorage.setItem("diaryAppCategories", JSON.stringify(savedCats));
      init(); 
      closeModal();
    }
  };

  elements.btns.saveEditCat.onclick = () => {
    const editingId = elements.modals.editCat.dataset.editingId;
    const newTitle = elements.inputs.editCatTitle.value.trim();
    if (newTitle) {
      const savedCats = JSON.parse(localStorage.getItem("diaryAppCategories") || "[]");
      const catIdx = savedCats.findIndex(c => c.id === editingId);
      if (catIdx !== -1) savedCats[catIdx].title = newTitle;
      localStorage.setItem("diaryAppCategories", JSON.stringify(savedCats));
      init();
      closeModal();
    }
  };

  elements.btns.addCat.onclick = () => {
    elements.inputs.createCatTitle.value = "";
    elements.modals.createCat.classList.add("open");
  };

  elements.btns.addItem.onclick = () => addItemInput(elements.containers.createItens);
  document.querySelectorAll("[id^='close']").forEach(btn => btn.onclick = closeModal);

  const init = () => {
    const savedLists = localStorage.getItem("diaryAppLists");
    if (savedLists) allLists = JSON.parse(savedLists);
    const savedCats = localStorage.getItem("diaryAppCategories");
    elements.containers.customLists.innerHTML = "";
    if (savedCats) {
      const cats = JSON.parse(savedCats).sort((a,b) => a.title.localeCompare(b.title));
      cats.forEach(c => elements.containers.customLists.appendChild(createCategoryCard(c.title, c.id)));
    }
    renderLists();
  };

  init();
});