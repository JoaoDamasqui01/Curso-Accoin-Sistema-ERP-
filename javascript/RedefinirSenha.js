import { connSubaBase } from '../conexao/Supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRedefinirSenha');
  const inputSenha = document.getElementById('senha');
  const inputConfirmar = document.getElementById('confirmarSenha');
  const btnRedefinir = document.getElementById('btnRedefinir');
  const mensagemStatus = document.getElementById('mensagemStatus');

  // Limpa mensagens ao digitar
  [inputSenha, inputConfirmar].forEach((input) => {
    input.addEventListener('input', () => exibirMensagem(''));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaSenha = inputSenha.value.trim();
    const confirmacao = inputConfirmar.value.trim();

    // Validação dos campos
    if (!novaSenha || !confirmacao) {
      exibirMensagem('Preencha todos os campos.', true);
      return;
    }

    if (novaSenha.length < 6) {
      exibirMensagem('A senha deve ter no mínimo 6 caracteres.', true);
      return;
    }

    if (novaSenha !== confirmacao) {
      exibirMensagem('As senhas não coincidem.', true);
      return;
    }

    try {
      definirCarregamento(true);

      // Atualiza a senha no Supabase Auth
      const { error } = await connSubaBase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      exibirMensagem('Senha alterada com sucesso! Redirecionando...', false);

      setTimeout(() => {
        window.location.replace('Login.html');
      }, 2000);

    } catch (erro) {
      exibirMensagem(erro.message || 'Erro ao redefinir a senha.', true);
    } finally {
      definirCarregamento(false);
    }
  });

  function exibirMensagem(texto, ehErro = true) {
    mensagemStatus.textContent = texto;
    mensagemStatus.style.display = texto ? 'block' : 'none';
    mensagemStatus.style.color = ehErro ? '#ef4444' : '#10b981';
  }

  function definirCarregamento(carregando) {
    btnRedefinir.disabled = carregando;
    btnRedefinir.textContent = carregando ? 'Salvando...' : 'Salvar Nova Senha';
  }
});