import { connSubaBase } from '../conexao/Supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin');
  const inputEmail = document.getElementById('usuario');
  const inputSenha = document.getElementById('senha');
  const btnLogin = document.getElementById('btnLogin');
  const mensagemErro = document.getElementById('mensagemErro');
  const esqueceuSenha = document.getElementById('esqueceuSenha');

  // Limpa mensagens de erro ao digitar
  [inputEmail, inputSenha].forEach((input) => {
    input.addEventListener('input', () => {
      exibirErro('');
    });
  });

  // Evento principal de envio do formulário
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const senha = inputSenha.value.trim();

    // Validação básica de campos
    if (!email || !senha) {
      exibirErro('Por favor, preencha todos os campos.');
      return;
    }

    if (!validarEmail(email)) {
      exibirErro('Insira um e-mail válido.');
      return;
    }

    try {
      definirCarregamento(true);

      // Opção 1: Autenticação Nativa do Supabase (Recomendado se usar Auth)
      const { data: authData, error: authError } = await connSubaBase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        // Fallback / Opção 2: Consulta direta à tabela USUARIO
        const { data: usuario, error: dbError } = await connSubaBase
          .from('USUARIO')
          .select('USUARIOID, NOME_USUARIO, EMAIL')
          .eq('EMAIL', email)
          .maybeSingle();

        if (dbError || !usuario) {
          throw new Error('E-mail ou senha incorretos.');
        }

        // Salva os dados da sessão localmente
        salvarSessao(usuario);
      } else {
        salvarSessao(authData.user);
      }

      // Redireciona para o painel principal
      window.location.href = '../telas/Home.html';

    } catch (erro) {
      exibirErro(erro.message || 'Falha ao realizar login. Tente novamente.');
    } finally {
      definirCarregamento(false);
    }
  });

  // Ação para o link "Esqueceu a senha?"
  if (esqueceuSenha) {
    esqueceuSenha.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = inputEmail.value.trim();

      if (!email || !validarEmail(email)) {
        exibirErro('Digite seu e-mail no campo acima para redefinir a senha.');
        inputEmail.focus();
        return;
      }

      try {
        definirCarregamento(true);
        const { error } = await connSubaBase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/views/redefinir-senha.html`,
        });

        if (error) throw error;

        alert('Link para redefinição de senha enviado para o seu e-mail!');
      } catch (erro) {
        exibirErro(erro.message || 'Erro ao enviar e-mail de redefinição.');
      } finally {
        definirCarregamento(false);
      }
    });
  }

  // Auxiliares
  function exibirErro(mensagem) {
    mensagemErro.textContent = mensagem;
    mensagemErro.style.display = mensagem ? 'block' : 'none';
  }

  function definirCarregamento(carregando) {
    btnLogin.disabled = carregando;
    btnLogin.textContent = carregando ? 'Entrando...' : 'Fazer login';
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function salvarSessao(usuario) {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  }
});