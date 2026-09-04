import { connSubaBase } from '../conexao/Supabase.js';
import { GERAR_RELATORIO_ORCAMENTO } from './Relatorio.js';

const $ = (id) => document.getElementById(id);
const POR_PAGINA = 5;
const form = $('formOrcamento');
const tabelaItens = $('tabelaItens');
const tabelaOrcamentos = $('tabelaOrcamentos');

let itens = [];
let clientes = [];
let produtos = [];
let usuarios = [];
let paginaAtual = 1;
let termoAtual = '';
let limpandoFormulario = false;

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (valor) => valor ? new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '-';
const ativo = (valor) => ['A', 'ATIVO', 'ACTIVE', '1', 'TRUE', ''].includes(String(valor ?? '').trim().toUpperCase());

function mostrarMensagem(texto, tipo) {
  $('mensagem').textContent = texto;
  $('mensagem').className = `mensagem ${tipo}`;
}

function preencherSelect(id, dados, campoId, campoTexto, textoPadrao) {
  const select = $(id);
  select.innerHTML = `<option value="">${textoPadrao}</option>`;
  dados.forEach((registro) => {
    const option = document.createElement('option');
    option.value = registro[campoId];
    option.textContent = registro[campoTexto];
    select.appendChild(option);
  });
}

async function carregarCadastros() {
  const [resClientes, resProdutos, resUsuarios] = await Promise.all([
    connSubaBase.from('CLIENTE').select('CLIENTEID, NOME_CLIENTE').order('NOME_CLIENTE'),
    connSubaBase.from('PRODUTO').select('PRODUTOID, DS_PRODUTO, VL_VENDA_PRODUTO, STATUS_PRODUTO, UNIDADE_MEDIDA').order('DS_PRODUTO'),
    connSubaBase.from('USUARIO').select('USUARIOID, NOME_USUARIO, STATUS').order('NOME_USUARIO')
  ]);

  const falhas = [];
  if (resClientes.error) {
    preencherSelect('clienteId', [], 'CLIENTEID', 'NOME_CLIENTE', 'Erro ao carregar clientes');
    falhas.push(`clientes: ${resClientes.error.message}`);
  } else {
    clientes = resClientes.data || [];
    preencherSelect('clienteId', clientes, 'CLIENTEID', 'NOME_CLIENTE', 'Selecione um cliente...');
  }

  if (resProdutos.error) {
    preencherSelect('produtoItem', [], 'PRODUTOID', 'DS_PRODUTO', 'Erro ao carregar produtos');
    falhas.push(`produtos: ${resProdutos.error.message}`);
  } else {
    produtos = (resProdutos.data || []).filter((produto) => ativo(produto.STATUS_PRODUTO));
    preencherSelect('produtoItem', produtos, 'PRODUTOID', 'DS_PRODUTO', 'Selecione um produto...');
  }

  if (resUsuarios.error) {
    preencherSelect('usuarioId', [], 'USUARIOID', 'NOME_USUARIO', 'Erro ao carregar usuários');
    falhas.push(`usuários: ${resUsuarios.error.message}`);
  } else {
    usuarios = (resUsuarios.data || []).filter((usuario) => ativo(usuario.STATUS));
    preencherSelect('usuarioId', usuarios, 'USUARIOID', 'NOME_USUARIO', 'Selecione o responsável...');
  }

  if (falhas.length) mostrarMensagem(`Falha ao carregar ${falhas.join(' | ')}`, 'erro');
}

function totalItens() {
  return itens.reduce((total, item) => total + item.quantidade * item.valorUnitario, 0);
}

