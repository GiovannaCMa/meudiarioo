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

// --- 1. CONFIGURAÇÕES E PESOS ---
const pesosHumor = {
  "incrivel": 5,
  "excelente": 5,
  "muito-feliz": 5,
  "feliz": 4,
  "otimo": 4,
  "bom": 4,
  "produtivo": 4,
  "neutro": 3,
  "ansioso": 2,
  "ruim": 2,
  "pessimo": 1,
  "triste": 1,
  "muito-triste": 1
};

let imagensTemporarias = [];
let idAcaoAtual = null;

// --- 2. FUNÇÕES DE ESTATÍSTICAS ---

window.filtrarPeriodo = function (elemento, dias) {
  if (!dias) return;

  const botoes = document.querySelectorAll(".btn-filtro");
  botoes.forEach((b) => b.classList.remove("active"));

  elemento.classList.add("active");
  window.atualizarEstatisticas(Number(dias));
};

window.atualizarEstatisticas = function (diasAtras) {
  const registros = JSON.parse(localStorage.getItem("meuDiario") || "[]");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() - diasAtras);
  dataLimite.setHours(0, 0, 0, 0);

  const filtrados = registros.filter((reg) => {
    if (!reg.data) return false;
    const [dia, mes, ano] = reg.data.split("/");
    const dataReg = new Date(ano, mes - 1, dia);
    dataReg.setHours(0, 0, 0, 0);
    return dataReg.getTime() >= dataLimite.getTime();
  });

  const idsContainers = [
    "estatisticasHumor",
    "estatisticasSono",
    "estatisticasMental",
    "estatisticasProdutividade",
    "estatisticasFisico",
  ];

  if (filtrados.length === 0) {
    idsContainers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<li class="msg-sem-dados">Sem dados</li>`;
    });
    return;
  }

  const divisor = filtrados.length;

  const registroTop = filtrados.reduce((max, r) => {
    const pesoAtual = pesosHumor[r.humor] || 3;
    const pesoMax = pesosHumor[max.humor] || 3;
    return pesoAtual >= pesoMax ? r : max;
  }, filtrados[0]);

  const getMedia = (campo) => {
    const soma = filtrados.reduce((acc, r) => acc + Number(r[campo] || 0), 0);
    return (soma / divisor).toFixed(1);
  };

  const diasProdutivos = filtrados.filter(
    (r) => Number(r.produtividade) >= 4
  ).length;

  const dadosParaExibir = {
    estatisticasHumor: [
      `Média Humor: ${(filtrados.reduce((a, r) => a + (pesosHumor[r.humor] || 3), 0) / divisor).toFixed(1)}/5`,
      `Dias Ruins: ${filtrados.filter((r) => (pesosHumor[r.humor] || 3) < 3).length}`,
      `Melhor data: ${registroTop ? registroTop.data : "---"}`,
    ],
    estatisticasSono: [
      `Média Sono: ${getMedia("sono")}h`,
      `Energia: ${getMedia("energia")}/5`,
      `Total Sono: ${filtrados.reduce((acc, r) => acc + Number(r.sono || 0), 0)}h`,
    ],
    estatisticasMental: [
      `Saúde: ${getMedia("saude")}/5`,
      `Estabilidade: ${((filtrados.filter((r) => Number(r.saude) >= 4).length / divisor) * 100).toFixed(0)}%`,
      `Estresse alto: ${filtrados.filter((r) => Number(r.estresse || 0) >= 4).length} dias`,
    ],
    estatisticasProdutividade: [
      `Média Foco: ${getMedia("produtividade")}/5`,
      `Dias Produtivos: ${diasProdutivos}`,
      `Consistência: ${((diasProdutivos / divisor) * 100).toFixed(0)}%`,
    ],
    estatisticasFisico: [
      `Treinos: ${filtrados.filter((r) => r.exercicio !== "nenhum").length} dias`,
      `Total Água: ${filtrados.reduce((acc, r) => acc + Number(r.agua || 0), 0).toFixed(1)}L`,
      `Média Água: ${getMedia("agua")}L/dia`,
    ],
  };

  for (const id in dadosParaExibir) {
    const ul = document.getElementById(id);
    if (ul) ul.innerHTML = dadosParaExibir[id].map((texto) => `<li>${texto}</li>`).join("");
  }
};

// --- 3. LÓGICA DO DOM E CRUD ---

document.addEventListener("DOMContentLoaded", () => {
  const modalDiario = document.getElementById("modalDiario");
  const inputImg = document.getElementById("inputImgDiario");
  const listaDiario = document.getElementById("listaDiario");

  function renderizarPreviews() {
    const containers = document.querySelectorAll(".grid-fotos-preview");
    containers.forEach((container) => {
      container.innerHTML = imagensTemporarias.map((src, i) => `
            <div class="preview-item">
                <img src="${src}" class="foto-preview-card">
                <button type="button" class="btn-remove-foto" onclick="removerFoto(${i})">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            </div>`).join("");
    });
  }

  function fecharModal() {
    modalDiario.classList.remove("open");
    document.querySelectorAll(".modal input, .modal textarea, .modal select").forEach((el) => (el.value = ""));
    imagensTemporarias = [];
    idAcaoAtual = null;
    const containers = document.querySelectorAll(".grid-fotos-preview");
    containers.forEach(c => c.innerHTML = "");
  }

function renderizarTudo() {
    const registros = JSON.parse(localStorage.getItem("meuDiario") || "[]");
    
    // --- COLOQUE O CÓDIGO AQUI ---
    if (registros.length === 0) {
      listaDiario.innerHTML = `<div class="diario-vazio">Nenhuma entrada ainda...</div>`;
      // Se houver containers de estatísticas, limpe-os também
      window.atualizarEstatisticas(7); 
      return; // O return impede que o código abaixo tente rodar sem dados
    }
    // ----------------------------

    listaDiario.innerHTML = registros.map((r) => `
          <li class="diario-card-item" onclick="verRegistro(${r.id})">
            <div class="card-header"><span>${r.data}</span></div>
            <h3>${r.titulo}</h3>
            <p>${r.humor}</p>
          </li>`).join("");

    // O restante da sua função continua aqui...
  }

  document.getElementById("salvarRegistro").onclick = () => {
    const texto = document.getElementById("textoDiario").value;
    if (!texto) return alert("Escreva seu relato!");

    const banco = JSON.parse(localStorage.getItem("meuDiario") || "[]");
    const registro = {
      id: idAcaoAtual || Date.now(),
      data: idAcaoAtual ? banco.find((r) => r.id === idAcaoAtual).data : new Date().toLocaleDateString("pt-BR"),
      titulo: document.getElementById("tituloDiario").value || "Sem Título",
      humor: document.getElementById("humor").value,
      texto: texto,
      sono: document.getElementById("sono").value || 0,
      energia: document.getElementById("energia").value || 0,
      saude: document.getElementById("saude").value || 0,
      produtividade: document.getElementById("produtividade").value || 0,
      exercicio: document.getElementById("metricaExercicio").value,
      agua: document.getElementById("agua").value || 0,
      fotos: [...imagensTemporarias],
    };

    if (idAcaoAtual) {
      const index = banco.findIndex((r) => r.id === idAcaoAtual);
      banco[index] = registro;
    } else {
      banco.unshift(registro);
    }

    localStorage.setItem("meuDiario", JSON.stringify(banco));
    fecharModal();
    renderizarTudo();
  };

  window.verRegistro = function (id) {
    const registros = JSON.parse(localStorage.getItem("meuDiario") || "[]");
    const reg = registros.find((r) => r.id === id);
    if (!reg) return;

    idAcaoAtual = id;
    document.getElementById("verTitulo").innerText = reg.titulo;
    document.getElementById("verData").innerText = reg.data;
    document.getElementById("verTexto").innerText = reg.texto;

    document.getElementById("verMetricas").innerHTML = `
        <div class="badge-metrica"><i class="fas fa-smile"></i><div class="metrica-info"><strong>Humor</strong><span>${reg.humor}</span></div></div>
        <div class="badge-metrica"><i class="fas fa-bed"></i><div class="metrica-info"><strong>Sono</strong><span>${reg.sono}h</span></div></div>
        <div class="badge-metrica"><i class="fas fa-bolt"></i><div class="metrica-info"><strong>Energia</strong><span>${reg.energia}/5</span></div></div>
        <div class="badge-metrica"><i class="fas fa-heartbeat"></i><div class="metrica-info"><strong>Saúde</strong><span>${reg.saude}/5</span></div></div>
        <div class="badge-metrica"><i class="fas fa-chart-line"></i><div class="metrica-info"><strong>Produtiv.</strong><span>${reg.produtividade}/5</span></div></div>
        <div class="badge-metrica"><i class="fas fa-dumbbell"></i><div class="metrica-info"><strong>Exercício</strong><span>${reg.exercicio}</span></div></div>
        <div class="badge-metrica"><i class="fas fa-tint"></i><div class="metrica-info"><strong>Água</strong><span>${reg.agua}L</span></div></div>`;

    const containerFotos = document.getElementById("verFotos");
    containerFotos.innerHTML = reg.fotos.length > 0 ? reg.fotos.map(img => `
        <img src="${img}" onclick="abrirZoom('${img}')" style="width:100%; border-radius:12px; margin-bottom:10px; cursor: zoom-in;">`).join("") : "<p>Nenhuma foto.</p>";

    document.getElementById("modalVerRegistro").classList.add("open");
  };

  window.deletarRegistro = function (id) {
    if (confirm("Deseja excluir este registro?")) {
      let registros = JSON.parse(localStorage.getItem("meuDiario") || "[]");
      registros = registros.filter((r) => r.id !== id);
      localStorage.setItem("meuDiario", JSON.stringify(registros));
      document.getElementById("modalVerRegistro").classList.remove("open");
      renderizarTudo();
    }
  };

  window.abrirModalEditar = function () {
    const registros = JSON.parse(localStorage.getItem("meuDiario") || "[]");
    const reg = registros.find((r) => r.id === idAcaoAtual);
    if (!reg) return;

    document.getElementById("modalVerRegistro").classList.remove("open");
    document.getElementById("tituloDiario").value = reg.titulo;
    document.getElementById("textoDiario").value = reg.texto;
    document.getElementById("humor").value = reg.humor;
    document.getElementById("sono").value = reg.sono;
    document.getElementById("energia").value = reg.energia;
    document.getElementById("saude").value = reg.saude;
    document.getElementById("produtividade").value = reg.produtividade;
    document.getElementById("metricaExercicio").value = reg.exercicio;
    document.getElementById("agua").value = reg.agua;

    imagensTemporarias = [...reg.fotos];
    renderizarPreviews();
    modalDiario.classList.add("open");
  };

  inputImg.addEventListener("change", function () {
    Array.from(this.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagensTemporarias.push(e.target.result);
        renderizarPreviews();
      };
      reader.readAsDataURL(file);
    });
  });

  window.removerFoto = (index) => {
    imagensTemporarias.splice(index, 1);
    renderizarPreviews();
  };

  const modalZoom = document.getElementById("modalZoom");
  const imgZoomada = document.getElementById("imgZoomada");

  window.abrirZoom = function (src) {
    imgZoomada.src = src;
    modalZoom.classList.add("open");
  };

  document.getElementById("fecharZoom").onclick = () => modalZoom.classList.remove("open");
  modalZoom.onclick = (e) => { if (e.target === modalZoom) modalZoom.classList.remove("open"); };

  document.getElementById("btnAdicionarDiario").onclick = () => { idAcaoAtual = null; modalDiario.classList.add("open"); };
  document.getElementById("fecharModalDiario").onclick = fecharModal;
  document.getElementById("closeViewListModalBtn").onclick = () => document.getElementById("modalVerRegistro").classList.remove("open");
  document.getElementById("deleteListBtn").onclick = () => window.deletarRegistro(idAcaoAtual);
  document.getElementById("editListBtn").onclick = () => window.abrirModalEditar();

  renderizarTudo();
});