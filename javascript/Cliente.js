import { connSubaBase } from '../conexao/Supabase.js';

const form = document.getElementById('formCliente');
const tabela = document.getElementById('tabelaClientes');
const mensagem = document.getElementById('mensagem');
const busca = document.getElementById('campoPesquisa');
const id = document.getElementById('clienteId');
const tipo = document.getElementById('tipoCliente');
const cpfCnpj = document.getElementById('cpfCnpjCliente');
const nome = document.getElementById('nomeCliente');
const salvar = document.getElementById('btnSalvar');
const cancelar = document.getElementById('btnCancelarEdicao');
const modal = document.getElementById('modalListagem');
const paginacao = document.getElementById('paginacaoClientes');
const anterior = document.getElementById('btnPaginaAnterior');
const proxima = document.getElementById('btnProximaPagina');
const info = document.getElementById('infoPaginacao');
const POR_PAGINA = 5;
let pagina = 1;
let termoAtual = '';

function mostrarMensagem(texto, tipoMensagem) { mensagem.textContent = texto; mensagem.className = `mensagem ${tipoMensagem}`; }
function textoTipo(valor) { return valor === 'F' ? 'Pessoa física' : valor === 'J' ? 'Pessoa jurídica' : 'Não informado'; }
function atualizarPaginacao(total) {
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  paginacao.hidden = total === 0;
  info.textContent = `Página ${pagina} de ${totalPaginas} · ${total} cliente${total === 1 ? '' : 's'}`;
  anterior.disabled = pagina === 1;
  proxima.disabled = pagina === totalPaginas;
  return totalPaginas;
}

async function carregarClientes(novoTermo = termoAtual) {
  termoAtual = novoTermo.trim();
  tabela.innerHTML = '<tr><td colspan="4">Buscando clientes...</td></tr>';
  paginacao.hidden = true;
  let consulta = connSubaBase.from('CLIENTE')
    .select('CLIENTEID, TIPO_CLIENTE, CPF_CNPJ_CLIENTE, NOME_CLIENTE', { count: 'exact' });
  if (termoAtual) {
    const termoBusca = `%${termoAtual}%`;
    consulta = consulta.or(`NOME_CLIENTE.ilike.${termoBusca},CPF_CNPJ_CLIENTE.ilike.${termoBusca}`);
  }
  const inicio = (pagina - 1) * POR_PAGINA;
  const { data, error, count } = await consulta.order('CLIENTEID', { ascending: true }).range(inicio, inicio + POR_PAGINA - 1);
  if (error) { tabela.innerHTML = '<tr><td colspan="4">Erro ao carregar clientes.</td></tr>'; mostrarMensagem(`Erro ao buscar clientes: ${error.message}`, 'erro'); return; }
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (pagina > totalPaginas && total) { pagina = totalPaginas; return carregarClientes(termoAtual); }
  atualizarPaginacao(total);
  if (!data.length) { tabela.innerHTML = '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>'; return; }
  tabela.innerHTML = '';
  data.forEach((cliente) => {
    const linha = document.createElement('tr');
    const clienteCelula = document.createElement('td');
    clienteCelula.innerHTML = '<strong class="produto-nome"></strong><span class="produto-meta"></span>';
    clienteCelula.querySelector('.produto-nome').textContent = cliente.NOME_CLIENTE;
    clienteCelula.querySelector('.produto-meta').textContent = `Código ${cliente.CLIENTEID}`;
    const documento = document.createElement('td'); documento.textContent = cliente.CPF_CNPJ_CLIENTE;
    const tipoCelula = document.createElement('td'); tipoCelula.textContent = textoTipo(cliente.TIPO_CLIENTE);
    const acoes = document.createElement('td'); acoes.className = 'coluna-acoes';
    const editar = document.createElement('button'); editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar';
    editar.addEventListener('click', () => { prepararEdicao(cliente); fecharModal(); });
    const excluir = document.createElement('button'); excluir.type = 'button'; excluir.className = 'btn-excluir'; excluir.textContent = 'Excluir';
    excluir.addEventListener('click', () => excluirCliente(cliente));
    acoes.append(editar, excluir); linha.append(clienteCelula, documento, tipoCelula, acoes); tabela.appendChild(linha);
  });
}

