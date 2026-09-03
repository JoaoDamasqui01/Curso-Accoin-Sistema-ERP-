import { connSubaBase } from '../conexao/Supabase.js';

const formUsuario = document.getElementById('formUsuario');
const tabelaUsuarios = document.getElementById('tabelaUsuarios');
const mensagem = document.getElementById('mensagem');
const campoPesquisa = document.getElementById('campoPesquisa');
const usuarioIdInput = document.getElementById('usuarioId');
const nomeUsuarioInput = document.getElementById('nomeUsuario');
const emailUsuarioInput = document.getElementById('emailUsuario');
const perfilUsuarioInput = document.getElementById('perfilUsuario');
const statusUsuarioInput = document.getElementById('statusUsuario');
const senhaUsuarioInput = document.getElementById('senhaUsuario');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const modalListagem = document.getElementById('modalListagem');
const btnListarUsuariosModal = document.getElementById('btnListarUsuariosModal');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnPesquisar = document.getElementById('btnPesquisar');
const paginacaoUsuarios = document.getElementById('paginacaoUsuarios');
const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
const btnProximaPagina = document.getElementById('btnProximaPagina');
const infoPaginacao = document.getElementById('infoPaginacao');

const USUARIOS_POR_PAGINA = 5;
let paginaAtual = 1;
let termoAtual = '';

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function fecharModal() {
  modalListagem.style.display = 'none';
}

function cancelarEdicao() {
  formUsuario.reset();
  usuarioIdInput.value = '';
  senhaUsuarioInput.required = true;
  senhaUsuarioInput.placeholder = 'Mínimo de 5 caracteres';
  btnSalvar.textContent = 'Salvar';
  btnCancelarEdicao.style.display = 'none';
  mensagem.textContent = '';
  mensagem.className = 'mensagem';
}

function validarFormulario() {
  if (!nomeUsuarioInput.value.trim() || !emailUsuarioInput.value.trim() || !perfilUsuarioInput.value || !statusUsuarioInput.value) {
    mostrarMensagem('Preencha todos os campos obrigatórios.', 'erro');
    return false;
  }
  if (!usuarioIdInput.value && senhaUsuarioInput.value.length < 5) {
    mostrarMensagem('A senha deve ter ao menos 5 caracteres.', 'erro');
    senhaUsuarioInput.focus();
    return false;
  }
  if (usuarioIdInput.value && senhaUsuarioInput.value && senhaUsuarioInput.value.length < 5) {
    mostrarMensagem('A nova senha deve ter ao menos 5 caracteres.', 'erro');
    senhaUsuarioInput.focus();
    return false;
  }
  return true;
}

function criarStatus(status) {
  const indicador = document.createElement('span');
  indicador.className = `status-produto ${status === 'A' ? 'status-produto--ativo' : 'status-produto--inativo'}`;
  indicador.textContent = status === 'A' ? 'Ativo' : 'Inativo';
  return indicador;
}

function atualizarPaginacao(total) {
  const totalPaginas = Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA));
  paginacaoUsuarios.hidden = total === 0;
  infoPaginacao.textContent = `Página ${paginaAtual} de ${totalPaginas} · ${total} usuário${total === 1 ? '' : 's'}`;
  btnPaginaAnterior.disabled = paginaAtual === 1;
  btnProximaPagina.disabled = paginaAtual === totalPaginas;
  return totalPaginas;
}

async function carregarUsuarios(novoTermo = termoAtual) {
  termoAtual = novoTermo.trim();
  tabelaUsuarios.innerHTML = '<tr><td colspan="4">Buscando usuários...</td></tr>';
  paginacaoUsuarios.hidden = true;

  let consulta = connSubaBase
    .from('USUARIO')
    .select('USUARIOID, NOME_USUARIO, EMAIL, PERFIL, STATUS', { count: 'exact' });

  if (termoAtual) {
    const termoBusca = `%${termoAtual}%`;
    consulta = consulta.or(`NOME_USUARIO.ilike.${termoBusca},EMAIL.ilike.${termoBusca}`);
  }

  const inicio = (paginaAtual - 1) * USUARIOS_POR_PAGINA;
  const { data, error, count } = await consulta
    .order('USUARIOID', { ascending: true })
    .range(inicio, inicio + USUARIOS_POR_PAGINA - 1);

  if (error) {
    tabelaUsuarios.innerHTML = '<tr><td colspan="4">Erro ao carregar usuários.</td></tr>';
    mostrarMensagem(`Erro ao buscar usuários: ${error.message}`, 'erro');
    return;
  }

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA));
  if (paginaAtual > totalPaginas && total > 0) {
    paginaAtual = totalPaginas;
    return carregarUsuarios(termoAtual);
  }

  atualizarPaginacao(total);
  if (!data.length) {
    tabelaUsuarios.innerHTML = '<tr><td colspan="4">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  tabelaUsuarios.innerHTML = '';
  data.forEach((usuario) => {
    const linha = document.createElement('tr');
    const usuarioCelula = document.createElement('td');
    usuarioCelula.innerHTML = '<strong class="produto-nome"></strong><span class="produto-meta"></span>';
    usuarioCelula.querySelector('.produto-nome').textContent = usuario.NOME_USUARIO;
    usuarioCelula.querySelector('.produto-meta').textContent = usuario.EMAIL;

    const perfil = document.createElement('td');
    perfil.textContent = usuario.PERFIL || 'Não informado';
    const status = document.createElement('td');
    status.appendChild(criarStatus(usuario.STATUS));

    const acoes = document.createElement('td');
    acoes.className = 'coluna-acoes';
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'btn-editar';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => {
      prepararEdicao(usuario);
      fecharModal();
    });
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'btn-excluir';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', () => excluirUsuario(usuario));

    acoes.append(editar, excluir);
    linha.append(usuarioCelula, perfil, status, acoes);
    tabelaUsuarios.appendChild(linha);
  });
}

