// Controle de mostrar/ocultar senha
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

    feather.replace(); // atualiza ícone
  });
});


// ---------- Cadastro ----------
const formCadastro = document.getElementById("formCadastro");
const erroCadastro = document.getElementById("erroCadastro");

if (formCadastro) {
  const senha = document.getElementById("senha1");
  const confirmar = document.getElementById("senha2");

  // Remove erro quando o usuário digita
  senha.addEventListener("input", limparErroCadastro);
  confirmar.addEventListener("input", limparErroCadastro);

  formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();

    limparErroCadastro();

    // Validação
    if (senha.value !== confirmar.value) {
      erroCadastro.textContent = "As senhas não conferem.";
      erroCadastro.classList.add("ativo");

      senha.classList.add("input-error");
      confirmar.classList.add("input-error");

      confirmar.focus();
      return;
    }

    // Salva no localStorage
    const usuario = {
      nome: document.getElementById("nome").value,
      email: document.getElementById("email").value,
      senha: document.getElementById("senha1").value
    };

    localStorage.setItem("usuario", JSON.stringify(usuario));

    alert("Cadastro salvo com sucesso!");
    formCadastro.reset();
  });

  function limparErroCadastro() {
    erroCadastro.textContent = "";
    erroCadastro.classList.remove("ativo");

    senha.classList.remove("input-error");
    confirmar.classList.remove("input-error");
  }
}

// ---------- Login ----------
const formLogin = document.querySelector("form"); // pega o form do login
const erroLogin = document.getElementById("errologin");

if (formLogin) {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");

  // Remove erro quando o usuário digita
  emailInput.addEventListener("input", limparErroLogin);
  senhaInput.addEventListener("input", limparErroLogin);

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    // Limpa erro anterior
    limparErroLogin();

    const emailLogin = emailInput.value;
    const senhaLogin = senhaInput.value;

    const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));

    if (!usuarioSalvo || emailLogin !== usuarioSalvo.email || senhaLogin !== usuarioSalvo.senha) {
      erroLogin.textContent = "Email ou senha incorretos.";
      erroLogin.classList.add("ativo");
    } else {
      window.location.href = "../home/home.html"
      // Aqui você pode redirecionar para outra página
      // window.location.href = "home.html";
    }
  });

  function limparErroLogin() {
    erroLogin.textContent = "";
    erroLogin.classList.remove("ativo");
  }
}