function renderizarItens() {
  $('totalOrcamento').value = moeda(totalItens());
  tabelaItens.innerHTML = '';

  if (!itens.length) {
    tabelaItens.innerHTML = '<tr><td colspan="5">Nenhum item adicionado.</td></tr>';
    return;
  }

  itens.forEach((item, indice) => {
    const linha = document.createElement('tr');
    const produto = document.createElement('td');
    produto.innerHTML = '<strong class="produto-nome"></strong><span class="produto-meta"></span>';
    produto.querySelector('.produto-nome').textContent = item.nome;
    produto.querySelector('.produto-meta').textContent = [item.corSistema, item.observacao].filter(Boolean).join(' · ') || item.unidade || 'Sem observação';

    const quantidade = document.createElement('td');
    quantidade.textContent = item.quantidade.toLocaleString('pt-BR');
    const unitario = document.createElement('td');
    unitario.textContent = moeda(item.valorUnitario);
    const subtotal = document.createElement('td');
    subtotal.className = 'produto-preco';
    subtotal.textContent = moeda(item.quantidade * item.valorUnitario);

    const acoes = document.createElement('td');
    acoes.className = 'coluna-acoes';
    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'btn-excluir';
    remover.textContent = 'Remover';
    remover.addEventListener('click', () => {
      itens.splice(indice, 1);
      renderizarItens();
    });
    acoes.appendChild(remover);
    linha.append(produto, quantidade, unitario, subtotal, acoes);
    tabelaItens.appendChild(linha);
  });
}

function adicionarItem() {
  const produto = produtos.find((item) => String(item.PRODUTOID) === $('produtoItem').value);
  const quantidade = Number($('quantidadeItem').value);

  if (!produto || !Number.isFinite(quantidade) || quantidade <= 0) {
    mostrarMensagem('Selecione um produto e informe uma quantidade válida.', 'erro');
    return;
  }

  itens.push({
    produtoId: produto.PRODUTOID,
    nome: produto.DS_PRODUTO,
    unidade: produto.UNIDADE_MEDIDA,
    quantidade,
    valorUnitario: Number(produto.VL_VENDA_PRODUTO),
    corSistema: $('corSistemaItem').value.trim(),
    observacao: $('obsMisturaItem').value.trim()
  });
  $('produtoItem').value = '';
  $('quantidadeItem').value = '1';
  $('corSistemaItem').value = '';
  $('obsMisturaItem').value = '';
  renderizarItens();
}

function validarOrcamento() {
  if (!$('clienteId').value || !$('usuarioId').value || !$('dataOrcamento').value || !$('dataValidade').value) {
    mostrarMensagem('Preencha os dados obrigatórios do orçamento.', 'erro');
    return false;
  }
  if ($('dataValidade').value < $('dataOrcamento').value) {
    mostrarMensagem('A validade não pode ser anterior à data do orçamento.', 'erro');
    return false;
  }
  if (!itens.length) {
    mostrarMensagem('Adicione pelo menos um item ao orçamento.', 'erro');
    return false;
  }
  return true;
}

function dadosOrcamento() {
  return {
    CLIENTEID: Number($('clienteId').value),
    USUARIOID: Number($('usuarioId').value),
    DT_ORCAMENTO: $('dataOrcamento').value,
    DT_VALIDADE_ORCAMENTO: $('dataValidade').value,
    VL_TOTAL_ORCAMENTO: totalItens(),
    STATUS: 'PENDENTE'
  };
}

function dadosItens(orcamentoId) {
  return itens.map((item) => ({
    ORCAMENTOID: Number(orcamentoId),
    PRODUTOID: item.produtoId,
    QT_PRODUTO: item.quantidade,
    VL_UNITARIO: item.valorUnitario,
    VL_TOTAL: item.quantidade * item.valorUnitario,
    COR_SISTEMA: item.corSistema || null,
    OBS_MISTURA: item.observacao || null
  }));
}

function limparFormulario(limparMensagem = false) {
  limpandoFormulario = true;
  form.reset();
  limpandoFormulario = false;
  itens = [];
  $('orcamentoId').value = '';
  $('dataOrcamento').value = hoje();
  $('dataValidade').value = '';
  $('btnSalvar').textContent = 'Salvar orçamento';
  $('btnCancelarEdicao').style.display = 'none';
  if (limparMensagem) mostrarMensagem('', '');
  renderizarItens();
}

