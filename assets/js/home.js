document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------------------
      VARIÁVEIS GERAIS
  --------------------------------------------*/
  const calendar = document.getElementById("calendar");
  const eventosLista = document.getElementById("eventosLista");
  const carrossel = document.getElementById("carrosselDiario");

  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  const hoje = new Date();
  let mesAtual = hoje.getMonth();
  let anoAtual = hoje.getFullYear();
  const diaHoje = hoje.getDate();

  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  /* -----------------------------------------
      FUNÇÕES DO CALENDÁRIO
  --------------------------------------------*/
  function renderCalendar() {
    calendar.innerHTML = "";
    eventosLista.innerHTML = "";
    document.getElementById(
      "calendarMonth"
    ).textContent = `${meses[mesAtual]} ${anoAtual}`;

    const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      dayDiv.textContent = dia;

      const dataCompleta = new Date(anoAtual, mesAtual, dia);

      if (
        dia === diaHoje &&
        mesAtual === hoje.getMonth() &&
        anoAtual === hoje.getFullYear()
      ) {
        dayDiv.classList.add("today");
      }

      const eventoDia = eventos.find((ev) =>
        compareDate(ev.data, dataCompleta)
      );
      if (eventoDia) {
        dayDiv.classList.add("evento");
        dayDiv.setAttribute("data-evento", eventoDia.texto);
      }

      calendar.appendChild(dayDiv);
    }

    renderEventosDoMes();
  }

  function compareDate(evDateStr, currentDate) {
    const [y, m, d] = evDateStr.split("-");
    const evDate = new Date(y, m - 1, d);
    return (
      evDate.getDate() === currentDate.getDate() &&
      evDate.getMonth() === currentDate.getMonth() &&
      evDate.getFullYear() === currentDate.getFullYear()
    );
  }

  function renderEventosDoMes() {
    const eventosDoMes = eventos
      .filter((ev) => {
        const [y, m] = ev.data.split("-");
        return parseInt(m) - 1 === mesAtual && parseInt(y) === anoAtual;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    eventosDoMes.forEach((ev) => {
      const [y, m, d] = ev.data.split("-");
      const data = new Date(y, m - 1, d);
      const hora = ev.hora ? ` às ${ev.hora}` : "";

      const li = document.createElement("li");
      li.textContent = `${data.getDate()} ${meses[data.getMonth()]}${hora} — ${
        ev.texto
      }`;
      eventosLista.appendChild(li);
    });
  }

  /* -----------------------------------------
      EVENTOS - MODAL
  --------------------------------------------*/
  document.getElementById("addEventBtn").onclick = () =>
    openModal("eventModal");
  document.getElementById("closeModalBtn").onclick = () =>
    closeModal("eventModal");

  document.getElementById("saveEventBtn").onclick = () => {
    const data = document.getElementById("eventDate").value;
    const hora = document.getElementById("eventTime").value;
    const texto = document.getElementById("eventText").value;

    if (!data || !texto) return alert("Preencha a data e descrição.");

    eventos.push({ data, hora, texto });
    localStorage.setItem("eventos", JSON.stringify(eventos));

    closeModal("eventModal");
    renderCalendar();
  };

  /* -----------------------------------------
      LISTAS
  --------------------------------------------*/
  document.getElementById("addListBtn").onclick = () => openModal("listModal");
  document.getElementById("closeListModalBtn").onclick = () =>
    closeModal("listModal");

  document.getElementById("saveListBtn").onclick = () => {
    const titulo = document.getElementById("listTitle").value;
    const itens = document
      .getElementById("listItems")
      .value.split(",")
      .map((i) => i.trim());

    if (!titulo) return alert("Coloque um título!");

    const listas = JSON.parse(localStorage.getItem("listas")) || [];
    listas.push({ titulo, itens, feitos: [] });
    localStorage.setItem("listas", JSON.stringify(listas));

    renderListas();
    closeModal("listModal");
  };

  function renderListas() {
    const listas = JSON.parse(localStorage.getItem("listas")) || [];
    const container = document.getElementById("listasContainer");
    container.innerHTML = "";

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
      li.textContent = item;
      li.onclick = () => li.classList.toggle("done");
      ul.appendChild(li);
    });

    openModal("viewListModal");
  }

  document.getElementById("closeViewListModalBtn").onclick = () =>
    closeModal("viewListModal");

  /* -----------------------------------------
      LEMBRETES
  --------------------------------------------*/
  document.getElementById("addReminderBtn").onclick = () =>
    openModal("reminderModal");
  document.getElementById("closeReminderModal").onclick = () =>
    closeModal("reminderModal");

  document.getElementById("saveReminderBtn").onclick = () => {
    const texto = document.getElementById("reminderText").value;
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

    lembretes.forEach((lemb) => {
      const li = document.createElement("li");
      li.textContent = lemb;
      container.appendChild(li);
    });
  }

  /* -----------------------------------------
      DIÁRIO - CARROSSEL
  --------------------------------------------*/
  function atualizarCarrossel() {
    const diarios = JSON.parse(localStorage.getItem("diarios")) || [];
    carrossel.innerHTML = "";

    if (diarios.length === 0) {
      carrossel.innerHTML =
        '<p class="diario-vazio">Nenhuma entrada de diário ainda...</p>';
    } else {
      diarios.forEach((diario) => {
        const card = document.createElement("div");
        card.classList.add("diario-card");

        card.innerHTML = `
          <h3>${diario.titulo}</h3>
          <p>${diario.resumo}</p>
          <small>${diario.data}</small>
        `;

        card.addEventListener("click", () => {
          localStorage.setItem("diarioSelecionado", JSON.stringify(diario));
          window.location.href = "visualizar_diario.html";
        });

        carrossel.appendChild(card);
      });
    }
  }

  // Inicializa o carrossel
  atualizarCarrossel();

  // Botão para adicionar diário
  document.getElementById("addDiarioBtn").onclick = () => {
    window.location.href = "nova_entrada.html";
  };

  /* -----------------------------------------
      FUNÇÕES AUXILIARES
  --------------------------------------------*/
  function openModal(id) {
    document.getElementById(id).style.display = "flex";
  }

  function closeModal(id) {
    document.getElementById(id).style.display = "none";
  }

  // Botões de trocar mês no calendário (opcional)
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

  // Renderizações iniciais
  renderCalendar();
  renderListas();
  renderLembretes();
});







// Coloque isso no final do <body>, sem outras dependências
(function () {
  const btn = document.getElementById("toggleMenu");
  const aside = document.querySelector("aside");
  if (!btn || !aside) return; // nada faz se faltar elemento

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    aside.classList.toggle("menu-open");
  });

  // opcional: fecha quando redimensiona para desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      aside.classList.remove("menu-open");
    }
  });
})();
