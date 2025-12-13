/* ============================================================
   MOSTRAR / ESCONDER SENHA
   ============================================================ */
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const alvo = document.getElementById(btn.dataset.target);

    if (alvo.type === "password") {
      alvo.type = "text";
      btn.innerHTML = `<i data-feather="eye"></i>`;
    } else {
      alvo.type = "password";
      btn.innerHTML = `<i data-feather="eye-off"></i>`;
    }

    feather.replace();
  });
});


/* ============================================================
   FUNÇÕES PARA CHAVES POR USUÁRIO
   ============================================================ */
function userKey(tipo) {
  const email = localStorage.getItem("usuarioLogado");
  return `${tipo}_${email}`;
}

function loadUserData(tipo) {
  return JSON.parse(localStorage.getItem(userKey(tipo))) || [];
}

function saveUserData(tipo, data) {
  localStorage.setItem(userKey(tipo), JSON.stringify(data));
}



/* ============================================================
   CADASTRO
   ============================================================ */
const formCadastro = document.getElementById("formCadastro");
const erroCadastro = document.getElementById("erroCadastro");

if (formCadastro) {
  formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha1 = document.getElementById("senha1").value.trim();
    const senha2 = document.getElementById("senha2").value.trim();

    erroCadastro.textContent = "";
    erroCadastro.classList.remove("ativo");

    // Email já existe
    if (localStorage.getItem(`senha_${email}`)) {
      erroCadastro.textContent = "Este email já está cadastrado! Faça login.";
      erroCadastro.classList.add("ativo");

      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);

      return;
    }

    // Senhas não coincidem
    if (senha1 !== senha2) {
      erroCadastro.textContent = "As senhas não coincidem.";
      erroCadastro.classList.add("ativo");
      return;
    }

    // Salvar novo usuário
    localStorage.setItem(`senha_${email}`, senha1);
    localStorage.setItem(`nome_${email}`, nome);

    window.location.href = "../index.html";
  });
}



/* ============================================================
   LOGIN
   ============================================================ */
const formLogin = document.getElementById("formLogin");
const erroLogin = document.getElementById("errologin");

if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const senhaSalva = localStorage.getItem(`senha_${email}`);

    // Email não encontrado
    if (!senhaSalva) {
      erroLogin.textContent = "Email não encontrado! Faça o cadastro.";
      erroLogin.classList.add("ativo");

      setTimeout(() => {
        window.location.href = "../accouts/cadastro.html";
      }, 1200);

      return;
    }

    // Senha incorreta
    if (senhaSalva !== senha) {
      erroLogin.textContent = "Senha incorreta.";
      erroLogin.classList.add("ativo");
      return;
    }

    // Login OK
    localStorage.setItem("usuarioLogado", email);

    window.location.href = "../home/home.html";
  });

  // limpar erros ao digitar
  function limparErroLogin() {
    erroLogin.textContent = "";
    erroLogin.classList.remove("ativo");
  }

  document.getElementById("email").addEventListener("input", limparErroLogin);
  document.getElementById("senha").addEventListener("input", limparErroLogin);
}

/* ============================================================
   FUNÇÕES PARA LOCALSTORAGE INDIVIDUAL POR USUÁRIO
   ============================================================ */

// Gera uma chave única usando o email do usuário logado
function userKey(tipo) {
  const email = localStorage.getItem("usuarioLogado");
  return `${tipo}_${email}`; 
}

// Carrega os dados desse usuário (eventos, lista, lembretes, diario)
function loadUserData(tipo) {
  return JSON.parse(localStorage.getItem(userKey(tipo))) || [];
}

// Salva dados SOMENTE do usuário atual
function saveUserData(tipo, data) {
  localStorage.setItem(userKey(tipo), JSON.stringify(data));
}

/* ============================================================
   CARREGAR OS DADOS SOMENTE NA HOME
   ============================================================ */
if (window.location.pathname.includes("home.html")) {

  // Eventos
  var eventos = loadUserData("eventos");
  function salvarEventos() {
    saveUserData("eventos", eventos);
  }

  // Listas
  var lista = loadUserData("lista");
  function salvarLista() {
    saveUserData("lista", lista);
  }

  // Lembretes
  var lembretes = loadUserData("lembretes");
  function salvarLembretes() {
    saveUserData("lembretes", lembretes);
  }

  // Diário
  var diario = loadUserData("diario");
  function salvarDiario() {
    saveUserData("diario", diario);
  }
}