async function salvarOrcamento() {
  if (!validarOrcamento()) return;
  const { data, error } = await connSubaBase.from('ORCAMENTO').insert(dadosOrcamento()).select('ORCAMENTOID').single();
  if (error) return mostrarMensagem(`Erro ao salvar orçamento: ${error.message}`, 'erro');

  const { error: erroItens } = await connSubaBase.from('ORCAMENTO_ITEM').insert(dadosItens(data.ORCAMENTOID));
  if (erroItens) {
    await connSubaBase.from('ORCAMENTO').delete().eq('ORCAMENTOID', data.ORCAMENTOID);
    return mostrarMensagem(`Erro ao salvar os itens: ${erroItens.message}`, 'erro');
  }
  limparFormulario();
  mostrarMensagem('Orçamento salvo com sucesso!', 'sucesso');
  paginaAtual = 1;
  carregarOrcamentos();
}

async function atualizarOrcamento() {
  if (!validarOrcamento()) return;
  const orcamentoId = $('orcamentoId').value;
  const dados = dadosOrcamento();
  delete dados.STATUS;

  const { error } = await connSubaBase.from('ORCAMENTO').update(dados).eq('ORCAMENTOID', orcamentoId);
  if (error) return mostrarMensagem(`Erro ao atualizar orçamento: ${error.message}`, 'erro');

  const { error: erroExcluir } = await connSubaBase.from('ORCAMENTO_ITEM').delete().eq('ORCAMENTOID', orcamentoId);
  if (erroExcluir) return mostrarMensagem(`Erro ao atualizar os itens: ${erroExcluir.message}`, 'erro');

  const { error: erroItens } = await connSubaBase.from('ORCAMENTO_ITEM').insert(dadosItens(orcamentoId));
  if (erroItens) return mostrarMensagem(`Erro ao salvar os novos itens: ${erroItens.message}`, 'erro');

  limparFormulario();
  mostrarMensagem('Orçamento atualizado com sucesso!', 'sucesso');
  carregarOrcamentos();
}

function atualizarPaginacao(total) {
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  $('paginacaoOrcamentos').hidden = total === 0;
  $('infoPaginacao').textContent = `Página ${paginaAtual} de ${totalPaginas} · ${total} orçamento${total === 1 ? '' : 's'}`;
  $('btnPaginaAnterior').disabled = paginaAtual === 1;
  $('btnProximaPagina').disabled = paginaAtual === totalPaginas;
  return totalPaginas;
}