function prepararEdicao(usuario) {
  usuarioIdInput.value = usuario.USUARIOID;
  nomeUsuarioInput.value = usuario.NOME_USUARIO ?? '';
  emailUsuarioInput.value = usuario.EMAIL ?? '';
  perfilUsuarioInput.value = usuario.PERFIL ?? '';
  statusUsuarioInput.value = usuario.STATUS ?? 'A';
  senhaUsuarioInput.value = '';
  senhaUsuarioInput.required = false;
  senhaUsuarioInput.placeholder = 'Deixe em branco para manter a senha atual';
  btnSalvar.textContent = 'Atualizar';
  btnCancelarEdicao.style.display = 'inline-block';
  mostrarMensagem(`Editando o usuário: ${usuario.NOME_USUARIO}`, 'sucesso');
  nomeUsuarioInput.focus();
}

async function salvarUsuario() {
  if (!validarFormulario()) return;
  const { error } = await connSubaBase.from('USUARIO').insert({
    NOME_USUARIO: nomeUsuarioInput.value.trim(),
    EMAIL: emailUsuarioInput.value.trim(),
    PERFIL: perfilUsuarioInput.value,
    STATUS: statusUsuarioInput.value,
    SENHA: senhaUsuarioInput.value
  });
  if (error) return mostrarMensagem(`Erro ao salvar usuário: ${error.message}`, 'erro');
  mostrarMensagem('Usuário salvo com sucesso!', 'sucesso');
  formUsuario.reset();
  paginaAtual = 1;
  carregarUsuarios();
}

async function atualizarUsuario() {
  if (!validarFormulario()) return;
  const dadosUsuario = {
    NOME_USUARIO: nomeUsuarioInput.value.trim(),
    EMAIL: emailUsuarioInput.value.trim(),
    PERFIL: perfilUsuarioInput.value,
    STATUS: statusUsuarioInput.value
  };
  if (senhaUsuarioInput.value) dadosUsuario.SENHA = senhaUsuarioInput.value;

  const { error } = await connSubaBase
    .from('USUARIO')
    .update(dadosUsuario)
    .eq('USUARIOID', usuarioIdInput.value);
  if (error) return mostrarMensagem(`Erro ao atualizar usuário: ${error.message}`, 'erro');
  cancelarEdicao();
  mostrarMensagem('Usuário atualizado com sucesso!', 'sucesso');
  carregarUsuarios();
}

async function excluirUsuario(usuario) {
  if (!confirm(`Deseja excluir o usuário ${usuario.NOME_USUARIO}?`)) return;
  const { error } = await connSubaBase.from('USUARIO').delete().eq('USUARIOID', usuario.USUARIOID);
  if (error) return mostrarMensagem(`Erro ao excluir usuário: ${error.message}`, 'erro');
  if (usuarioIdInput.value === String(usuario.USUARIOID)) cancelarEdicao();
  mostrarMensagem('Usuário excluído com sucesso!', 'sucesso');
  carregarUsuarios();
}

function buscarUsuarios() {
  paginaAtual = 1;
  carregarUsuarios(campoPesquisa.value);
}

formUsuario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (usuarioIdInput.value) await atualizarUsuario();
  else await salvarUsuario();
});
btnCancelarEdicao.addEventListener('click', cancelarEdicao);
btnListarUsuariosModal.addEventListener('click', () => {
  modalListagem.style.display = 'flex';
  paginaAtual = 1;
  carregarUsuarios(campoPesquisa.value);
  campoPesquisa.focus();
});
btnFecharModal.addEventListener('click', fecharModal);
modalListagem.addEventListener('click', (evento) => { if (evento.target === modalListagem) fecharModal(); });
btnPesquisar.addEventListener('click', buscarUsuarios);
campoPesquisa.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') { evento.preventDefault(); buscarUsuarios(); }
});
btnPaginaAnterior.addEventListener('click', () => {
  if (paginaAtual > 1) { paginaAtual -= 1; carregarUsuarios(); }
});
btnProximaPagina.addEventListener('click', () => { paginaAtual += 1; carregarUsuarios(); });
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && modalListagem.style.display !== 'none') fecharModal();
});

carregarUsuarios();
