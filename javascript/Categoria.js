import { connSubaBase } from '../conexao/Supabase.js';

const form = document.getElementById('formCategoriaProduto');
const tabela = document.getElementById('tabelaCategorias');
const mensagem = document.getElementById('mensagem');
const busca = document.getElementById('campoPesquisa');
const id = document.getElementById('categoriaProdutoId');
const descricao = document.getElementById('dsCategoriaProduto');
const observacao = document.getElementById('obsCategoriaProduto');
const salvar = document.getElementById('btnSalvar');
const cancelar = document.getElementById('btnCancelarEdicao');
const modal = document.getElementById('modalListagem');
const paginacao = document.getElementById('paginacaoCategorias');
const anterior = document.getElementById('btnPaginaAnterior');
const proxima = document.getElementById('btnProximaPagina');
const info = document.getElementById('infoPaginacao');
const POR_PAGINA = 5;
let pagina = 1;
let termo = '';

function mensagemNaTela(texto, tipo) { mensagem.textContent = texto; mensagem.className = `mensagem ${tipo}`; }
function atualizarPaginacao(total) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  paginacao.hidden = total === 0;
  info.textContent = `Página ${pagina} de ${paginas} · ${total} categoria${total === 1 ? '' : 's'}`;
  anterior.disabled = pagina === 1;
  proxima.disabled = pagina === paginas;
  return paginas;
}

async function carregarCategorias(novoTermo = termo) {
  termo = novoTermo.trim();
  tabela.innerHTML = '<tr><td colspan="3">Buscando categorias...</td></tr>';
  paginacao.hidden = true;
  let consulta = connSubaBase.from('CATEGORIA_PRODUTO')
    .select('CATEGORIAPRODUTOID, DS_CATEGORIA_PRODUTO, OBS_CATEGORIA_PRODUTO', { count: 'exact' });
  if (termo) consulta = consulta.ilike('DS_CATEGORIA_PRODUTO', `%${termo}%`);
  const inicio = (pagina - 1) * POR_PAGINA;
  const { data, error, count } = await consulta.order('CATEGORIAPRODUTOID', { ascending: true }).range(inicio, inicio + POR_PAGINA - 1);
  if (error) { tabela.innerHTML = '<tr><td colspan="3">Erro ao carregar categorias.</td></tr>'; mensagemNaTela(`Erro ao buscar categorias`, 'erro'); return; }
  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (pagina > paginas && total) { pagina = paginas; return carregarCategorias(termo); }
  atualizarPaginacao(total);
  if (!data.length) { tabela.innerHTML = '<tr><td colspan="3">Nenhuma categoria encontrada.</td></tr>'; return; }
  tabela.innerHTML = '';
  data.forEach((item) => {
    const linha = document.createElement('tr');
    const categoria = document.createElement('td');
    categoria.innerHTML = '<strong class="produto-nome"></strong><span class="produto-meta"></span>';
    categoria.querySelector('.produto-nome').textContent = item.DS_CATEGORIA_PRODUTO;
    categoria.querySelector('.produto-meta').textContent = `Código ${item.CATEGORIAPRODUTOID}`;
    const obs = document.createElement('td'); obs.textContent = item.OBS_CATEGORIA_PRODUTO || 'Sem observação';
    const acoes = document.createElement('td'); acoes.className = 'coluna-acoes';
    const editar = document.createElement('button'); editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar';
    editar.addEventListener('click', () => { prepararEdicao(item); fecharModal(); });
    const excluir = document.createElement('button'); excluir.type = 'button'; excluir.className = 'btn-excluir'; excluir.textContent = 'Excluir';
    excluir.addEventListener('click', () => excluirCategoria(item));
    acoes.append(editar, excluir); linha.append(categoria, obs, acoes); tabela.appendChild(linha);
  });
}

function prepararEdicao(item) {
  id.value = item.CATEGORIAPRODUTOID; descricao.value = item.DS_CATEGORIA_PRODUTO; observacao.value = item.OBS_CATEGORIA_PRODUTO ?? '';
  salvar.textContent = 'Atualizar'; cancelar.style.display = 'inline-block'; mensagemNaTela(`Editando a categoria: ${item.DS_CATEGORIA_PRODUTO}`, 'sucesso'); descricao.focus();
}
function cancelarEdicao() { form.reset(); id.value = ''; salvar.textContent = 'Salvar'; cancelar.style.display = 'none'; mensagem.textContent = ''; mensagem.className = 'mensagem'; }
function valido() {
  if (descricao.value.trim() && observacao.value.trim()) return true;
  mensagemNaTela('Preencha a descrição e a observação da categoria.', 'erro');
  (descricao.value.trim() ? observacao : descricao).focus(); return false;
}
async function salvarCategoria() {
  if (!valido()) return;
  const { error } = await connSubaBase.from('CATEGORIA_PRODUTO').insert({ DS_CATEGORIA_PRODUTO: descricao.value.trim(), OBS_CATEGORIA_PRODUTO: observacao.value.trim() });
  if (error) return mensagemNaTela(`Erro ao salvar categoria`, 'erro');
  mensagemNaTela('Categoria salva com sucesso!', 'sucesso'); form.reset(); pagina = 1; carregarCategorias();
}
async function atualizarCategoria() {
  if (!valido()) return;
  const { error } = await connSubaBase.from('CATEGORIA_PRODUTO').update({ DS_CATEGORIA_PRODUTO: descricao.value.trim(), OBS_CATEGORIA_PRODUTO: observacao.value.trim() }).eq('CATEGORIAPRODUTOID', id.value);
  if (error) return mensagemNaTela(`Erro ao atualizar categoria`, 'erro');
  cancelarEdicao(); mensagemNaTela('Categoria atualizada com sucesso!', 'sucesso'); carregarCategorias();
}
async function excluirCategoria(item) {
  if (!confirm(`Deseja excluir a categoria ${item.DS_CATEGORIA_PRODUTO}?`)) return;
  const { error } = await connSubaBase.from('CATEGORIA_PRODUTO').delete().eq('CATEGORIAPRODUTOID', item.CATEGORIAPRODUTOID);
  if (error) return mensagemNaTela(`Erro ao excluir categoria: A Categória está referenciando um produto existente, altere o nome da Categória`);
  if (id.value === String(item.CATEGORIAPRODUTOID)) cancelarEdicao(); mensagemNaTela('Categoria excluída com sucesso!', 'sucesso'); carregarCategorias();
}
function fecharModal() { modal.style.display = 'none'; }

form.addEventListener('submit', async (evento) => { evento.preventDefault(); if (id.value) await atualizarCategoria(); else await salvarCategoria(); });
cancelar.addEventListener('click', cancelarEdicao);
document.getElementById('btnListarCategoriasModal').addEventListener('click', () => { modal.style.display = 'flex'; pagina = 1; carregarCategorias(busca.value); busca.focus(); });
document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
document.getElementById('btnPesquisar').addEventListener('click', () => { pagina = 1; carregarCategorias(busca.value); });
busca.addEventListener('keydown', (evento) => { if (evento.key === 'Enter') { evento.preventDefault(); pagina = 1; carregarCategorias(busca.value); } });
anterior.addEventListener('click', () => { if (pagina > 1) { pagina -= 1; carregarCategorias(); } });
proxima.addEventListener('click', () => { pagina += 1; carregarCategorias(); });
document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && modal.style.display !== 'none') fecharModal(); });
carregarCategorias();