function prepararEdicao(cliente) {
  id.value = cliente.CLIENTEID; tipo.value = cliente.TIPO_CLIENTE; cpfCnpj.value = cliente.CPF_CNPJ_CLIENTE; nome.value = cliente.NOME_CLIENTE;
  tipo.disabled = true; cpfCnpj.readOnly = true; salvar.textContent = 'Atualizar'; cancelar.style.display = 'inline-block';
  mostrarMensagem(`Editando o cliente: ${cliente.NOME_CLIENTE}`, 'sucesso'); nome.focus();
}
function cancelarEdicao() {
  form.reset(); id.value = ''; tipo.disabled = false; cpfCnpj.readOnly = false; salvar.textContent = 'Salvar'; cancelar.style.display = 'none'; mensagem.textContent = ''; mensagem.className = 'mensagem';
}
function camposValidos() {
  if (tipo.value && nome.value.trim() && cpfCnpj.value.trim()) return true;
  mostrarMensagem('Preencha todos os campos obrigatórios.', 'erro');
  (!tipo.value ? tipo : !nome.value.trim() ? nome : cpfCnpj).focus(); return false;
}
async function salvarCliente() {
  if (!camposValidos()) return;
  const { error } = await connSubaBase.from('CLIENTE').insert({ TIPO_CLIENTE: tipo.value, CPF_CNPJ_CLIENTE: cpfCnpj.value.trim(), NOME_CLIENTE: nome.value.trim() });
  if (error) return mostrarMensagem(`Erro ao salvar cliente: ${error.message}`, 'erro');
  mostrarMensagem('Cliente salvo com sucesso!', 'sucesso'); form.reset(); pagina = 1; carregarClientes();
}
async function atualizarCliente() {
  if (!nome.value.trim()) { mostrarMensagem('Informe o nome do cliente.', 'erro'); nome.focus(); return; }
  const { error } = await connSubaBase.from('CLIENTE').update({ NOME_CLIENTE: nome.value.trim() }).eq('CLIENTEID', id.value);
  if (error) return mostrarMensagem(`Erro ao atualizar cliente: ${error.message}`, 'erro');
  cancelarEdicao(); mostrarMensagem('Nome atualizado com sucesso!', 'sucesso'); carregarClientes();
}
async function excluirCliente(cliente) {
  if (!confirm(`Tem certeza que deseja excluir o cliente ${cliente.NOME_CLIENTE}?`)) return;
  const { error } = await connSubaBase.from('CLIENTE').delete().eq('CLIENTEID', cliente.CLIENTEID);
  if (error) return mostrarMensagem(`Erro ao excluir cliente: ${error.message}`, 'erro');
  if (id.value === String(cliente.CLIENTEID)) cancelarEdicao(); mostrarMensagem('Cliente excluído com sucesso!', 'sucesso'); carregarClientes();
}
function fecharModal() { modal.style.display = 'none'; }

form.addEventListener('submit', async (evento) => { evento.preventDefault(); if (id.value) await atualizarCliente(); else await salvarCliente(); });
cancelar.addEventListener('click', cancelarEdicao);
document.getElementById('btnListarClientesModal').addEventListener('click', () => { modal.style.display = 'flex'; pagina = 1; carregarClientes(busca.value); busca.focus(); });
document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
document.getElementById('btnPesquisar').addEventListener('click', () => { pagina = 1; carregarClientes(busca.value); });
busca.addEventListener('keydown', (evento) => { if (evento.key === 'Enter') { evento.preventDefault(); pagina = 1; carregarClientes(busca.value); } });
anterior.addEventListener('click', () => { if (pagina > 1) { pagina -= 1; carregarClientes(); } });
proxima.addEventListener('click', () => { pagina += 1; carregarClientes(); });
document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && modal.style.display !== 'none') fecharModal(); });
carregarClientes();
