// 1. LÓGICA DO MENU LATERAL (TOGGLE E SCROLL)
(function () {
    const btn = document.getElementById("toggleMenu");
    const aside = document.querySelector("aside");
    
    // Configura a transição para o botão 
    if (btn) {
        btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    if (!btn || !aside) return; 

    // --- 1. Lógica de Abrir/Fechar (Toggle) ---
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        aside.classList.toggle("menu-open");
    });

    // --- 2. Fechar ao Clicar Fora (melhor usabilidade mobile) ---
    document.addEventListener('click', (e) => {
        // Verifica se o menu está aberto E se o clique não foi no próprio menu E não foi no botão
        if (window.innerWidth <= 900 && aside.classList.contains('menu-open') && !aside.contains(e.target) && e.target !== btn) {
            aside.classList.remove('menu-open');
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
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none'; 
            btn.style.transform = 'translateY(-20px)';
          } else { 
            // Rolando para cima: Mostra o botão
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto'; 
            btn.style.transform = 'translateY(0)';
          }
        } else {
          // No topo da página: Visível
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
          btn.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY; 
      } else {
        // Em Desktop: Garante estado padrão
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        btn.style.transform = 'translateY(0)';
      }
    });
})();

// VARIÁVEIS & CONSTANTES (DOM e Dados)

// Elementos Principais
const calendar = document.getElementById("calendar");
const eventosLista = document.getElementById("eventosLista");
const calendarMonthDisplay = document.getElementById("calendarMonth");

// Botões
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const addEventBtn = document.getElementById("addEventBtn");

// Modais
const eventModal = document.getElementById("eventModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveEventBtn = document.getElementById("saveEventBtn");
const editEventModal = document.getElementById("editEventModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const updateEventBtn = document.getElementById("updateEventBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");

// Inputs do Modal Adicionar
const eventDateInput = document.getElementById("eventDate");
const eventTimeInput = document.getElementById("eventTime");
const eventTextInput = document.getElementById("eventText");

// Inputs do Modal Editar
const editEventIndexInput = document.getElementById("editEventIndex");
const editEventDateInput = document.getElementById("editEventDate");
const editEventTimeInput = document.getElementById("editEventTime");
const editEventTextInput = document.getElementById("editEventText");

// Resumo (Selectores ajustados para refletir a posição)
const resumoEventosMes = document.querySelector(".resumo-item:nth-child(1) strong");
const resumoProximoEvento = document.querySelector(".resumo-item:nth-child(2) strong");
const resumoDiasOcupados = document.querySelector(".resumo-item:nth-child(3) strong");

// Filtros
const filtros = document.querySelectorAll(".btn-filtro");
let filtroAtual = "Todos";

// Dados de Tempo
const hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
const diaHoje = hoje.getDate();
let dataSelecionada = null; 

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const mesesAbreviados = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

// FUNÇÕES AUXILIARES 

function formatarDataInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function datasIguais(dataString, dateObj) {
  const [y, m, d] = dataString.split("-").map(Number);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
}

function limparSelecaoDia() {
  document.querySelectorAll(".day.selected").forEach(d =>
    d.classList.remove("selected")
  );
  dataSelecionada = null;
}

/** Abre o modal adicionando a classe 'active'. */
function abrirModal(modal) {
  modal.classList.add("active");
}

/** Fecha o modal removendo a classe 'active'. */
function fecharModal(modal) {
  modal.classList.remove("active");
  limparSelecaoDia(); 
}

function updateMonthDisplay() {
  calendarMonthDisplay.textContent = `${meses[mesAtual]} ${anoAtual}`;
}

// RENDER CALENDÁRIO
function renderCalendar() {
  calendar.innerHTML = "";

  updateMonthDisplay();

  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  // Espaços vazios
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.textContent = dia;

    const dataAtual = new Date(anoAtual, mesAtual, dia);
    const dataStringFormatada = formatarDataInput(dataAtual);
    const eventosDoDia = eventos.filter(ev => ev.data === dataStringFormatada);

    const isToday = dia === diaHoje && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
    const hasEvent = eventosDoDia.length > 0;

    if (isToday) {
      dayDiv.classList.add("today");
    }
    
    if (hasEvent) {
      dayDiv.classList.add("evento");
      
      if (isToday) {
        dayDiv.classList.add("hjeven"); 
      }
      
      dayDiv.setAttribute(
        "data-evento",
        eventosDoDia.map(ev => ev.texto).join(", ")
      );
    }

    dayDiv.addEventListener("click", () => {
      limparSelecaoDia();
      dayDiv.classList.add("selected");
      dataSelecionada = dataAtual;

      if (hasEvent) {
        // Abre o modal de edição/visualização para o PRIMEIRO evento do dia
        abrirModalEvento(eventosDoDia[0]); 
      } else {
        eventDateInput.value = dataStringFormatada;
        eventTimeInput.value = "";
        eventTextInput.value = "";
        abrirModal(eventModal);
      }
    });

    calendar.appendChild(dayDiv);
  }

  renderEventosDoMes();
}

// NAVEGAÇÃO DO CALENDÁRIO
prevMonthBtn.onclick = () => {
  mesAtual--;
  if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual--;
  }
  renderCalendar();
};

