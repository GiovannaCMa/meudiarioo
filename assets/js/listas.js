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
  /* 1. VARIÁVEIS */
  const createCatModal = document.getElementById("createCatModal");
  const editCatModal = document.getElementById("editCatModal");
  const createListModal = document.getElementById("createListModal");
  const viewListModal = document.getElementById("viewListModal");
  const editListModal = document.getElementById("editListModal");

  const addCatBtn = document.getElementById("addCatBtn");
  const closeCreateCatModalBtn = document.getElementById(
    "closeCreateCatModalBtn"
  );
  const saveCreateCatBtn = document.getElementById("saveCreateCatBtn");
  const createCatTitleInput = document.getElementById("createCatTitle");

  const closeEditCatModalBtn = document.getElementById("closeEditCatModalBtn");
  const saveEditCatBtn = document.getElementById("saveEditCatBtn");
  const editCatTitleInput = document.getElementById("editCatTitle");

  const closeCreateListModalBtn = document.getElementById(
    "closeCreateListModalBtn"
  );
  const saveCreateListBtn = document.getElementById("saveCreateListBtn");
  const addItemBtn = document.getElementById("addItemBtn");
  const createItensWrapper = document.getElementById("itensWrapper");

  const editListTitleInput = document.getElementById("editListTitle");
  const editListDueDateInput = document.getElementById("editListDueDate");
  const editItensWrapper = document.getElementById("editItensWrapper");
  const addEditItemBtn = document.getElementById("addEditItemBtn");
  const saveEditListBtn = document.getElementById("saveEditListBtn");
  const closeEditListModalBtn = document.getElementById(
    "closeEditListModalBtn"
  );

  const defaultCard = document.querySelector(
    '.cardlist[data-category-id="default-listas"]'
  );
  const customListsContainer = document.getElementById("customListsContainer");

  // Botões globais
  // 🛑 EDITCATBTNGlobal e DELETECATBTNGlobal REMOVIDOS para usar botões do próprio card
  const addListBtnGlobal = document.getElementById("addListBtn");

  // Elementos do modal de visualização
  const viewListItemsUl = document.getElementById("viewListItems");
  const viewListStatusSpan = document.getElementById("viewListStatus");
  const editListBtn = document.getElementById("editListBtn");
  const uncheckAllBtn = document.getElementById("uncheckAllBtn");
  const deleteListBtn = document.getElementById("deleteListBtn");
  const contadorFeitosSpan = document.getElementById("contadorFeitos");
  const contadorTotalSpan = document.getElementById("contadorTotal");
  const viewListTitle = document.getElementById("viewListTitle");

  let activeCategoryCard = null;
  let allLists = [];
  let currentViewListId = null;
  let currentEditListId = null;
  let currentFilter = "all";

  /* 2. UTILITÁRIOS */
  
  // Status: "pendente" SÓ se atrasada, senão "nao-iniciada" ou "andamento"
  const getListStatus = (list) => {
    const { items, dueDate } = list;
    
    // Status padrão para listas vazias ou novas
    if (!items || items.length === 0) return "nao-iniciada"; 

    const total = items.length;
    const feitos = items.filter((i) => i.done).length;

    if (feitos === total) return "concluida";

    // Verifica a data limite APENAS se não estiver concluída
    if (dueDate) {
      const dueDateTime = Date.parse(dueDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const todayTime = today.getTime();

      // REGRA: "pendente" SÓ SE ultrapassou a data limite
      if (dueDateTime < todayTime) {
        return "pendente"; // Incompleta E atrasada
      }
    }

    // Não concluída e não vencida
    if (feitos === 0) return "nao-iniciada"; // Não iniciada, não atrasada
    return "andamento"; // Em andamento, não atrasada
  };


  const formatDueDate = (date) => {
    if (!date) return "Sem data limite";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };
  
  // Helper para calcular dias restantes
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const dueDate = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays > 0) return `${diffDays} dias`;
    return null; 
  };

  // FUNÇÃO PARA ADICIONAR ITEM (com ícone de lixeira)
  const addItemInput = (wrapper, initialValue = "") => {
    const div = document.createElement("div");
    div.className = "item-input-group"; // ESSA CLASSE PRECISA DE CSS display:flex
    div.innerHTML = `
            <input type="text" placeholder="Nome do Item" value="${initialValue}">
            <button type="button" class="remove-item-btn icon-action">
                <i class="fas fa-trash-alt"></i> 
            </button>
        `;
    div.querySelector(".remove-item-btn").onclick = () => div.remove();
    wrapper.appendChild(div);
  };

  // Array de todos os modais para fechar facilmente
  const allModals = [
    createCatModal,
    editCatModal,
    createListModal,
    viewListModal,
    editListModal,
  ];

  // Fecha todos os modais
  const closeModal = () =>
    allModals.forEach((modal) => modal.classList.remove("open"));

  /* 3. LOCAL STORAGE */
  const saveListsToLocalStorage = () => {
    localStorage.setItem("diaryAppLists", JSON.stringify(allLists));
    localStorage.setItem(
      "diaryAppCategories",
      JSON.stringify(getExistingCategories())
    );
  };

  const loadListsFromLocalStorage = () => {
    const data = localStorage.getItem("diaryAppLists");
    if (data) allLists = JSON.parse(data);
  };

  const getExistingCategories = () => {
    if (!customListsContainer) return [];
    return [
      ...customListsContainer.querySelectorAll(".cardlist:not(.default-card)"),
    ].map((card) => {
      const h2 = card.querySelector("h2");
      const text = h2.textContent.replace(/^\S+\s/, "").trim();
      return {
        id: card.dataset.categoryId,
        title: text,
      };
    });
  };

  const restoreCategories = () => {
    const data = localStorage.getItem("diaryAppCategories");
    if (!data || !customListsContainer) return;

    customListsContainer.innerHTML = "";

    JSON.parse(data).forEach((cat) => {
      const card = createCategoryCard(cat.title, cat.id);
      customListsContainer.appendChild(card);
    });
  };

  /* 4. RENDERIZAÇÃO GERAL */

  const renderLists = () => {
    // 1. Limpa todos os containers de listas DENTRO dos cards de categoria
    document
      .querySelectorAll(".listas-container")
      .forEach((ul) => (ul.innerHTML = ""));

    // 2. Prepara e ordena todas as listas (ORDENADA PRIMEIRO POR DATA, DEPOIS POR TÍTULO)
    let listsToRender = allLists
        .slice() 
        .sort((a, b) => {
            // Prioridade 1: Data ascendente (Datas válidas primeiro, 'Sem data' por último)
            const dateA = a.dueDate ? Date.parse(a.dueDate + "T00:00:00") : Infinity;
            const dateB = b.dueDate ? Date.parse(b.dueDate + "T00:00:00") : Infinity;

            if (dateA !== dateB) {
                return dateA - dateB;
            }
            
            // Prioridade 2: Título alfabético
            return a.title.localeCompare(b.title, 'pt', { sensitivity: 'base' });
        });


    listsToRender.forEach((list) => {
      const status = getListStatus(list);
      
      // Renderiza a lista se o filtro for "all" OU se o status for o filtro
      const shouldRender = currentFilter === "all" || currentFilter === status;

      if (!shouldRender) return; // Filtro por status
      
      const ul = document.getElementById(`listasContainer-${list.categoryId}`);
      if (!ul) return; 

      const li = document.createElement("li");
      li.className = `list-item-summary ${status}`;
      // Exibe o título e a data
      li.innerHTML = `
                <span>${list.title}</span>
                <span class="due-date">${formatDueDate(list.dueDate)}</span>
            `;
      li.addEventListener("click", () => openViewListModal(list.id));
      ul.appendChild(li);
    });
    renderTopWidgets();
  };

  /* 4.1. RENDERIZAÇÃO DOS WIDGETS */

  const createSummaryLi = (list) => {
    const li = document.createElement("li");
    li.textContent = list.title;
    li.className = "summary-item";
    li.onclick = () => openViewListModal(list.id);
    return li;
  };

  const renderTopWidgets = () => {
    // 1. Contagem Total
    document.getElementById("totalListas").textContent = allLists.length;

    // 2. Elementos de Listas por Status
    const listasAndamentoUl = document.getElementById("listasAndamento");
    const listasNaoIniciadasUl = document.getElementById("listasNaoIniciadas") || document.createElement('ul'); 
    listasNaoIniciadasUl.id = "listasNaoIniciadas";
    const listasConcluidasUl = document.getElementById("listasConcluidas");
    const proximaslistasUl = document.getElementById("proximaslistas");
    const listasPendentesUl = document.getElementById("listasPendentes"); 

    // Limpa as listas
    [
      listasAndamentoUl,
      listasNaoIniciadasUl, 
      listasConcluidasUl,
      proximaslistasUl,
      listasPendentesUl,
    ].forEach((ul) => {
      if (ul) ul.innerHTML = "";
    });

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    today.setHours(0, 0, 0, 0);

    // Prepare lists for 'Próximos 7 Dias' widget (Ordenação por data)
    const proximasListas = allLists
        .filter(list => list.dueDate)
        .map(list => ({ ...list, dueDateObj: new Date(list.dueDate + "T00:00:00") }))
        .filter(list => {
            const status = getListStatus(list);
            // Só mostra se não estiver concluída ou pendente (atrasada)
            const notDoneOrOverdue = status !== "concluida" && status !== "pendente"; 
            
            return list.dueDateObj >= today && list.dueDateObj <= sevenDaysFromNow && notDoneOrOverdue;
        })
        .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime()); // Ordem crescente de data


    proximasListas.forEach(list => {
        const daysLeft = getDaysRemaining(list.dueDate);
        const li = createSummaryLi(list);
        // Implementação do contador de dias
        li.textContent = `${list.title} (${daysLeft})`; 
        proximaslistasUl.appendChild(li);
    });
    
    // Filter by Status (Other widgets)
    allLists.forEach((list) => {
        const status = getListStatus(list);
        let targetUl = null;

        if (status === "andamento") {
            targetUl = listasAndamentoUl;
        } else if (status === "nao-iniciada") { 
            targetUl = listasNaoIniciadasUl;
        } else if (status === "concluida") {
            targetUl = listasConcluidasUl;
        } else if (status === "pendente") { 
            targetUl = listasPendentesUl;
        }

        if (targetUl && targetUl.id !== "proximaslistas") {
            const li = createSummaryLi(list);
            targetUl.appendChild(li);
        }
    });
  };

  /* 5. CATEGORIAS */

  const setActiveCategory = (card) => {
    if (activeCategoryCard) activeCategoryCard.classList.remove("active");
    activeCategoryCard = card;
    card.classList.add("active");

    const isDefault = card.dataset.categoryId === "default-listas";
    // 🛑 Os botões globais de Categoria (edit/delete) foram removidos.
    // O addListBtnGlobal continua para criar listas na categoria ativa.
    addListBtnGlobal.disabled = false;
  };

  const createCategoryCard = (title, id = `cat-${Date.now()}`) => {
    const card = document.createElement("article");
    card.className = "cardlist";
    card.dataset.categoryId = id;

    if (id === "default-listas") {
      card.classList.add("default-card");
    }

    const isDisabled = id === "default-listas" ? "disabled" : "";

    // Estrutura replicada do seu exemplo
    card.innerHTML = `
            <h2><i class="fa-solid fa-list-check"></i> ${title}</h2>

            <button class="btn btn-primary add-list-btn">
                + Adicionar Lista
            </button>

            <ul class="listas-container" id="listasContainer-${id}"></ul>

            <div class="category-actions">
                <button class="btn btn-secondary edit-cat-btn" ${isDisabled}>
                    <i class="fas fa-edit"></i> Editar Categoria
                </button>

                <button class="btn btn-delete delete-cat-btn" ${isDisabled}>
                    <i class="fas fa-trash-alt"></i> Excluir Categoria
                </button>
            </div>
        `;

    card.addEventListener("click", (e) => {
      // Ativa a categoria se o clique não for em um botão de ação
      if (!e.target.closest("button")) setActiveCategory(card);
    });

    card.querySelector(".add-list-btn").onclick = (e) => {
      e.stopPropagation();
      setActiveCategory(card);
      openCreateListModal();
    };

    const deleteBtn = card.querySelector(".delete-cat-btn");
    if (deleteBtn && id !== "default-listas") {
      // 🛑 Ação de exclusão LOCAL
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const categoryTitle = card.querySelector("h2").textContent.replace(/^\S+\s/, "").trim();
        if (
          confirm(
            `Tem certeza que deseja excluir a categoria "${categoryTitle}"? TODAS as listas contidas nela serão PERMANENTEMENTE excluídas.`
          )
        ) {
          deleteCategory(id);
        }
      };
    }

    const editBtn = card.querySelector(".edit-cat-btn");
    if (editBtn && id !== "default-listas") {
      // 🛑 Ação de edição LOCAL
      editBtn.onclick = (e) => {
        e.stopPropagation();
        const categoryTitle = card.querySelector("h2").textContent.replace(/^\S+\s/, "").trim();
        openEditCatModal(id, categoryTitle);
      };
    }

    return card;
  };

  // IMPLEMENTAÇÃO: EXCLUSÃO EM CASCATA
  const deleteCategory = (id) => {
    // Filtra e mantém apenas as listas que NÃO PERTENCEM ao ID excluído (exclusão em cascata)
    allLists = allLists.filter((l) => l.categoryId !== id);
    
    const cardToRemove = document.querySelector(`.cardlist[data-category-id="${id}"]`);
    if (cardToRemove) {
        cardToRemove.remove();
    }
    
    // Se a categoria excluída era a ativa, volta para a padrão
    if (activeCategoryCard && activeCategoryCard.dataset.categoryId === id) {
        setActiveCategory(defaultCard);
    }
    
    saveListsToLocalStorage();
    renderLists();
  };

  // Novo: Abre o modal de criação de categoria
  addCatBtn.addEventListener("click", () => {
    createCatTitleInput.value = "";
    createCatModal.classList.add("open");
  });

  // Novo: Salva a nova categoria
  saveCreateCatBtn.addEventListener("click", () => {
    const title = createCatTitleInput.value.trim();
    if (!title) {
      alert("O título da categoria é obrigatório.");
      return;
    }
    const newCard = createCategoryCard(title);
    customListsContainer.appendChild(newCard);
    setActiveCategory(newCard);
    closeModal();
    saveListsToLocalStorage();
  });

  // Novo: Abre o modal de edição de categoria
  const openEditCatModal = (id, title) => {
    editCatTitleInput.value = title;
    editCatModal.dataset.editingId = id; // Guarda o ID do card
    editCatModal.classList.add("open");
  };

  // Novo: Salva a edição da categoria
  saveEditCatBtn.addEventListener("click", () => {
    const editingId = editCatModal.dataset.editingId; // Busca o ID guardado
    const newTitle = editCatTitleInput.value.trim();

    if (!newTitle) {
      alert("O título da categoria é obrigatório.");
      return;
    }

    // Busca o card pelo ID, garantindo que a edição é isolada
    const cardToEdit = document.querySelector(`.cardlist[data-category-id="${editingId}"]`);
    
    if (cardToEdit) {
        const titleElement = cardToEdit.querySelector("h2");
        titleElement.innerHTML = `<i class="fa-solid fa-list-check"></i> ${newTitle}`;
    }

    closeModal();
    saveListsToLocalStorage();
  });

  // Eventos de Modais Gerais
  [
    closeCreateCatModalBtn,
    closeEditCatModalBtn,
    closeCreateListModalBtn,
    closeEditListModalBtn,
    document.getElementById("closeViewListModalBtn"),
  ].forEach((btn) => {
    if (btn) btn.addEventListener("click", closeModal);
  });

  // 🛑 REMOVIDOS os listeners para editCatBtnGlobal e deleteCatBtnGlobal

  addListBtnGlobal.addEventListener("click", () => {
    if (!activeCategoryCard) setActiveCategory(defaultCard);
    openCreateListModal();
  });

  /* 6. CRIAÇÃO DE LISTAS */

  const openCreateListModal = () => {
    closeModal();
    document.getElementById("createListTitle").value = "";
    document.getElementById("createListDueDate").value = "";
    createItensWrapper.innerHTML = "";
    addItemInput(createItensWrapper);
    createListModal.classList.add("open");
  };

  addItemBtn.addEventListener("click", () => addItemInput(createItensWrapper));

  saveCreateListBtn.addEventListener("click", () => {
    const title = document.getElementById("createListTitle").value.trim();
    const dueDate = document.getElementById("createListDueDate").value;
    const items = [...document.querySelectorAll("#itensWrapper input")]
      .map((i) => ({ name: i.value.trim(), done: false }))
      .filter((i) => i.name);

    if (!title || !items.length) {
      alert("Título e pelo menos um item são obrigatórios");
      return;
    }

    if (!activeCategoryCard) setActiveCategory(defaultCard);

    allLists.push({
      id: `list-${Date.now()}`,
      title,
      dueDate,
      categoryId: activeCategoryCard.dataset.categoryId,
      items,
    });

    closeModal();
    saveListsToLocalStorage();
    renderLists();
  });

  /* 7. VISUALIZAÇÃO DE LISTAS */

  const openViewListModal = (id) => {
    closeModal();
    const list = allLists.find((l) => l.id === id);
    if (!list) return;

    currentViewListId = id;
    viewListTitle.textContent = list.title;
    document.getElementById("viewListDueDateDisplay").textContent =
      formatDueDate(list.dueDate);

    // 1. Atualiza o status geral do modal
    const status = getListStatus(list); 
    viewListStatusSpan.className = status;
    viewListStatusSpan.textContent = status.toUpperCase().replace('-', ' ');

    viewListItemsUl.innerHTML = "";

    list.items.forEach((item, i) => {
      const li = document.createElement("li");

      // Adiciona a classe 'done' ao <li> se o item estiver concluído
      if (item.done) {
        li.classList.add("done");
      }

      li.innerHTML = `
                <input type="checkbox" id="viewItem-${id}-${i}" ${
        item.done ? "checked" : ""
      }>
                <label for="viewItem-${id}-${i}">${item.name}</label>
            `;
      
      li.querySelector("input").onchange = () => {
        const listToUpdate = allLists.find((l) => l.id === id);
        if (listToUpdate) {
          listToUpdate.items[i].done = !listToUpdate.items[i].done;
          saveListsToLocalStorage();

          // Atualiza a classe no <li> e o status/contador imediatamente
          if (listToUpdate.items[i].done) {
            li.classList.add("done");
          } else {
            li.classList.remove("done");
          }

          // Atualiza os contadores
          const feitos = listToUpdate.items.filter((i) => i.done).length;
          contadorFeitosSpan.textContent = feitos;
          
          // Atualiza o status geral do modal 
          const newStatus = getListStatus(listToUpdate); 
          viewListStatusSpan.className = newStatus;
          viewListStatusSpan.textContent = newStatus.toUpperCase().replace('-', ' ');
          
          renderLists(); 
        }
      };
      viewListItemsUl.appendChild(li);
    });

    contadorFeitosSpan.textContent = list.items.filter((i) => i.done).length;
    contadorTotalSpan.textContent = list.items.length;

    viewListModal.classList.add("open");
  };

  // Eventos do Modal de Visualização
  editListBtn.addEventListener("click", () => {
    if (currentViewListId) openEditListModal(currentViewListId);
  });

  uncheckAllBtn.addEventListener("click", () => {
    const list = allLists.find((l) => l.id === currentViewListId);
    if (list) {
      list.items.forEach((item) => (item.done = false));
      saveListsToLocalStorage();
      
      // Atualiza o DOM e os contadores sem recarregar o modal
      const listElements = viewListItemsUl.querySelectorAll('li');
      listElements.forEach(li => {
          li.classList.remove('done');
          li.querySelector('input[type="checkbox"]').checked = false;
      });

      // Atualiza contadores e status do modal
      contadorFeitosSpan.textContent = 0;
      const newStatus = getListStatus(list); 
      viewListStatusSpan.className = newStatus;
      viewListStatusSpan.textContent = newStatus.toUpperCase().replace('-', ' ');

      renderLists();
    }
  });

  deleteListBtn.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja excluir esta lista?")) {
      allLists = allLists.filter((l) => l.id !== currentViewListId);
      closeModal();
      saveListsToLocalStorage();
      renderLists();
    }
  });

  /* 8. EDIÇÃO DE LISTAS */

  const openEditListModal = (id) => {
    closeModal();
    const list = allLists.find((l) => l.id === id);
    if (!list) return;

    currentEditListId = id;
    editListTitleInput.value = list.title;
    editListDueDateInput.value = list.dueDate;
    editItensWrapper.innerHTML = "";

    // Os itens no modal de edição são apenas para o nome, não para o status `done`.
    list.items.forEach((item) => addItemInput(editItensWrapper, item.name));

    if (list.items.length === 0) addItemInput(editItensWrapper);

    editListModal.classList.add("open");
  };

  addEditItemBtn.addEventListener("click", () =>
    addItemInput(editItensWrapper)
  );

  saveEditListBtn.addEventListener("click", () => {
    const listIndex = allLists.findIndex((l) => l.id === currentEditListId);
    if (listIndex === -1) return;

    const title = editListTitleInput.value.trim();
    const dueDate = editListDueDateInput.value;

    // Pega o array de itens existente para preservar o status 'done'
    const existingItems = allLists[listIndex].items;

    const newItems = [...document.querySelectorAll("#editItensWrapper .item-input-group input")]
      .map((i) => {
        const name = i.value.trim();
        // Preserva o status 'done' se um item com o mesmo nome existir
        const existingItem = existingItems.find(
          (item) => item.name === name
        );
        return {
          name: name,
          // Se o nome for igual a um existente, usa o status 'done' dele. Senão, é 'false'.
          done: existingItem ? existingItem.done : false, 
        };
      })
      .filter((i) => i.name);

    if (!title || !newItems.length) {
      alert("Título e pelo menos um item são obrigatórios");
      return;
    }

    allLists[listIndex] = {
      ...allLists[listIndex],
      title,
      dueDate,
      items: newItems,
    };

    closeModal();
    saveListsToLocalStorage();
    renderLists();
  });

  /* 9. INICIALIZAÇÃO */ 

  loadListsFromLocalStorage();
  restoreCategories();

  if (defaultCard) {
    if (!defaultCard.classList.contains("default-card")) {
      defaultCard.classList.add("default-card");
    }
    defaultCard.dataset.categoryId = "default-listas";
    const editBtn = defaultCard.querySelector(".edit-cat-btn");
    const deleteBtn = defaultCard.querySelector(".delete-cat-btn");
    if (editBtn) editBtn.disabled = true;
    if (deleteBtn) deleteBtn.disabled = true;
  }

  // Inicializa a lista de exemplo se estiver vazia
  if (!localStorage.getItem("diaryAppLists") || allLists.length === 0) {
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7); // Exemplo 'Próximos 7 Dias'
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1); // Exemplo 'Pendente' (atrasada)
    
    const nextWeekDate = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
    const yesterdayDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    // Esta lista será 'nao-iniciada'
    allLists.push({
      id: "demo-sem-data",
      title: "C - Lista Sem Data Limite",
      dueDate: "",
      categoryId: "default-listas",
      items: [
        { name: "Item Pendente Sem Data", done: false },
      ],
    });
    
    allLists.push({
      id: "demo-prox-semana",
      title: "B - Lista para Próxima Semana",
      dueDate: nextWeekDate,
      categoryId: "default-listas",
      items: [{ name: "Precisa ser feita", done: false }], // Status será 'nao-iniciada'
    });

    allLists.push({
      id: "demo-atrasada",
      title: "A - Lista Atrasada",
      dueDate: yesterdayDate,
      categoryId: "default-listas",
      items: [{ name: "Precisa ser feita", done: false }], // Status será 'pendente'
    });
    
    saveListsToLocalStorage();
  }

  if (defaultCard) setActiveCategory(defaultCard);
  renderLists();
});