async function carregarOrcamentos(novoTermo = termoAtual) {
  termoAtual = novoTermo.trim();
  tabelaOrcamentos.innerHTML = '<tr><td colspan="7">Buscando orçamentos...</td></tr>';
  $('paginacaoOrcamentos').hidden = true;

  let consulta = connSubaBase.from('ORCAMENTO').select('ORCAMENTOID, CLIENTEID, USUARIOID, DT_ORCAMENTO, DT_VALIDADE_ORCAMENTO, VL_TOTAL_ORCAMENTO, STATUS', { count: 'exact' });
  if (termoAtual) {
    const idsClientes = clientes.filter((cliente) => cliente.NOME_CLIENTE.toLowerCase().includes(termoAtual.toLowerCase())).map((cliente) => cliente.CLIENTEID);
    if (!idsClientes.length) {
      tabelaOrcamentos.innerHTML = '<tr><td colspan="7">Nenhum orçamento encontrado.</td></tr>';
      return;
    }
    consulta = consulta.in('CLIENTEID', idsClientes);
  }

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const { data, error, count } = await consulta.order('ORCAMENTOID', { ascending: false }).range(inicio, inicio + POR_PAGINA - 1);
  if (error) {
    tabelaOrcamentos.innerHTML = '<tr><td colspan="7">Erro ao carregar orçamentos.</td></tr>';
    return mostrarMensagem(`Erro ao buscar orçamentos: ${error.message}`, 'erro');
  }

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (paginaAtual > totalPaginas && total) {
    paginaAtual = totalPaginas;
    return carregarOrcamentos(termoAtual);
  }
  atualizarPaginacao(total);
  if (!data.length) {
    tabelaOrcamentos.innerHTML = '<tr><td colspan="7">Nenhum orçamento encontrado.</td></tr>';
    return;
  }

  tabelaOrcamentos.innerHTML = '';
  data.forEach((orcamento) => {
    const linha = document.createElement('tr');
    const cliente = clientes.find((item) => item.CLIENTEID === orcamento.CLIENTEID);
    [orcamento.ORCAMENTOID, cliente?.NOME_CLIENTE || `Cliente #${orcamento.CLIENTEID}`, dataBR(orcamento.DT_ORCAMENTO), dataBR(orcamento.DT_VALIDADE_ORCAMENTO), moeda(orcamento.VL_TOTAL_ORCAMENTO), orcamento.STATUS || 'PENDENTE'].forEach((valor) => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    });

    const acoes = document.createElement('td');
    acoes.className = 'coluna-acoes';
    const vender = document.createElement('button');
    vender.type = 'button';
    vender.className = orcamento.STATUS === 'APROVADO' ? 'btn-pesquisar' : 'btn-salvar';
    vender.textContent = orcamento.STATUS === 'APROVADO' ? 'Aprovado' : 'Vender';
    vender.disabled = orcamento.STATUS === 'APROVADO';
    vender.addEventListener('click', () => aprovarOrcamento(orcamento.ORCAMENTOID));
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'btn-editar';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => prepararEdicao(orcamento));
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'btn-excluir';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', () => excluirOrcamento(orcamento));
    const imprimir = document.createElement('button');
    imprimir.type = 'button';
    imprimir.className = 'btn-imprimir';
    imprimir.textContent = 'Imprimir';
    imprimir.style.backgroundColor ='#6607ff';
    imprimir.style.color = '#FFFF';
    imprimir.addEventListener('click', () => prepararImprimir(orcamento.ORCAMENTOID));
    acoes.append(imprimir, vender, editar, excluir);
    linha.appendChild(acoes);
    tabelaOrcamentos.appendChild(linha);
  });
}

async function prepararEdicao(orcamento) {
  const { data, error } = await connSubaBase.from('ORCAMENTO_ITEM').select('PRODUTOID, QT_PRODUTO, VL_UNITARIO, COR_SISTEMA, OBS_MISTURA').eq('ORCAMENTOID', orcamento.ORCAMENTOID);
  if (error) return mostrarMensagem(`Erro ao carregar itens: ${error.message}`, 'erro');

  $('orcamentoId').value = orcamento.ORCAMENTOID;
  $('clienteId').value = orcamento.CLIENTEID;
  $('usuarioId').value = orcamento.USUARIOID;
  $('dataOrcamento').value = orcamento.DT_ORCAMENTO?.slice(0, 10) || '';
  $('dataValidade').value = orcamento.DT_VALIDADE_ORCAMENTO?.slice(0, 10) || '';
  itens = (data || []).map((item) => {
    const produto = produtos.find((registro) => registro.PRODUTOID === item.PRODUTOID);
    return { produtoId: item.PRODUTOID, nome: produto?.DS_PRODUTO || `Produto #${item.PRODUTOID}`, unidade: produto?.UNIDADE_MEDIDA, quantidade: Number(item.QT_PRODUTO), valorUnitario: Number(item.VL_UNITARIO), corSistema: item.COR_SISTEMA || '', observacao: item.OBS_MISTURA || '' };
  });
  renderizarItens();
  $('btnSalvar').textContent = 'Atualizar orçamento';
  $('btnCancelarEdicao').style.display = 'inline-block';
  $('modalListagem').style.display = 'none';
  mostrarMensagem(`Editando orçamento #${orcamento.ORCAMENTOID}`, 'sucesso');
}