nextMonthBtn.onclick = () => {
  mesAtual++;
  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual++;
  }
  renderCalendar();
};

// MODAL DE VISUALIZAÇÃO / EDIÇÃO

/** Preenche e abre o modal de edição para um evento específico. */
function abrirModalEvento(ev) {
  const index = eventos.indexOf(ev);

  editEventIndexInput.value = index;
  editEventDateInput.value = ev.data;
  editEventTimeInput.value = ev.hora || "";
  editEventTextInput.value = ev.texto;

  abrirModal(editEventModal);
}

// EVENTOS - ADICIONAR
addEventBtn.onclick = () => {
  eventDateInput.value = formatarDataInput(new Date()); 
  eventTimeInput.value = "";
  eventTextInput.value = "";

  if (dataSelecionada) {
    eventDateInput.value = formatarDataInput(dataSelecionada);
  }

  abrirModal(eventModal);
};

closeModalBtn.onclick = () => fecharModal(eventModal);

saveEventBtn.onclick = () => {
  const data = eventDateInput.value;
  const hora = eventTimeInput.value;
  const texto = eventTextInput.value.trim();

  if (!data || !texto) {
    alert("Preencha a data e a descrição.");
    return;
  }

  const [y, m] = data.split("-").map(Number);
  const novoMes = m - 1;
  const novoAno = y;

  eventos.push({ data, hora, texto });
  localStorage.setItem("eventos", JSON.stringify(eventos));

  fecharModal(eventModal);

  // Se o novo evento for em outro mês, navega para ele
  if (novoMes !== mesAtual || novoAno !== anoAtual) {
    mesAtual = novoMes;
    anoAtual = novoAno;
  }

  renderCalendar();
};

// EVENTOS - EDITAR / EXCLUIR
closeEditModalBtn.onclick = () => fecharModal(editEventModal);

updateEventBtn.onclick = () => {
  const index = editEventIndexInput.value;
  const data = editEventDateInput.value;
  const hora = editEventTimeInput.value;
  const texto = editEventTextInput.value.trim();

  if (index === "" || index < 0 || index >= eventos.length) {
    alert("Erro ao atualizar evento: índice inválido.");
    fecharModal(editEventModal);
    return;
  }
  
  if (!data || !texto) {
    alert("A data e a descrição são obrigatórias.");
    return;
  }

  eventos[index] = { data, hora, texto };

  localStorage.setItem("eventos", JSON.stringify(eventos));
  fecharModal(editEventModal);
  renderCalendar();
};

deleteEventBtn.onclick = () => {
  const index = editEventIndexInput.value;

  if (confirm("Deseja excluir este evento?")) {
    eventos.splice(index, 1);
    localStorage.setItem("eventos", JSON.stringify(eventos));
    fecharModal(editEventModal);
    renderCalendar();
  }
};

// FILTROS
filtros.forEach(btn => {
  btn.addEventListener("click", () => {
    filtros.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtroAtual = btn.textContent.trim(); 
    renderEventosDoMes();
  });
});

