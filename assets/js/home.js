// 1. LÓGICA DO MENU LATERAL (TOGGLE E SCROLL)
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

document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date();
  let mesAtual = hoje.getMonth();
  let anoAtual = hoje.getFullYear();
  const diaHoje = hoje.getDate();
  
  let dataSelecionada = null; 

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];
  
  // Meses abreviados em português para a lista de eventos
  const mesesAbreviados = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];

  /* ================== STORAGE ================== */
  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  // MUDANÇA: Usando a chave de storage da lista da página 'listas.html'
  let listas = JSON.parse(localStorage.getItem("diaryAppLists")) || []; 
  let lembretes = JSON.parse(localStorage.getItem("lembretes")) || [];
  let diario = JSON.parse(localStorage.getItem("diario")) || [];

  /* ================== ELEMENTOS ================== */
  const el = {
    calendar: document.getElementById("calendar"),
    calendarMonth: document.getElementById("calendarMonth"),
    prevMonthBtn: document.getElementById("prevMonthBtn"),
    nextMonthBtn: document.getElementById("nextMonthBtn"),
    eventosLista: document.getElementById("eventosLista"),
    carrossel: document.getElementById("carrosselDiario"),
    listasContainer: document.getElementById("listasContainer"),
    lembretesContainer: document.getElementById("lembretesContainer"),

    addEventBtn: document.getElementById("addEventBtn"),
    saveEventBtn: document.getElementById("saveEventBtn"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    eventDate: document.getElementById("eventDate"),
    eventTime: document.getElementById("eventTime"),
    eventText: document.getElementById("eventText"),
    eventModal: document.getElementById("eventModal"),
    
    // Elementos do Modal de Visualização de Lista (necessário para a Home)
    viewListTitle: document.getElementById("viewListTitle"),
    viewListItems: document.getElementById("viewListItems"),
    viewListDueDate: document.getElementById("viewListDueDate"),
    viewListStatus: document.getElementById("viewListStatus"),
    closeViewListModalBtn: document.getElementById("closeViewListModalBtn"),
    viewListModal: document.getElementById("viewListModal"),

    addReminderBtn: document.getElementById("addReminderBtn"),
    reminderText: document.getElementById("reminderText"),
    saveReminderBtn: document.getElementById("saveReminderBtn"),
    closeReminderModal: document.getElementById("closeReminderModal"),
    reminderModal: document.getElementById("reminderModal"),

    addDiarioBtn: document.getElementById("addDiarioBtn"),
  };
  
  let currentViewListId = null; // Variável para rastrear a lista sendo visualizada

  /* ================== HELPERS ================== */
  const openModal = (id) =>
    document.getElementById(id).style.display = "flex";
    
  const closeModal = (id) =>
    document.getElementById(id).style.display = "none";

  const formatarData = (date) =>
    `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

  function parseDateLocal(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d); 
  }
  
  // Função atualizada para usar a nova estrutura de dados (list.items)
  function getStatusLista(lista) {
    // Se 'items' não existir, usa uma lista vazia para evitar erros
    const items = lista.items || []; 
    const total = items.length;
    // MUDANÇA: Usa 'done' (da listas.js) em vez de 'feito' (da home.js original)
    const feitos = items.filter(i => i.done).length; 

    if (total && feitos === total) return "Concluída";

    // MUDANÇA: Usa 'dueDate' (da listas.js) em vez de 'dataLimite' (da home.js original)
    if (lista.dueDate) {
      const hoje = new Date();
      const limite = parseDateLocal(lista.dueDate);
      // Garante que o limite é no final do dia
      limite.setHours(23, 59, 59); 
      if (hoje > limite && feitos < total) return "Pendente";
    }

    if (feitos > 0 && feitos < total) return "Em andamento";
    
    return "Em andamento"; // Por padrão, se não está concluída ou atrasada, está em andamento (ou não iniciada)
  }
  
  function limparSelecaoDia() {
    document.querySelectorAll(".day.selected").forEach(d =>
      d.classList.remove("selected")
    );
    dataSelecionada = null;
  }
  
  // Salva a lista no localStorage (Usando a chave 'diaryAppLists')
  const saveListsToLocalStorage = () => {
    localStorage.setItem('diaryAppLists', JSON.stringify(listas));
  };


  /* ================== CALENDÁRIO ================== */
  function renderCalendar() {
    if (!el.calendar || !el.calendarMonth) return;
    
    el.calendar.innerHTML = "";
    el.calendarMonth.textContent = `${meses[mesAtual]} ${anoAtual}`;

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const diasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
      el.calendar.appendChild(document.createElement("div"));
    }

    for (let dia = 1; dia <= diasMes; dia++) {
      const div = document.createElement("div");
      div.className = "day";
      div.textContent = dia;

      const dataAtual = new Date(anoAtual, mesAtual, dia);
      const dataStringFormatada = formatarData(dataAtual);
      const eventosDia = eventos.filter(e => e.data === dataStringFormatada);
      
      const isToday = dia === diaHoje && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
      const hasEvent = eventosDia.length > 0;

      if (isToday) {
        div.classList.add("today");
      }
      
      if (hasEvent) {
        div.classList.add("evento");
        if (isToday) {
          div.classList.add("hjeven"); 
        }
        
        div.setAttribute(
          "data-evento", 
          eventosDia.map(ev => ev.texto).join(", ")
        );
      }

      div.onclick = () => {
        limparSelecaoDia(); 
        div.classList.add("selected");
        dataSelecionada = dataAtual;
        
        el.eventDate.value = dataStringFormatada;
        el.eventText.value = "";
        el.eventTime.value = "";
        openModal("eventModal");
      };

      el.calendar.appendChild(div);
    }
  }

  function renderEventos() {
    if (!el.eventosLista) return;
    
    el.eventosLista.innerHTML = "";

    const hojeDataSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const listaFutura = eventos
      .filter(ev => {
        const [y,m,d] = ev.data.split("-").map(Number);
        const dataEv = new Date(y, m - 1, d); 
        return dataEv >= hojeDataSemHora; 
      })
      .sort((a, b) => {
        const da = new Date(a.data + (a.hora ? `T${a.hora}` : ""));
        const db = new Date(b.data + (b.hora ? `T${b.hora}` : ""));
        return da - db;
      })
      .slice(0, 10); 

    if (!listaFutura.length) {
      el.eventosLista.innerHTML = "<li>Nenhum evento futuro encontrado.</li>";
      return;
    }

    listaFutura.forEach(ev => {
      const d = parseDateLocal(ev.data);
      const li = document.createElement("li");
      
      const dia = String(d.getDate()).padStart(2,"0");
      const mesAbrev = mesesAbreviados[d.getMonth()]; 
      
      const horaTexto = ev.hora ? ` às ${ev.hora}` : "";
      const dataFormatada = `${dia} ${mesAbrev}${horaTexto}`;
      
      li.textContent = `${dataFormatada} — ${ev.texto}`;
      el.eventosLista.appendChild(li);
    });
  }


  if (el.prevMonthBtn) el.prevMonthBtn.onclick = () => {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    renderCalendar();
  };

  if (el.nextMonthBtn) el.nextMonthBtn.onclick = () => {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    renderCalendar();
  };

  /* ================== LISTAS (ATUALIZADA) ================== */
  function renderListas() {
    if (!el.listasContainer) return;
    
    el.listasContainer.innerHTML = "";
    
    // FILTRA: Exibe apenas listas que NÃO estão concluídas
    const listasParaExibir = listas.filter(lista => getStatusLista(lista) !== "Concluída");

    if (!listasParaExibir.length) {
      const li = document.createElement("li");
      li.className = "empty-list-state";
      li.textContent = "Nenhuma lista pendente ou em andamento.";
      el.listasContainer.appendChild(li);
      return;
    }

    listasParaExibir.forEach((lista) => {
      const li = document.createElement("li");
      li.textContent = lista.title;
      
      const status = getStatusLista(lista);

      if (status === "Pendente") {
        li.classList.add("pendente");
      }
      
      // O evento de clique agora abre o modal de visualização
      li.onclick = () => abrirLista(lista.id);
      el.listasContainer.appendChild(li);
    });
  }

  // MUDANÇA: Função para abrir a lista, similar à de listas.js
  function abrirLista(listId) {
    if (!el.viewListModal) return;
    
    const list = listas.find(l => l.id === listId);
    if (!list) return;

    currentViewListId = listId;

    el.viewListTitle.textContent = list.title;
    el.viewListItems.innerHTML = "";

    // MUDANÇA: Usa 'dueDate' e 'formatDueDate' (similar ao listas.js)
    const formatDueDate = (dateString) => {
        if (!dateString) return 'Sem data limite';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    el.viewListDueDate.textContent = formatDueDate(list.dueDate);

    const status = getStatusLista(list);
    el.viewListStatus.textContent = status;
    // MUDANÇA: Usando classes de status do listas.js
    el.viewListStatus.className = status.toLowerCase().replace(" ", "");

    list.items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.textContent = item.name; // MUDANÇA: Usa 'name' em vez de 'texto'
      if (item.done) li.classList.add("done"); // MUDANÇA: Usa 'done' em vez de 'feito'

      li.onclick = () => {
        // Altera o status do item
        list.items[idx].done = !list.items[idx].done;
        
        // Salva a alteração no localStorage (chave: diaryAppLists)
        saveListsToLocalStorage();
        
        // Reabre o modal para atualizar a visualização do item (checked/unchecked)
        abrirLista(listId); 
        
        // Atualiza a lista na Home (para remover se foi concluída)
        renderListas();
      };

      el.viewListItems.appendChild(li);
    });

    openModal("viewListModal");
  }

  if (el.closeViewListModalBtn) el.closeViewListModalBtn.onclick = () => closeModal("viewListModal");
  // Removendo a lógica desnecessária de adição/criação de lista da Home

  /* ================== LEMBRETES ================== */
  function renderLembretes() {
    if (!el.lembretesContainer) return;
    
    el.lembretesContainer.innerHTML = "";
    if (!lembretes.length) {
      const li = document.createElement("li");
      li.className = "empty-list-state";
      li.textContent = "Nenhum lembrete salvo.";
      el.lembretesContainer.appendChild(li);
      return;
    }

    // O lembrete continua sendo apenas uma string, como na sua implementação original
    lembretes.forEach(l => {
      const li = document.createElement("li");
      li.textContent = l;
      el.lembretesContainer.appendChild(li);
    });
  }

  if (el.addReminderBtn) el.addReminderBtn.onclick = () => {
    el.reminderText.value = "";
    openModal("reminderModal");
  };

  if (el.saveReminderBtn) el.saveReminderBtn.onclick = () => {
    if (!el.reminderText.value.trim()) return;
    lembretes.push(el.reminderText.value.trim());
    localStorage.setItem("lembretes", JSON.stringify(lembretes));
    closeModal("reminderModal");
    renderLembretes();
  };

  if (el.closeReminderModal) el.closeReminderModal.onclick = () => closeModal("reminderModal");

  /* ================== DIÁRIO ================== */
  function renderDiario() {
    if (!el.carrossel) return;
    
    el.carrossel.innerHTML = "";
    if (!diario.length) {
      el.carrossel.innerHTML = "<p class='diario-vazio'>Nenhuma entrada ainda...</p>";
      return;
    }

    [...diario]
      .sort((a,b) => new Date(b.data) - new Date(a.data)) 
      .slice(0, 5) // Exibe apenas as 5 últimas entradas
      .forEach((e) => {
        const div = document.createElement("div");
        div.className = "diario-card";
        
        const parseDateLocal = (dateStr) => {
            if (!dateStr) return new Date();
            const [y, m, d] = dateStr.split("-");
            return new Date(y, m - 1, d); 
        };

        div.innerHTML = `
          <h3>${e.titulo}</h3>
          <p>${parseDateLocal(e.data).toLocaleDateString("pt-BR")}</p>
        `;
        
        // Encontra o índice original para navegação
        div.onclick = () => {
            const originalIndex = diario.findIndex(item => item.data === e.data && item.titulo === e.titulo);
            location.href = `diario.html?index=${originalIndex}`;
        }; 
        el.carrossel.appendChild(div);
      });
  }

  if (el.addDiarioBtn) el.addDiarioBtn.onclick = () => location.href = "diario.html";

  /* ================== EVENTOS (Apenas Adição) ================== */
  if (el.addEventBtn) el.addEventBtn.onclick = () => {
    el.eventDate.value = formatarData(new Date()); 
    el.eventText.value = "";
    el.eventTime.value = "";
    openModal("eventModal");
    limparSelecaoDia(); 
  };

  if (el.saveEventBtn) el.saveEventBtn.onclick = () => {
    if (!el.eventDate.value || !el.eventText.value.trim()) return;

    eventos.push({
      data: el.eventDate.value,
      hora: el.eventTime.value,
      texto: el.eventText.value.trim()
    });

    localStorage.setItem("eventos", JSON.stringify(eventos));
    closeModal("eventModal");
    limparSelecaoDia();
    renderCalendar(); 
    renderEventos(); 
  };

  if (el.closeModalBtn) el.closeModalBtn.onclick = () => {
    closeModal("eventModal");
    limparSelecaoDia(); 
  }

  /* ================== INIT ================== */
  renderCalendar();
  renderEventos(); 
  renderListas();
  renderLembretes();
  renderDiario();
});