async function excluirOrcamento(orcamento) {
  if (!confirm(`Deseja excluir o orçamento #${orcamento.ORCAMENTOID}?`)) return;
  const { error: erroItens } = await connSubaBase.from('ORCAMENTO_ITEM').delete().eq('ORCAMENTOID', orcamento.ORCAMENTOID);
  if (erroItens) return mostrarMensagem(`Erro ao excluir itens: ${erroItens.message}`, 'erro');
  const { error } = await connSubaBase.from('ORCAMENTO').delete().eq('ORCAMENTOID', orcamento.ORCAMENTOID);
  if (error) return mostrarMensagem(`Erro ao excluir orçamento: ${error.message}`, 'erro');
  mostrarMensagem('Orçamento excluído com sucesso!', 'sucesso');
  carregarOrcamentos();
}

async function aprovarOrcamento(orcamentoId) {
  if (!confirm(`Deseja aprovar e converter o orçamento #${orcamentoId} em venda?`)) return;
  const { error } = await connSubaBase.from('ORCAMENTO').update({ STATUS: 'APROVADO' }).eq('ORCAMENTOID', orcamentoId);
  if (error) return mostrarMensagem(`Erro ao realizar a venda: ${error.message}`, 'erro');
  mostrarMensagem(`Orçamento #${orcamentoId} convertido em venda com sucesso!`, 'sucesso');
  carregarOrcamentos();
}

async function prepararImprimir(orcamentoId) {
  try {
    mostrarMensagem(`Gerando relatório do orçamento #${orcamentoId}...`, 'sucesso');
    
    // A própria função já abre a janela e imprime
    await GERAR_RELATORIO_ORCAMENTO(orcamentoId);

  } catch (erro) {
    mostrarMensagem(`Erro ao imprimir orçamento: ${erro.message}`, 'erro');
  }
}



form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  $('orcamentoId').value ? atualizarOrcamento() : salvarOrcamento();
});
form.addEventListener('reset', () => {
  if (limpandoFormulario) return;
  setTimeout(() => {
    itens = [];
    $('orcamentoId').value = '';
    $('dataOrcamento').value = hoje();
    $('dataValidade').value = '';
    $('btnSalvar').textContent = 'Salvar orçamento';
    $('btnCancelarEdicao').style.display = 'none';
    mostrarMensagem('', '');
    renderizarItens();
  });
});
$('btnAdicionarItem').addEventListener('click', adicionarItem);
$('btnCancelarEdicao').addEventListener('click', () => limparFormulario(true));
$('btnListarOrcamentosModal').addEventListener('click', () => { $('modalListagem').style.display = 'flex'; paginaAtual = 1; carregarOrcamentos($('campoPesquisa').value); });
$('btnFecharModal').addEventListener('click', () => { $('modalListagem').style.display = 'none'; });
$('modalListagem').addEventListener('click', (evento) => { if (evento.target === $('modalListagem')) $('modalListagem').style.display = 'none'; });
$('btnPesquisar').addEventListener('click', () => { paginaAtual = 1; carregarOrcamentos($('campoPesquisa').value); });
$('campoPesquisa').addEventListener('keydown', (evento) => { if (evento.key === 'Enter') { evento.preventDefault(); paginaAtual = 1; carregarOrcamentos($('campoPesquisa').value); } });
$('btnPaginaAnterior').addEventListener('click', () => { if (paginaAtual > 1) { paginaAtual -= 1; carregarOrcamentos(); } });
$('btnProximaPagina').addEventListener('click', () => { paginaAtual += 1; carregarOrcamentos(); });
document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape') $('modalListagem').style.display = 'none'; });

async function inicializar() {
  $('dataOrcamento').value = hoje();
  renderizarItens();
  await carregarCadastros();
  await carregarOrcamentos();
}

inicializar();
