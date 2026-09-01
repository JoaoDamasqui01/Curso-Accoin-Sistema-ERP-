document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formLogin");
  const emailInput = document.getElementById("usuario");
  const senhaInput = document.getElementById("senha");
  const mensagem = document.getElementById("mensagemErro");
  const botaoLogin = document.getElementById("btnLogin");
  const linkRecuperacao = document.getElementById("esqueceuSenha");

  function exibirMensagem(texto, tipo = "erro") {
    mensagem.textContent = texto;
    mensagem.style.display = "block";
    mensagem.style.color = tipo === "sucesso" ? "#198754" : "#d9534f";
  }

  function limparMensagem() {
    mensagem.textContent = "";
    mensagem.style.display = "none";
  }

  function definirCarregando(estaCarregando) {
    botaoLogin.disabled = estaCarregando;
    botaoLogin.textContent = estaCarregando ? "Entrando..." : "Fazer login";
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.replace("cadastroCliente.html");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = senhaInput.value;

    if (!email || !password) {
      exibirMensagem("Preencha o e-mail e a senha.");
      return;
    }

    limparMensagem();
    definirCarregando(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    definirCarregando(false);

    if (error) {
      exibirMensagem("Não foi possível entrar: " + error.message);
      return;
    }

    exibirMensagem("Login realizado. Redirecionando...", "sucesso");
    window.location.assign("cadastroCliente.html");
  });

  linkRecuperacao.addEventListener("click", async event => {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      exibirMensagem("Informe seu e-mail para recuperar a senha.");
      emailInput.focus();
      return;
    }

    limparMensagem();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href
    });

    if (error) {
      exibirMensagem("Não foi possível enviar o e-mail: " + error.message);
      return;
    }

    exibirMensagem("Enviamos as instruções de recuperação para seu e-mail.", "sucesso");
  });
});
