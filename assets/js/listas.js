// ... (Seção 1: LÓGICA DO MENU LATERAL - Sem Alterações) ...

(function () {
    const btn = document.getElementById("toggleMenu");
    const aside = document.querySelector("aside");

    if (!btn || !aside) return;

    btn.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        aside.classList.toggle("menu-open");
    });

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

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            aside.classList.remove("menu-open");
        }
    });

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

// =========================================================
// 2. LÓGICA PRINCIPAL (CATEGORIAS -> LISTAS -> ITENS)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Variáveis do DOM e de Estado
    // ----------------------------------------------------------------------

    // Modais
    const createCatModal = document.getElementById('createCatModal');
    const editCatModal = document.getElementById('editCatModal'); 
    const createListModal = document.getElementById('createListModal');
    const viewListModal = document.getElementById('viewListModal');
    const editListModal = document.getElementById('editListModal');
    
    // Botões e Inputs de Categoria
    const addCatBtn = document.getElementById('addCatBtn');
    const closeCreateCatModalBtn = document.getElementById('closeCreateCatModalBtn');
    const saveCreateCatBtn = document.getElementById('saveCreateCatBtn');
    const createCatTitleInput = document.getElementById('createCatTitle');
    
    // Botões e Inputs do Modal de Edição de Categoria
    const closeEditCatModalBtn = document.getElementById('closeEditCatModalBtn'); 
    const saveEditCatBtn = document.getElementById('saveEditCatBtn');          
    const editCatTitleInput = document.getElementById('editCatTitle');         
    
    // Botões de Lista
    const closeCreateListModalBtn = document.getElementById('closeCreateListModalBtn');
    const saveCreateListBtn = document.getElementById('saveCreateListBtn');
    const addItemBtn = document.getElementById('addItemBtn');

    // Botões e Inputs do Modal de Edição de Lista
    const editListTitleInput = document.getElementById('editListTitle');
    const editListDueDateInput = document.getElementById('editListDueDate');
    const editItensWrapper = document.getElementById('editItensWrapper');
    const addEditItemBtn = document.getElementById('addEditItemBtn');
    const saveEditListBtn = document.getElementById('saveEditListBtn'); 
    const closeEditListModalBtn = document.getElementById('closeEditListModalBtn'); 

    // Elementos de Conteúdo
    const listasContainerPrincipal = document.querySelector('.listas-container-principal');
    const defaultCard = document.querySelector('.cardlist');
    
    // Botões de Ação Global (que afetam a categoria ATIVA)
    // CORREÇÃO: Pegamos os botões de ação do primeiro card (.cardlist) para que atuem como globais.
    const editCatBtnGlobal = defaultCard ? defaultCard.querySelector('.edit-cat-btn') : null; 
    const deleteCatBtnGlobal = defaultCard ? defaultCard.querySelector('.delete-cat-btn') : null;
    const addListBtnGlobal = document.getElementById('addListBtn'); // Este tem ID no HTML e está correto

    // Variáveis de Dados e Estado
    let activeCategoryCard = null;
    let allLists = []; 
    let currentViewListId = null;
    let currentEditListId = null;

    // ----------------------------------------------------------------------
    // 2. Funções de Utilitários
    // ----------------------------------------------------------------------
    
    /**
     * Define o status da lista (pendente, andamento, concluida).
     */
    const getListStatus = (items) => {
        if (!items || items.length === 0) return 'pendente'; 
        
        const totalItems = items.length;
        const doneItems = items.filter(item => item.done).length;

        if (doneItems === 0) return 'pendente';
        if (doneItems === totalItems) return 'concluida';
        return 'andamento';
    };

    /**
     * Formata a data de string yyyy-mm-dd para dd/mm/yyyy.
     */
    const formatDueDate = (dateString) => {
        if (!dateString) return 'Sem data limite';
        try {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        } catch {
            return dateString; // Retorna o original em caso de erro de formato
        }
    };

    /**
     * Função genérica para fechar modais e lidar com cliques externos.
     */
    const setupCloseModal = (modalElement) => {
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                modalElement.classList.remove('open');
            }
        });
    };

    // Configura o fechamento de modais com cliques externos
    [createCatModal, editCatModal, createListModal, viewListModal, editListModal].forEach(modal => {
        if (modal) setupCloseModal(modal);
    });

    // Configura o fechamento com botões Cancelar/Fechar (para os que têm IDs)
    if (document.getElementById('closeViewListModalBtn')) document.getElementById('closeViewListModalBtn').addEventListener('click', () => viewListModal.classList.remove('open'));


    // ----------------------------------------------------------------------
    // 3. FUNÇÕES DE PERSISTÊNCIA (localStorage)
    // ----------------------------------------------------------------------

    /**
     * Salva o array allLists no localStorage.
     */
    const saveListsToLocalStorage = () => {
        try {
            localStorage.setItem('diaryAppLists', JSON.stringify(allLists));
            // Salvamos as categorias para restaurá-las
            localStorage.setItem('diaryAppCategories', JSON.stringify(getExistingCategories()));
        } catch (e) {
            console.error("Erro ao salvar no localStorage:", e);
        }
    };

    /**
     * Carrega as listas do localStorage.
     */
    const loadListsFromLocalStorage = () => {
        try {
            const storedLists = localStorage.getItem('diaryAppLists');
            if (storedLists) {
                allLists = JSON.parse(storedLists);
            }
        } catch (e) {
            console.error("Erro ao carregar do localStorage:", e);
            allLists = []; 
        }
    };

    /**
     * Recupera as categorias dinâmicas salvas (título e ID).
     */
    const getExistingCategories = () => {
        // Ignora o cardlist padrão (Minhas Listas)
        const dynamicCards = document.querySelectorAll('.cardlist:not(.default-card)'); 
        return Array.from(dynamicCards).map(card => {
            // O título deve ser limpo para remover ícones (Font Awesome)
            const h2 = card.querySelector('h2');
            const titleNode = h2.childNodes[h2.childNodes.length - 1]; // Pega o último nó, que é o texto
            const title = titleNode ? titleNode.textContent.trim() : h2.textContent.trim();
            
            return {
                id: card.getAttribute('data-category-id'),
                title: title
            };
        });
    };

    /**
     * Recria os cards de categoria dinâmicos ao carregar a página.
     */
    const restoreCategories = () => {
        try {
            const storedCategories = localStorage.getItem('diaryAppCategories');
            if (storedCategories) {
                const categories = JSON.parse(storedCategories);
                categories.forEach(cat => {
                    // Recria o card, mas usa a ID existente
                    const newCard = createCategoryCard(cat.title, cat.id); 
                    listasContainerPrincipal.appendChild(newCard);
                });
            }
        } catch (e) {
            console.error("Erro ao restaurar categorias:", e);
        }
    };


    // ----------------------------------------------------------------------
    // 4. Funções de Renderização e Atualização do Estado Global
    // ----------------------------------------------------------------------

    /**
     * Renderiza todas as listas nos seus respectivos containers e atualiza os widgets de resumo.
     */
    const renderLists = () => {
        let totalCount = 0;
        const resumoContainers = {
            'pendente': document.getElementById('listasPendentes'),
            'andamento': document.getElementById('listasAndamento'),
            'concluida': document.getElementById('listasConcluidas')
        };

        // Limpa os containers de resumo
        Object.values(resumoContainers).forEach(ul => {
            if (ul) ul.innerHTML = '';
        });

        // Limpa todos os containers de listas (padrão e dinâmicos)
        document.querySelectorAll('.listas-container').forEach(ul => {
             if (ul) ul.innerHTML = '';
        });

        allLists.forEach(list => {
            const status = getListStatus(list.items);
            const listId = list.id;
            // Garante que o ID da categoria padrão é 'default-listas' se estiver faltando
            const categoryId = list.categoryId || 'default-listas'; 

            totalCount++;

            // 1. Renderiza no Card da Categoria (listas-container)
            const cardContainer = document.getElementById(`listasContainer-${categoryId}`);
            if (cardContainer) {
                const listItem = document.createElement('li');
                listItem.classList.add('list-item-summary', status);
                listItem.setAttribute('data-list-id', listId);
                listItem.innerHTML = `
                    <span>${list.title}</span>
                    <span class="due-date">${formatDueDate(list.dueDate)}</span>
                `;
                
                listItem.addEventListener('click', () => openViewListModal(listId));

                cardContainer.appendChild(listItem);
            }

            // 2. Renderiza nos Widgets de Resumo
            if (resumoContainers[status]) {
                const resumoItem = document.createElement('li');
                resumoItem.textContent = list.title;
                resumoItem.setAttribute('data-list-id', listId);
                resumoItem.classList.add(status); // Adiciona classe de status para cores nos widgets de resumo

                resumoItem.addEventListener('click', () => openViewListModal(listId));
                
                resumoContainers[status].appendChild(resumoItem);
            }
        });

        // 3. Atualiza o Total de Listas
        if (document.getElementById('totalListas')) {
            document.getElementById('totalListas').textContent = totalCount;
        }

        // 4. Adiciona estado de vazio
        document.querySelectorAll('.listas-container').forEach(ul => {
            if (ul.children.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.classList.add('empty-state');
                emptyState.textContent = 'Nenhuma lista adicionada nesta categoria.';
                ul.appendChild(emptyState);
            }
        });
        
        // Salva os dados após a renderização finalizada
        saveListsToLocalStorage(); 
    };


    // ----------------------------------------------------------------------
    // 5. Lógica de Categoria (Cardlist)
    // ----------------------------------------------------------------------

    /**
     * Função para alternar a categoria ativa (seleção).
     */
    const setActiveCategory = (card) => {
        if (activeCategoryCard) {
            activeCategoryCard.classList.remove('active');
        }

        activeCategoryCard = card;
        activeCategoryCard.classList.add('active');

        const isDefaultCard = card.classList.contains('default-card'); 

        // Atualiza o estado dos botões globais (que estão no defaultCard)
        if (editCatBtnGlobal) editCatBtnGlobal.disabled = isDefaultCard;
        if (deleteCatBtnGlobal) deleteCatBtnGlobal.disabled = isDefaultCard;
    };

    // --- Edição de Categoria ---

    /**
     * Abre o modal de edição de categoria, preenchendo o título.
     */
    const openEditCatModal = () => {
        if (!activeCategoryCard || activeCategoryCard.classList.contains('default-card')) {
            alert('Não é possível editar a categoria padrão.');
            return;
        }

        // Pega o título, ignorando o ícone (o texto fica após o <i>)
        const h2 = activeCategoryCard.querySelector('h2');
        const currentTitleNode = h2.childNodes[h2.childNodes.length - 1];
        const currentTitle = currentTitleNode ? currentTitleNode.textContent.trim() : h2.textContent.trim();
        
        editCatTitleInput.value = currentTitle;
        editCatModal.classList.add('open');
        editCatTitleInput.focus();
    };

    /**
     * Lógica para salvar a edição da categoria ativa.
     */
    const handleEditCategory = () => {
        const newTitle = editCatTitleInput.value.trim();

        if (newTitle && activeCategoryCard) {
            // Preserva o ícone (o <i> é o primeiro child)
            const h2 = activeCategoryCard.querySelector('h2');
            const icon = h2.querySelector('i') ? h2.querySelector('i').outerHTML : '';
            h2.innerHTML = `${icon} ${newTitle}`;
            
            editCatModal.classList.remove('open');
            saveListsToLocalStorage(); 
        } else {
            alert('O título da categoria não pode ser vazio.');
            editCatTitleInput.focus();
        }
    };

    // --- Listeners do Modal de Edição de Categoria ---
    if(closeEditCatModalBtn) closeEditCatModalBtn.addEventListener('click', () => editCatModal.classList.remove('open'));
    if(saveEditCatBtn) saveEditCatBtn.addEventListener('click', handleEditCategory);


    /**
     * Função para criar o HTML de um novo cardlist/categoria.
     * @param {string} title Título da categoria.
     * @param {string | null} existingId ID existente (para restauração) ou null.
     */
    const createCategoryCard = (title, existingId = null) => {
        const newCard = document.createElement('div');
        newCard.classList.add('cardlist');

        const categoryId = existingId || `cat-${Date.now()}`;
        newCard.setAttribute('data-category-id', categoryId);
        
        // Adiciona o ícone de lista ao criar uma nova categoria
        const icon = '<i class="fa-solid fa-list-check"></i>';

        newCard.innerHTML = `
            <h2>${icon} ${title}</h2>
            <button class="btn btn-primary add-list-btn">
                + Adicionar Lista
            </button>
            <ul class="listas-container" id="listasContainer-${categoryId}"></ul>
            <div class="category-actions local-actions">
                <button class="btn btn-secondary edit-cat-btn" data-action="edit"><i class="fas fa-edit"></i> Editar Categoria</button>
                <button class="btn btn-delete delete-cat-btn" data-action="delete"><i class="fas fa-trash-alt"></i> Excluir Categoria</button>
            </div>
        `;

        // Adiciona listener para a seleção do card
        newCard.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            setActiveCategory(newCard);
        });

        // Adiciona listener para o botão de Adicionar Lista
        newCard.querySelector('.add-list-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            setActiveCategory(newCard); 
            openCreateListModal(); 
        });

        // Adiciona listeners para os botões de ação local (Edição/Exclusão)
        newCard.querySelectorAll('.category-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                setActiveCategory(newCard); // **Ação chave: Define o card clicado como ativo**

                if (e.target.closest('[data-action="edit"]')) {
                    openEditCatModal(); 
                } else if (e.target.closest('[data-action="delete"]')) {
                    if (confirm(`Tem certeza que deseja excluir a categoria "${title}"? Todas as listas associadas serão movidas para "Minhas Listas".`)) {
                        
                        const categoryIdToRemove = newCard.getAttribute('data-category-id');

                        // Move as listas associadas para a categoria padrão
                        allLists = allLists.map(list => {
                            if (list.categoryId === categoryIdToRemove) {
                                list.categoryId = 'default-listas';
                            }
                            return list;
                        });
                        
                        newCard.remove();
                        renderLists(); // Renderiza novamente para mostrar as listas realocadas
                        
                        // Reativa o primeiro card (ou o padrão)
                        const firstCard = listasContainerPrincipal.querySelector('.cardlist');
                        if (firstCard) {
                            setActiveCategory(firstCard);
                        } else {
                            activeCategoryCard = null;
                        }
                    }
                }
            });
        });

        return newCard;
    };

    /**
     * Lógica para salvar a nova categoria.
     */
    const handleSaveCategory = () => {
        const title = createCatTitleInput.value.trim();

        if (title) {
            const newCard = createCategoryCard(title); 
            listasContainerPrincipal.appendChild(newCard);
            setActiveCategory(newCard);
            createCatTitleInput.value = '';
            createCatModal.classList.remove('open');
            saveListsToLocalStorage(); 
        } else {
            alert('Por favor, insira um título para a categoria.');
            createCatTitleInput.focus();
        }
    };

    // --- Inicialização da Categoria Padrão e Listeners Globais ---
    if (defaultCard) {
        if (!defaultCard.getAttribute('data-category-id')) {
            defaultCard.setAttribute('data-category-id', 'default-listas');
        }
        defaultCard.classList.add('default-card'); 
        setActiveCategory(defaultCard); // Define o card padrão como ativo ao carregar

        // Listener Global para Adicionar Lista
        if (addListBtnGlobal) {
            addListBtnGlobal.addEventListener('click', (e) => {
                e.stopPropagation();
                // Garante que o card ativo é o padrão ou o último clicado
                if (!activeCategoryCard) setActiveCategory(defaultCard);
                openCreateListModal();
            });
        }
        
        // Listener Global para Editar Categoria (afeta activeCategoryCard)
        if (editCatBtnGlobal) {
            editCatBtnGlobal.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (activeCategoryCard && !activeCategoryCard.classList.contains('default-card')) {
                    openEditCatModal();
                } else {
                    alert('Selecione uma categoria personalizada para editar.');
                }
            });
        }

        // Listener Global para Excluir Categoria (afeta activeCategoryCard)
        if (deleteCatBtnGlobal) {
            deleteCatBtnGlobal.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (activeCategoryCard && !activeCategoryCard.classList.contains('default-card')) {
                    const categoryIdToRemove = activeCategoryCard.getAttribute('data-category-id');
                    // Pega o título, ignorando o ícone
                    const h2 = activeCategoryCard.querySelector('h2');
                    const titleNode = h2.childNodes[h2.childNodes.length - 1];
                    const title = titleNode ? titleNode.textContent.trim() : h2.textContent.trim();


                    if (confirm(`Tem certeza que deseja excluir a categoria "${title}"? Todas as listas associadas serão movidas para "Minhas Listas".`)) {
                        
                        // Move as listas associadas para a categoria padrão
                        allLists = allLists.map(list => {
                            if (list.categoryId === categoryIdToRemove) {
                                list.categoryId = 'default-listas';
                            }
                            return list;
                        });
                        
                        activeCategoryCard.remove();
                        renderLists(); 
                        
                        // Reativa o card padrão
                        const defaultCardAgain = document.querySelector('.cardlist.default-card');
                        if (defaultCardAgain) {
                            setActiveCategory(defaultCardAgain);
                        } else {
                            activeCategoryCard = null;
                        }
                    }
                } else if (activeCategoryCard && activeCategoryCard.classList.contains('default-card')) {
                     alert('A categoria padrão não pode ser excluída.');
                }
            });
        }
        
        // Adiciona listener de seleção ao card padrão
        defaultCard.addEventListener('click', (e) => {
             if (e.target.closest('button')) return;
             setActiveCategory(defaultCard);
        });
        
        // Adiciona listeners de ação local para o card padrão (para que ele funcione como global)
        defaultCard.querySelectorAll('.category-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                // A ação ocorrerá via os Listeners Globais definidos acima
            });
        });
    }

    // --- Listeners do Modal de Criação de Categoria ---
    if (addCatBtn) {
        addCatBtn.addEventListener('click', () => {
            createCatModal.classList.add('open');
            createCatTitleInput.focus();
        });
    }
    if(closeCreateCatModalBtn) closeCreateCatModalBtn.addEventListener('click', () => createCatModal.classList.remove('open'));
    if(saveCreateCatBtn) saveCreateCatBtn.addEventListener('click', handleSaveCategory);


    // ----------------------------------------------------------------------
    // 6. Lógica de Lista (Adicionar, Visualizar, Excluir, Editar)
    // ----------------------------------------------------------------------
    
    /**
     * Abre o modal de criação de lista e reseta os campos.
     */
    const openCreateListModal = () => {
        if (!activeCategoryCard) {
            alert('Selecione uma categoria antes de adicionar uma lista.');
            return;
        }

        document.getElementById('createListTitle').value = '';
        document.getElementById('createListDueDate').value = '';
        document.getElementById('itensWrapper').innerHTML = ''; 
        
        addItemToCreateListModal(); 

        createListModal.classList.add('open');
        document.getElementById('createListTitle').focus();
    };

    /**
     * Cria e adiciona um campo de item à lista no modal de criação.
     */
    const addItemToCreateListModal = (initialValue = '') => {
        const wrapper = document.getElementById('itensWrapper');
        if (!wrapper) return;
        
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item-wrapper'); 
        itemDiv.innerHTML = `
            <input type="text" placeholder="Nome do Item" value="${initialValue}"/>
            <button class="btn-delete-item" type="button"><i class="fas fa-trash-alt"></i></button>
        `;
        
        itemDiv.querySelector('.btn-delete-item').addEventListener('click', () => {
            itemDiv.remove();
        });

        wrapper.appendChild(itemDiv);
    };

    if(addItemBtn) {
        addItemBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            addItemToCreateListModal();
        });
    }
    if(closeCreateListModalBtn) closeCreateListModalBtn.addEventListener('click', () => createListModal.classList.remove('open'));

    // Listener para Salvar Lista
    if(saveCreateListBtn) {
        saveCreateListBtn.addEventListener('click', () => {
            const title = document.getElementById('createListTitle').value.trim();
            const dueDate = document.getElementById('createListDueDate').value;
            
            const itemInputs = Array.from(document.querySelectorAll('#itensWrapper input[type="text"]'));
            const items = itemInputs.map(input => ({
                name: input.value.trim(),
                done: false
            })).filter(item => item.name !== '');
            
            if (!title || items.length === 0) {
                alert('O título e pelo menos um item são obrigatórios.');
                return;
            }

            const newId = `list-${Date.now()}`;
            const newCategory = activeCategoryCard ? activeCategoryCard.getAttribute('data-category-id') : 'default-listas';
            
            const newList = {
                id: newId,
                title: title,
                dueDate: dueDate,
                categoryId: newCategory,
                items: items
            };

            allLists.push(newList);
            
            createListModal.classList.remove('open');
            renderLists(); 
        });
    }

    /**
     * Atualiza a interface do modal de visualização e re-renderiza as listas (para status/resumo).
     */
    const saveAndRefreshView = (listId) => {
        renderLists(); 
        openViewListModal(listId); 
    }

    /**
     * Abre o modal de visualização preenchido com os dados da lista.
     */
    const openViewListModal = (listId) => {
        const list = allLists.find(l => l.id === listId);
        if (!list) return;

        currentViewListId = listId;

        const status = getListStatus(list.items);
        const viewListItemsUl = document.getElementById('viewListItems');
        const viewListStatusSpan = document.getElementById('viewListStatus');
        
        document.getElementById('viewListTitle').textContent = list.title;
        document.getElementById('viewListDueDate').textContent = formatDueDate(list.dueDate);
        
        viewListStatusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        viewListStatusSpan.className = ''; 
        viewListStatusSpan.classList.add(status);
        
        viewListItemsUl.innerHTML = '';
        list.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-item-index', index);
            li.textContent = item.name;
            if (item.done) {
                li.classList.add('done');
            }
            li.addEventListener('click', () => {
                list.items[index].done = !list.items[index].done;
                saveAndRefreshView(listId);
            });
            viewListItemsUl.appendChild(li);
        });

        updateViewModalCounters(list.items);

        viewListModal.classList.add('open');
    };

    /**
     * Atualiza os contadores no modal de visualização.
     */
    const updateViewModalCounters = (items) => {
        const total = items.length;
        const feitos = items.filter(item => item.done).length;
        document.getElementById('contadorFeitos').textContent = feitos;
        document.getElementById('contadorTotal').textContent = total;
    };
    
    // --- Edição de Lista ---

    /**
     * Cria e adiciona um campo de item à lista no modal de EDIÇÃO.
     */
    const addEditItemToModal = (item = { name: '', done: false }) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item-wrapper', 'edit-item'); 
        
        // Mantém o estado original de 'done' no atributo de dados do input
        itemDiv.innerHTML = `
            <input type="text" placeholder="Nome do Item" value="${item.name}" data-item-done="${item.done}"/>
            <button class="btn-delete-item" type="button"><i class="fas fa-trash-alt"></i></button>
        `;
        
        itemDiv.querySelector('.btn-delete-item').addEventListener('click', () => {
            itemDiv.remove();
        });

        if(editItensWrapper) editItensWrapper.appendChild(itemDiv);
    };

    /**
     * Abre o modal de edição de lista, preenchendo os dados da lista atual.
     */
    const openEditListModal = (listId) => {
        const list = allLists.find(l => l.id === listId);
        if (!list || !editItensWrapper) return;

        currentEditListId = listId;
        
        editListTitleInput.value = list.title;
        editListDueDateInput.value = list.dueDate;
        
        editItensWrapper.innerHTML = ''; 
        
        if (list.items.length === 0) {
            addEditItemToModal(); 
        } else {
            list.items.forEach(item => addEditItemToModal(item));
        }

        editListModal.classList.add('open');
        viewListModal.classList.remove('open'); 
    };

    /**
     * Lógica para salvar a edição da lista ativa.
     */
    const handleSaveEditList = () => {
        const list = allLists.find(l => l.id === currentEditListId);
        if (!list) return;

        const newTitle = editListTitleInput.value.trim();
        const newDueDate = editListDueDateInput.value;
        
        const itemInputs = Array.from(document.querySelectorAll('#editItensWrapper .edit-item input[type="text"]'));
        
        // Mapeia os itens, recuperando o estado 'done' original
        const newItems = itemInputs.map(input => {
            const originalDone = input.getAttribute('data-item-done') === 'true'; 
            
            return {
                name: input.value.trim(),
                done: originalDone 
            };
        }).filter(item => item.name !== '');

        if (!newTitle || newItems.length === 0) {
            alert('O título e pelo menos um item são obrigatórios.');
            return;
        }

        list.title = newTitle;
        list.dueDate = newDueDate;
        list.items = newItems; 

        editListModal.classList.remove('open');
        currentEditListId = null;

        // Renderiza e reabre o modal de visualização para ver as mudanças
        renderLists(); 
        openViewListModal(list.id);
    };

    // Listeners do Modal de Edição de Lista
    if(addEditItemBtn) {
        addEditItemBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            addEditItemToModal();
        });
    }
    if(closeEditListModalBtn) closeEditListModalBtn.addEventListener('click', () => editListModal.classList.remove('open'));
    if(saveEditListBtn) saveEditListBtn.addEventListener('click', handleSaveEditList);
    
    // ----------------------------------------------------------------------
    // 7. Listeners dos Botões de Ação na Visualização
    // ----------------------------------------------------------------------

    // Editar Lista
    if (document.getElementById('editListBtn')) {
        document.getElementById('editListBtn').addEventListener('click', () => {
            if (currentViewListId) {
                openEditListModal(currentViewListId);
            }
        });
    }
    
    // Desmarcar tudo
    if (document.getElementById('uncheckAllBtn')) {
        document.getElementById('uncheckAllBtn').addEventListener('click', () => {
            if (!currentViewListId) return;
            const list = allLists.find(l => l.id === currentViewListId);
            if (list) {
                list.items.forEach(item => item.done = false);
                saveAndRefreshView(currentViewListId);
            }
        });
    }

    // Excluir Lista
    if (document.getElementById('deleteListBtn')) {
        document.getElementById('deleteListBtn').addEventListener('click', () => {
            if (!currentViewListId) return;

            const list = allLists.find(l => l.id === currentViewListId);
            if (!list) return;

            if (confirm(`Tem certeza que deseja excluir a lista "${list.title}"?`)) {
                allLists = allLists.filter(l => l.id !== currentViewListId);
                
                viewListModal.classList.remove('open');
                currentViewListId = null;

                renderLists();
            }
        });
    }

    // ----------------------------------------------------------------------
    // 8. Inicialização e Carregamento de Dados
    // ----------------------------------------------------------------------
    
    // Toggle para esconder/mostrar a sidebar
    const toggleMenuBtn = document.getElementById('toggleMenu');
    const aside = document.querySelector('aside');
    if (toggleMenuBtn && aside) {
        toggleMenuBtn.addEventListener('click', () => {
            aside.classList.toggle('hidden');
        });
    }

    loadListsFromLocalStorage(); 
    restoreCategories();        
    
    // 3. Inicializa com dados de exemplo se o array estiver vazio
    if (allLists.length === 0) {
        console.log("Inicializando com listas de exemplo...");
        allLists.push({
            id: 'list-exemplo-1',
            title: 'Lista de Compras da Semana',
            dueDate: '2025-12-20',
            categoryId: 'default-listas',
            items: [
                { name: 'Pão Integral', done: false }, 
                { name: 'Leite', done: false },
                { name: 'Ovos', done: false },
                { name: 'Frutas (Maçã e Banana)', done: false }, 
                { name: 'Queijo', done: true }, 
                { name: 'Chocolate', done: true }, 
                { name: 'Vinho', done: false }, 
            ]
        });
        
        allLists.push({
            id: 'list-exemplo-2',
            title: 'Livros para Ler',
            dueDate: '2026-03-01',
            categoryId: 'default-listas',
            items: [
                { name: 'O Hobbit', done: true },
                { name: '1984', done: false },
                { name: 'Sapiens', done: false },
            ]
        });
    }
    
    // 4. Renderiza as listas e widgets iniciais
    renderLists(); 
});