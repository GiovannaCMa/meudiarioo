// 1. LÓGICA DO MENU LATERAL (TOGGLE E SCROLL)
(function () {
  const btn = document.getElementById("toggleMenu");
  const aside = document.querySelector("aside");

  // Configura a transição para o botão
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
    // Verifica se o menu está aberto E se o clique não foi no próprio menu E não foi no botão
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

document.addEventListener("DOMContentLoaded", () => {
  /* ================== GERAL ================== */
  const hoje = new Date();
  let mesAtual = hoje.getMonth();
  let anoAtual = hoje.getFullYear();
  const diaHoje = hoje.getDate();

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const mesesAbreviados = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];

  /* ================== STORAGE ================== */
  const LEMBRETES_KEY = "meuDiario_lembretes_v3_lembretes";
  const LISTAS_KEY = "diaryAppLists";

  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  let listas = JSON.parse(localStorage.getItem(LISTAS_KEY)) || [];
  let diario = JSON.parse(localStorage.getItem("diario")) || [];

  /* ================== ELEMENTOS ================== */
  const el = {
    calendar: document.getElementById("calendar"),
    calendarMonth: document.getElementById("calendarMonth"),
    prevMonthBtn: document.getElementById("prevMonthBtn"),
    nextMonthBtn: document.getElementById("nextMonthBtn"),
    eventosLista: document.getElementById("eventosLista"),

    listasContainer: document.getElementById("listasContainer"),
    lembretesContainer: document.getElementById("lembretesContainer"),

    carrossel: document.getElementById("carrosselDiario"),

    eventModal: document.getElementById("eventModal"),
    eventDate: document.getElementById("eventDate"),
    eventTime: document.getElementById("eventTime"),
    eventText: document.getElementById("eventText"),
    addEventBtn: document.getElementById("addEventBtn"),
    saveEventBtn: document.getElementById("saveEventBtn"),
    closeModalBtn: document.getElementById("closeModalBtn"),

    viewListModal: document.getElementById("viewListModal"),
    viewListTitle: document.getElementById("viewListTitle"),
    viewListItems: document.getElementById("viewListItems"),
    viewListDueDate: document.getElementById("viewListDueDate"),
    viewListStatus: document.getElementById("viewListStatus"),
    contadorFeitos: document.getElementById("contadorFeitos"),
    contadorTotal: document.getElementById("contadorTotal"),
    uncheckAllBtn: document.getElementById("uncheckAllBtn"),
    closeViewListModalBtn: document.getElementById("closeViewListModalBtn"),

    addDiarioBtn: document.getElementById("addDiarioBtn"),
  };

  /* ================== HELPERS ================== */
  const openModal = (id) =>
    (document.getElementById(id).style.display = "flex");
  const closeModal = (id) =>
    (document.getElementById(id).style.display = "none");

  const formatarDataISO = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

  const formatarDataBR = (dateStr) => {
    if (!dateStr) return "sem data";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const parseDateLocal = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d);
  };

  function statusTexto(status) {
    switch (status) {
      case "concluida": return "Concluída";
      case "andamento": return "Em andamento";
      case "pendente": return "Pendente";
      default: return "Não iniciada";
    }
  }

  /* ================== ORDENAÇÃO ================== */
  function prioridadeStatus(status) {
    switch (status) {
      case "pendente": return 0;
      case "andamento": return 1;
      case "nao-iniciada":
      case "normal": return 2;
      default: return 3;
    }
  }

  function ordenarPorPrioridade(a, b, getStatus) {
    const pA = prioridadeStatus(getStatus(a));
    const pB = prioridadeStatus(getStatus(b));
    if (pA !== pB) return pA - pB;

    const dA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
    const dB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
    if (dA - dB !== 0) return dA - dB;

    return a.title.localeCompare(b.title, "pt-BR");
  }

  /* ================== CALENDÁRIO ================== */
  function renderCalendar() {
    if (!el.calendar) return;
    el.calendar.innerHTML = "";
    el.calendarMonth.textContent = `${meses[mesAtual]} ${anoAtual}`;

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const diasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++)
      el.calendar.appendChild(document.createElement("div"));

    for (let dia = 1; dia <= diasMes; dia++) {
      const div = document.createElement("div");
      div.className = "day";
      div.textContent = dia;

      const dataISO = formatarDataISO(new Date(anoAtual, mesAtual, dia));
     const ehHoje = (dia === diaHoje && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear());
      const temEvento = eventos.some(e => e.data === dataISO);

      // Lógica de classes corrigida para a legenda hjeven
      if (ehHoje && temEvento) div.classList.add("hjeven");
      else if (ehHoje) div.classList.add("today");
      else if (temEvento) div.classList.add("evento");

      div.onclick = () => {
        el.eventDate.value = dataISO;
        openModal("eventModal");
      };

      el.calendar.appendChild(div);
    }
  }

  function renderEventos() {
    if (!el.eventosLista) return;
    el.eventosLista.innerHTML = "";

    const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const futuros = eventos
      .filter(ev => parseDateLocal(ev.data) >= hojeZero)
      .sort((a,b) => parseDateLocal(a.data) - parseDateLocal(b.data))
      .slice(0, 10);

    if (!futuros.length) {
      el.eventosLista.innerHTML = "<li>Nenhum evento futuro.</li>";
      return;
    }

    futuros.forEach(ev => {
      const li = document.createElement("li");
      const data = parseDateLocal(ev.data);
      const dia = data.getDate();
      const mes = mesesAbreviados[data.getMonth()];
      const hora = ev.hora || "00:00";

      li.textContent = `${dia} ${mes} às ${hora} - ${ev.texto}`;
      el.eventosLista.appendChild(li);
    });
  }

  /* ================== LISTAS ================== */
  const getListStatus = (list) => {
    const feitos = list.items?.filter(i => i.done).length || 0;
    if (!list.items || list.items.length === 0) return "nao-iniciada";
    if (feitos === list.items.length) return "concluida";
    if (list.dueDate && new Date(list.dueDate + "T23:59:59") < new Date())
      return "pendente";
    return feitos > 0 ? "andamento" : "nao-iniciada";
  };

  function renderListas() {
    if (!el.listasContainer) return;
    const listasAtuais = JSON.parse(localStorage.getItem(LISTAS_KEY)) || [];

    const ativas = listasAtuais
      .filter(l => getListStatus(l) !== "concluida")
      .sort((a,b) => ordenarPorPrioridade(a,b,getListStatus));

    el.listasContainer.innerHTML = "";

    if (!ativas.length) {
      el.listasContainer.innerHTML =
        '<li class="empty-list-state">Nenhuma lista ativa.</li>';
      return;
    }

    ativas.forEach(list => {
      const li = document.createElement("li");
      li.className = `list-item-summary ${getListStatus(list)}`;
      li.innerHTML = `
        <span class="list-title">${list.title}</span>
        <div class="date-container">
    <span class="due-date">${formatarDataBR(list.dueDate)}</span>
  </div>
      `;
      li.onclick = () => abrirListaPadronizada(list.id);
      el.listasContainer.appendChild(li);
    });
  }

  function abrirListaPadronizada(id) {
    const listasAtuais = JSON.parse(localStorage.getItem(LISTAS_KEY)) || [];
    const list = listasAtuais.find(l => l.id === id);
    if (!list) return;

    el.viewListTitle.textContent = list.title;
    el.viewListDueDate.textContent = formatarDataBR(list.dueDate);
    el.viewListItems.innerHTML = "";

    let feitos = 0;

    list.items.forEach((item, i) => {
      const li = document.createElement("li");
      if (item.done) {
        li.classList.add("done");
        feitos++;
      }

      li.innerHTML = `
        <input type="checkbox" id="item-${i}" ${item.done ? "checked" : ""}>
        <label for="item-${i}">${item.name}</label>
      `;

      li.querySelector("input").onchange = e => {
        item.done = e.target.checked;
        localStorage.setItem(LISTAS_KEY, JSON.stringify(listasAtuais));
        abrirListaPadronizada(id);
        renderListas();
      };

      el.viewListItems.appendChild(li);
    });

    el.contadorFeitos.textContent = feitos;
    el.contadorTotal.textContent = list.items.length;

    const status = getListStatus(list);
    el.viewListStatus.textContent = statusTexto(status);
    el.viewListStatus.className = status;

    el.uncheckAllBtn.onclick = () => {
      list.items.forEach(i => i.done = false);
      localStorage.setItem(LISTAS_KEY, JSON.stringify(listasAtuais));
      abrirListaPadronizada(id);
      renderListas();
    };

    openModal("viewListModal");
  }

  /* ================== LEMBRETES ================== */
  const getLembStatusHome = (lemb) => {
    const feitos = lemb.items?.filter(i => i.done).length || 0;
    if (feitos && feitos === lemb.items?.length) return "concluida";
    if (lemb.dueDate && new Date(lemb.dueDate + "T00:00:00") < new Date())
      return "pendente";
    return feitos > 0 ? "andamento" : "normal";
  };

/* ================== LEMBRETES (FUNCIONAL) ================== */
function renderLembretes() {
  if (!el.lembretesContainer) return;
  // Busca os dados atualizados do localStorage
  const dados = JSON.parse(localStorage.getItem(LEMBRETES_KEY)) || [];

  const ativos = dados
    .filter(l => getLembStatusHome(l) !== "concluida")
    .sort((a,b) => ordenarPorPrioridade(a,b,getLembStatusHome));

  el.lembretesContainer.innerHTML = "";

  if (!ativos.length) {
    el.lembretesContainer.innerHTML =
      '<li class="empty-list-state">Nenhum lembrete pendente</li>';
    return;
  }

  ativos.forEach((lemb, index) => {
    const li = document.createElement("li");
    li.className = `list-item-summary ${getLembStatusHome(lemb)}`;
    
    li.innerHTML = `
      <span class="list-item-text">${lemb.title}</span>
      <div class="quick-actions">
          <span class="due-date">${formatarDataBR(lemb.dueDate)}</span>
          <button class="icon-action btn-concluir" title="Concluir Lembrete">
            <i class="fas fa-check-circle"></i>
          </button>
      </div>
    `;

    // Lógica para marcar como concluído ao clicar no ícone
    const btnConcluir = li.querySelector(".btn-concluir");
    btnConcluir.addEventListener("click", (e) => {
      e.stopPropagation(); // Impede de abrir o modal/link ao clicar no botão

      // Encontra o lembrete original no array completo (usando ID ou Título)
      const indexOriginal = dados.findIndex(item => item.title === lemb.title && item.dueDate === lemb.dueDate);
      
      if (indexOriginal !== -1) {
        // Marca todos os itens internos como concluídos
        if (dados[indexOriginal].items) {
          dados[indexOriginal].items.forEach(item => item.done = true);
        } else {
          // Se for um lembrete simples sem sub-itens
          dados[indexOriginal].done = true;
        }

        // Salva de volta no localStorage
        localStorage.setItem(LEMBRETES_KEY, JSON.stringify(dados));
        
        // Efeito visual rápido antes de sumir
        li.style.transform = "translateX(100px)";
        li.style.opacity = "0";
        
        // Recarrega a lista após a animação
        setTimeout(() => {
          renderLembretes();
        }, 300);
      }
    });
    
    el.lembretesContainer.appendChild(li);
  });
}



  /* ================== DIÁRIO ================== */
  function renderDiario() {
    if (!el.carrossel) return;
    el.carrossel.innerHTML = "";

    if (!diario.length) {
      el.carrossel.innerHTML =
        "<p class='diario-vazio'>Nenhuma entrada ainda...</p>";
      return;
    }

    [...diario]
      .sort((a,b) => new Date(b.data) - new Date(a.data))
      .slice(0,5)
      .forEach((e,i) => {
        const div = document.createElement("div");
        div.className = "diario-card";
        div.innerHTML = `<h3>${e.titulo}</h3><p>${formatarDataBR(e.data)}</p>`;
        div.onclick = () => location.href = `diario.html?index=${i}`;
        el.carrossel.appendChild(div);
      });
  }

  /* ================== EVENTOS ================== */
  el.addEventBtn?.addEventListener("click", () => {
    el.eventDate.value = formatarDataISO(new Date());
    el.eventTime.value = "";
    el.eventText.value = "";
    openModal("eventModal");
  });

  el.saveEventBtn?.addEventListener("click", () => {
    if (!el.eventDate.value || !el.eventText.value.trim()) return;

    eventos.push({
      data: el.eventDate.value,
      hora: el.eventTime.value,
      texto: el.eventText.value.trim(),
    });

    localStorage.setItem("eventos", JSON.stringify(eventos));
    closeModal("eventModal");
    renderCalendar();
    renderEventos();
  });

  el.closeModalBtn?.addEventListener("click", () =>
    closeModal("eventModal")
  );

  el.closeViewListModalBtn?.addEventListener("click", () =>
    closeModal("viewListModal")
  );

  el.prevMonthBtn?.addEventListener("click", () => {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    renderCalendar();
  });

  el.nextMonthBtn?.addEventListener("click", () => {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    renderCalendar();
  });

  el.addDiarioBtn?.addEventListener("click", () =>
    location.href = "diario.html"
  );

  /* ================== INIT ================== */
  renderCalendar();
  renderEventos();
  renderListas();
  renderLembretes();
  renderDiario();
});

