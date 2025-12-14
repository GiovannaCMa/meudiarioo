// 1. LÓGICA DO MENU LATERAL (TOGGLE E SCROLL)
(function () {
  const btn = document.getElementById("toggleMenu");
  const aside = document.querySelector("aside");

  // Configura a transição para o botão (necessário para o efeito de scroll)
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

// 2. LÓGICA DO DASHBOARD (CALENDÁRIO, LISTAS, MODAIS)
document.addEventListener("DOMContentLoaded", () => {
  // Variáveis Globais de Tempo e Dados
  const hoje = new Date();
  let mesAtual = hoje.getMonth();
  let anoAtual = hoje.getFullYear();
  const diaHoje = hoje.getDate();
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  // Carrega dados do Local Storage
  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  // Elementos do DOM
  const calendar = document.getElementById("calendar");
  const eventosLista = document.getElementById("eventosLista");
  const carrossel = document.getElementById("carrosselDiario");

  //FUNÇÕES AUXILIARES GERAIS
  function openModal(id) {
    document.getElementById(id).style.display = "flex";
  }

  function closeModal(id) {
    document.getElementById(id).style.display = "none";
  }

  //Converte uma data Date em string yyyy-mm-dd
  function formatarDataInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  //CALENDÁRIO E EVENTOS
  function renderCalendar() {      // =================================
    calendar.innerHTML = "";
    document.getElementById(
      "calendarMonth"
    ).textContent = `${meses[mesAtual]} ${anoAtual}`;

    const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
    const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

    // Espaços vazios antes do dia 1
    for (let i = 0; i < primeiroDiaSemana; i++) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      calendar.appendChild(empty);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      dayDiv.textContent = dia;

      const dataCompleta = new Date(anoAtual, mesAtual, dia);
      const dataStringFormatada = formatarDataInput(dataCompleta);

      // 1. É HOJE?
      const isToday =
        dia === diaHoje &&
        mesAtual === hoje.getMonth() &&
        anoAtual === hoje.getFullYear();

      // 2. TEM EVENTO?
      const eventosDoDia = eventos.filter(
        (ev) => ev.data === dataStringFormatada
      );
      const hasEvent = eventosDoDia.length > 0;

      if (isToday) {
        dayDiv.classList.add("today");
      }

      if (hasEvent) {
        dayDiv.classList.add("evento");
        // String de eventos para o tooltip (já faz a função de "mostrar título")
        dayDiv.setAttribute(
          "data-evento",
          eventosDoDia.map((ev) => ev.texto).join(", ")
        );

        // 3. É HOJE E TEM EVENTO? (CLASSE HJEVEN)
        if (isToday) {
          dayDiv.classList.add("hjeven");
        }
      }

      // === BLOCO DE LÓGICA CORRIGIDO ===
      dayDiv.addEventListener("click", () => {
        // Se TEM evento, não faz nada (o título já aparece no CSS via data-evento: hover/tooltip).
        if (hasEvent) {
          return;
        }

        // Se NÃO TEM evento, abre o modal de adição preenchido com a data.
        document.getElementById("eventDate").value = dataStringFormatada;
        document.getElementById("eventTime").value = "";
        document.getElementById("eventText").value = "";
        openModal("eventModal");
      });

      calendar.appendChild(dayDiv);
    }

    renderEventosDoMes();
  }

  function renderEventosDoMes() {
    eventosLista.innerHTML = "";

    const eventosDoMes = eventos
      .filter((ev) => {
        const [y, m] = ev.data.split("-");
        return parseInt(m) - 1 === mesAtual && parseInt(y) === anoAtual;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (eventosDoMes.length === 0) {
      eventosLista.innerHTML = "<li>Nenhum evento neste mês.</li>";
      return;
    }

    eventosDoMes.forEach((ev) => {
      const [y, m, d] = ev.data.split("-");
      const data = new Date(y, m - 1, d);
      const hora = ev.hora ? ` às ${ev.hora}` : "";

      const li = document.createElement("li");
      li.textContent = `${data.getDate()} ${meses[data.getMonth()].substring(
        0,
        3
      )}${hora} — ${ev.texto}`;
      eventosLista.appendChild(li);
    });
  }

  // Controles de Navegação do Calendário
  document.getElementById("prevMonthBtn").onclick = () => {
    mesAtual--;
    if (mesAtual < 0) {
      mesAtual = 11;
      anoAtual--;
    }
    renderCalendar();
  };
  document.getElementById("nextMonthBtn").onclick = () => {
    mesAtual++;
    if (mesAtual > 11) {
      mesAtual = 0;
      anoAtual++;
    }
    renderCalendar();
  };

  // Botões do Modal de Eventos
  document.getElementById("addEventBtn").onclick = () => {
    document.getElementById("eventDate").value = formatarDataInput(new Date());
    document.getElementById("eventTime").value = "";
    document.getElementById("eventText").value = "";
    openModal("eventModal");
  };
  document.getElementById("closeModalBtn").onclick = () =>
    closeModal("eventModal");

  document.getElementById("saveEventBtn").onclick = () => {
    const data = document.getElementById("eventDate").value;
    const hora = document.getElementById("eventTime").value;
    const texto = document.getElementById("eventText").value.trim();

    if (!data || !texto) return alert("Preencha a data e descrição.");

    eventos.push({ data, hora, texto });
    localStorage.setItem("eventos", JSON.stringify(eventos));

    closeModal("eventModal");
    renderCalendar();
  };

  //LISTAS (To-Do Lists)
  document.getElementById("addListBtn").onclick = () => {
    document.getElementById("listTitle").value = "";
    document.getElementById("listItems").value = "";
    openModal("listModal");
  };
  document.getElementById("closeListModalBtn").onclick = () =>
    closeModal("listModal");

  document.getElementById("saveListBtn").onclick = () => {
    const titulo = document.getElementById("listTitle").value.trim();
    const itens = document
      .getElementById("listItems")
      .value.split(",")
      .map((i) => i.trim())
      .filter((i) => i !== "");

    if (!titulo) return alert("Coloque um título!");

    const listas = JSON.parse(localStorage.getItem("listas")) || [];
    // Adiciona "feito: false" a cada item novo
    const itensComStatus = itens.map((item) => ({ texto: item, feito: false }));

    listas.push({ titulo, itens: itensComStatus });
    localStorage.setItem("listas", JSON.stringify(listas));

    renderListas();
    closeModal("listModal");
  };

  function renderListas() {
    const listas = JSON.parse(localStorage.getItem("listas")) || [];
    const container = document.getElementById("listasContainer");
    container.innerHTML = "";

    if (listas.length === 0) {
      container.innerHTML = "<li>Nenhuma lista salva.</li>";
      return;
    }

    listas.forEach((lista, index) => {
      const li = document.createElement("li");
      li.textContent = lista.titulo;
      li.onclick = () => abrirLista(index);
      container.appendChild(li);
    });
  }

  function abrirLista(index) {
    const listas = JSON.parse(localStorage.getItem("listas")) || [];
    const lista = listas[index];

    document.getElementById("viewListTitle").textContent = lista.titulo;
    const ul = document.getElementById("viewListItems");
    ul.innerHTML = "";

    lista.itens.forEach((item, i) => {
      const li = document.createElement("li");
      li.textContent = item.texto;
      if (item.feito) {
        li.classList.add("done");
      }
      // Toggle de "feito"
      li.onclick = () => {
        li.classList.toggle("done");
        // Atualiza o status no Local Storage
        listas[index].itens[i].feito = !listas[index].itens[i].feito;
        localStorage.setItem("listas", JSON.stringify(listas));
      };
      ul.appendChild(li);
    });

    openModal("viewListModal");
  }

  document.getElementById("closeViewListModalBtn").onclick = () =>
    closeModal("viewListModal");

  //LEMBRETES
  document.getElementById("addReminderBtn").onclick = () => {
    document.getElementById("reminderText").value = "";
    openModal("reminderModal");
  };

  document.getElementById("closeReminderModal").onclick = () =>
    closeModal("reminderModal");

  document.getElementById("saveReminderBtn").onclick = () => {
    const texto = document.getElementById("reminderText").value.trim();
    if (!texto) return alert("Escreva algo!");

    const lembretes = JSON.parse(localStorage.getItem("lembretes")) || [];
    lembretes.push(texto);
    localStorage.setItem("lembretes", JSON.stringify(lembretes));

    renderLembretes();
    closeModal("reminderModal");
  };

  function renderLembretes() {
    const lembretes = JSON.parse(localStorage.getItem("lembretes")) || [];
    const container = document.getElementById("lembretesContainer");
    container.innerHTML = "";

    if (lembretes.length === 0) {
      container.innerHTML = "<li>Nenhum lembrete definido.</li>";
      return;
    }

    lembretes.forEach((lemb) => {
      const li = document.createElement("li");
      li.textContent = lemb;
      container.appendChild(li);
    });
  }

  //DIÁRIO - CARROSSEL
  function atualizarCarrossel() {
    const diarios = JSON.parse(localStorage.getItem("diarios")) || [];
    carrossel.innerHTML = "";

    if (diarios.length === 0) {
      carrossel.innerHTML =
        '<p class="diario-vazio">Nenhuma entrada de diário ainda...</p>';
    } else {
      // Exibe os últimos 5, do mais recente para o mais antigo
      diarios
        .slice(-5)
        .reverse()
        .forEach((diario) => {
          const card = document.createElement("div");
          card.classList.add("diario-card");

          // Assumindo que o objeto diario tem 'data', 'titulo' e 'resumo'
          const dataFormatada = diario.data
            ? new Date(diario.data).toLocaleDateString("pt-BR")
            : "Sem data";

          card.innerHTML = `
          <h3>${diario.titulo || "Nova Entrada"}</h3>
          <p>${diario.resumo || "Clique para ler mais..."}</p>
          <small>${dataFormatada}</small>
        `;

          carrossel.appendChild(card);
        });
    }
  }

  // Botão para adicionar diário (apenas simulação)
  document.getElementById("addDiarioBtn").onclick = () => {
    alert("Redirecionando para a página de nova entrada do diário.");
    // Adicionar aqui a lógica de redirecionamento ou abertura de modal para o diário.
  };

  // Renderizações iniciais
  renderCalendar();
  renderListas();
  renderLembretes();
  atualizarCarrossel();
});