// RENDER EVENTOS DO MÊS (COM FILTROS)
function renderEventosDoMes() {
  eventosLista.innerHTML = "";

  const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  
  // 1. Calcula o período de filtragem
  let eventosFiltrados = [];

  if (filtroAtual === "Hoje") {
    eventosFiltrados = eventos.filter(ev => datasIguais(ev.data, hojeData));

  } else if (filtroAtual === "Semana") {
    const inicioSemana = new Date(hojeData);
    inicioSemana.setDate(hojeData.getDate() - hojeData.getDay()); 
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999); 

    eventosFiltrados = eventos.filter(ev => {
        const [y, m, d] = ev.data.split("-").map(Number);
        const dataEv = new Date(y, m - 1, d); 
        return dataEv >= inicioSemana && dataEv <= fimSemana;
    });

  } else {
    eventosFiltrados = eventos.filter(ev => {
      const [y, m, d] = ev.data.split("-").map(Number);
      const dataEv = new Date(y, m - 1, d); 
      // Garante que a lista mostra eventos de HOJE em diante
      return dataEv >= hojeData; 
    });
  }

  // 2. Ordena os eventos filtrados por data e hora (aplicado a todos os filtros)
  eventosFiltrados
    .sort((a, b) => {
      const dataA = new Date(a.data + (a.hora ? 'T' + a.hora : ''));
      const dataB = new Date(b.data + (b.hora ? 'T' + b.hora : ''));
      return dataA - dataB;
    })
    .forEach(ev => {
      const [y, m, d] = ev.data.split("-").map(Number);
      const data = new Date(y, m - 1, d);
      
      const horaTexto = ev.hora ? ` às ${ev.hora}` : "";
      const mesAbrev = mesesAbreviados[data.getMonth()]; 
      const textoData = `${data.getDate()} ${mesAbrev}`;

      const li = document.createElement("li");
      li.textContent = `${textoData}${horaTexto} — ${ev.texto}`;

      li.addEventListener("click", () => abrirModalEvento(ev));
      eventosLista.appendChild(li);
    });

  if (eventosFiltrados.length === 0) {
    const li = document.createElement("li");
    li.textContent = `Nenhum evento encontrado para o filtro '${filtroAtual}'.`;
    eventosLista.appendChild(li);
  }

  atualizarResumo();
}

// ATUALIZAR RESUMO (3 CARDS)
function atualizarResumo() {
  const eventosDoMes = eventos.filter(ev => {
    const [y, m] = ev.data.split("-").map(Number);
    return m - 1 === mesAtual && y === anoAtual;
  });

  // 1. Resumo Eventos Mês
  if (resumoEventosMes) {
    resumoEventosMes.textContent = eventosDoMes.length;
  }

  const agora = new Date();
  
  // 2. Próximo Evento (Futuros e ordenados)
  const proximos = eventos
    .map(ev => {
      const fullDateStr = ev.data + (ev.hora ? 'T' + ev.hora : '');
      const dateObj = new Date(fullDateStr); 
      return { ...ev, dateObj };
    })
    .filter(ev => ev.dateObj.getTime() >= agora.getTime()) 
    .sort((a, b) => a.dateObj - b.dateObj);

  if (resumoProximoEvento) {
    if (proximos.length > 0) {
        const proximoEv = proximos[0].dateObj;
        const dia = proximoEv.getDate();
        const mes = mesesAbreviados[proximoEv.getMonth()]; 
        resumoProximoEvento.textContent = `${dia} ${mes}`;
    } else {
        resumoProximoEvento.textContent = "—";
    }
  }

  // 3. Dias Ocupados
  const diasUnicos = new Set(eventosDoMes.map(ev => ev.data));
  if (resumoDiasOcupados) {
    resumoDiasOcupados.textContent = diasUnicos.size;
  }
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a renderização
    renderCalendar();
    atualizarResumo();
    
    // Garante que o filtro 'Todos' esteja ativo ao carregar
    const btnTodos = document.querySelector(".btn-filtro");
    if (btnTodos) {
      btnTodos.classList.add('active');
    }
});