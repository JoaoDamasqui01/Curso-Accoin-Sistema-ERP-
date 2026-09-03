import { connSubaBase } from '../conexao/Supabase.js';

/*
  ============================================
  ELEMENTOS DO DOM
  ============================================
*/
const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagem = document.getElementById("mensagem");

const produtoIdInput = document.getElementById("produtoId");
const dsProdutoInput = document.getElementById("dsProduto");
const categoriaSelect = document.getElementById("categoriaProdutoId");
const vlVendaInput = document.getElementById("vlVendaProduto");
const statusProdutoSelect = document.getElementById("statusProduto");
const obsProdutoInput = document.getElementById("obsProduto");

// Campos de Tintas & Pintura
const unidadeMedida = document.getElementById("unidadeMediada");
const marca = document.getElementById("marca");
const cor = document.getElementById("cor");
const acabamento = document.getElementById("acabamento");
const rendimentoPorLitroInput = document.getElementById("rendimentoPorLitro");
const rendimentoM2 = document.getElementById("rendimentoM2");

const campoPesquisa = document.getElementById("campoPesquisa");
const btnPesquisar = document.getElementById("btnPesquisar");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

// Elementos do Modal Flutuante
const btnListarProdutosModal = document.getElementById("btnListarProdutosModal");
const modalListagem = document.getElementById("modalListagem");
const btnFecharModal = document.getElementById("btnFecharModal");
const paginacaoProdutos = document.getElementById("paginacaoProdutos");
const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
const btnProximaPagina = document.getElementById("btnProximaPagina");
const infoPaginacao = document.getElementById("infoPaginacao");

const PRODUTOS_POR_PAGINA = 7;
let paginaAtual = 1;

/*
  ============================================
  MENSAGENS NA TELA
  ============================================
*/
function mostrarMensagem(texto, tipo) {
  if (mensagem) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
  }
}

/*
  ============================================
  CARREGAR SELECT DE CATEGORIAS
  ============================================
*/
async function carregarSelectCategorias() {
  if (!categoriaSelect) return;

  const { data, error } = await connSubaBase
    .from("CATEGORIA_PRODUTO")
    .select("CATEGORIAPRODUTOID, DS_CATEGORIA_PRODUTO")
    .order("DS_CATEGORIA_PRODUTO", { ascending: true });

  if (error) {
    categoriaSelect.innerHTML = `<option value="">Erro ao carregar categorias</option>`;
    return;
  }

  categoriaSelect.innerHTML = `<option value="">Selecione uma categoria...</option>`;

  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.CATEGORIAPRODUTOID;
    option.textContent = cat.DS_CATEGORIA_PRODUTO;
    categoriaSelect.appendChild(option);
  });
}

/*
  ============================================
  CÁLCULO AUTOMÁTICO DE RENDIMENTO
  ============================================
*/
function extrairUnidadeDaEmbalagem(textoUnidade) {
  if (!textoUnidade) return 0;

  const matchLitros = textoUnidade.match(/([\d.,]+)\s*L/i);
  if (matchLitros) {
    return parseFloat(matchLitros[1].replace(",", "."));
  }

  const matchMl = textoUnidade.match(/([\d.,]+)\s*mL/i);
  if (matchMl) {
    return parseFloat(matchMl[1].replace(",", ".")) / 1000;
  }

  return 0;
}

function calcularRendimentoAutomacao() {
  const textoEmbalagem = unidadeMedida ? unidadeMedida.value : "";
  const rendimentoPorLitro = parseFloat(rendimentoPorLitroInput?.value || 0);

  const litros = extrairUnidadeDaEmbalagem(textoEmbalagem);

  if (litros > 0 && rendimentoPorLitro > 0) {
    const rendimentoTotal = litros * rendimentoPorLitro;
    if (rendimentoM2) rendimentoM2.value = rendimentoTotal.toFixed(2);
  } else {
    if (rendimentoM2) rendimentoM2.value = "";
  }
}

if (unidadeMedida) {
  unidadeMedida.addEventListener("change", calcularRendimentoAutomacao);
  unidadeMedida.addEventListener("input", calcularRendimentoAutomacao);
}

if (rendimentoPorLitroInput) {
  rendimentoPorLitroInput.addEventListener("input", calcularRendimentoAutomacao);
}

/*
  ============================================
  CARREGAR PRODUTOS (TABELA PRINCIPAL)
  ============================================
*/
function atualizarPaginacao(totalProdutos) {
  const totalPaginas = Math.max(1, Math.ceil(totalProdutos / PRODUTOS_POR_PAGINA));

  if (!paginacaoProdutos) return totalPaginas;

  paginacaoProdutos.hidden = totalProdutos === 0;
  if (infoPaginacao) {
    infoPaginacao.textContent = `Página ${paginaAtual} de ${totalPaginas} · ${totalProdutos} produto${totalProdutos === 1 ? "" : "s"}`;
  }
  if (btnPaginaAnterior) btnPaginaAnterior.disabled = paginaAtual === 1;
  if (btnProximaPagina) btnProximaPagina.disabled = paginaAtual === totalPaginas;

  return totalPaginas;
}

async function carregarProdutos(termoBusca = "") {
  if (!tabelaProdutos) return;

  tabelaProdutos.innerHTML = `<tr><td colspan="8">Buscando produtos...</td></tr>`;
  if (paginacaoProdutos) paginacaoProdutos.hidden = true;

  let query = connSubaBase
    .from("PRODUTO")
    .select(`
      PRODUTOID,
      DS_PRODUTO,
      VL_VENDA_PRODUTO,
      UNIDADE_MEDIDA,
      MARCA,
      COR,
      ACABAMENTO,
      RENDIMENTO_M2,
      OBS_PRODUTO,
      STATUS_PRODUTO,
      DT_CADASTRO_PRODUTO,
      CATEGORIAPRODUTOID,
      CATEGORIA_PRODUTO ( DS_CATEGORIA_PRODUTO )
    `, { count: "exact" });

  if (termoBusca.trim() !== "") {
    query = query.ilike("DS_PRODUTO", `%${termoBusca.trim()}%`);
  }

  const inicio = (paginaAtual - 1) * PRODUTOS_POR_PAGINA;
  const fim = inicio + PRODUTOS_POR_PAGINA - 1;
  const { data, error, count } = await query
    .order("PRODUTOID", { ascending: true })
    .range(inicio, fim);

  if (error) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Erro ao carregar produtos.</td></tr>`;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  const totalProdutos = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalProdutos / PRODUTOS_POR_PAGINA));

  if (paginaAtual > totalPaginas && totalProdutos > 0) {
    paginaAtual = totalPaginas;
    return carregarProdutos(termoBusca);
  }

  atualizarPaginacao(totalProdutos);

  if (data.length === 0) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tabelaProdutos.innerHTML = "";

  data.forEach(item => {
    const linha = document.createElement("tr");

    const valorFormatado = Number(item.VL_VENDA_PRODUTO || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const nomeCategoria = item.CATEGORIA_PRODUTO ? item.CATEGORIA_PRODUTO.DS_CATEGORIA_PRODUTO : 'Sem Categoria';
    const statusTexto = item.STATUS_PRODUTO === 'A' ? 'Ativo' : 'Inativo';
    const statusClasse = item.STATUS_PRODUTO === 'A' ? 'status-produto--ativo' : 'status-produto--inativo';
    const rendimentoTexto = item.RENDIMENTO_M2 ? `${item.RENDIMENTO_M2} m²` : '-';

    linha.innerHTML = `
      <td>
        <div class="produto-identificacao">
         
          <div><strong class="produto-nome">${item.DS_PRODUTO}</strong><span class="produto-meta">${item.UNIDADE_MEDIDA || 'Embalagem não informada'}</span></div>
        </div>
      </td>
      <td>${nomeCategoria}</td>
      <td class="produto-marca">${item.MARCA || 'Não informada'}</td>
      <td>
        <div class="produto-detalhes-visuais">
          <span class="produto-detalhe produto-detalhe--cor">${item.COR || 'Não informada'}</span>
          <span class="produto-detalhe produto-detalhe--acabamento">${item.ACABAMENTO || 'Não informado'}</span>
        </div>
      </td>
      <td class="produto-rendimento">${rendimentoTexto}</td>
      <td class="produto-preco">${valorFormatado}</td>
      <td><span class="status-produto ${statusClasse}">${statusTexto}</span></td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", () => {
      prepararEdicao(item);
      if (modalListagem) modalListagem.style.display = "none";
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", () => excluirProduto(item));

    const colAcoes = linha.querySelector(".coluna-acoes");
    colAcoes.appendChild(botaoEditar);
    colAcoes.appendChild(botaoExcluir);

    tabelaProdutos.appendChild(linha);
  });
}

function buscarProdutos() {
  paginaAtual = 1;
  carregarProdutos(campoPesquisa?.value || "");
}

/*
  ============================================
  PREPARAR E CANCELAR EDIÇÃO
  ============================================
*/
function prepararEdicao(item) {
  if (produtoIdInput) produtoIdInput.value = item.PRODUTOID;
  if (dsProdutoInput) dsProdutoInput.value = item.DS_PRODUTO;
  if (categoriaSelect) categoriaSelect.value = item.CATEGORIAPRODUTOID;
  if (vlVendaInput) vlVendaInput.value = item.VL_VENDA_PRODUTO;
  if (statusProdutoSelect) statusProdutoSelect.value = item.STATUS_PRODUTO ?? "A";
  if (obsProdutoInput) obsProdutoInput.value = item.OBS_PRODUTO ?? "";

  if (unidadeMedida) unidadeMedida.value = item.UNIDADE_MEDIDA ?? "";
  if (marca) marca.value = item.MARCA ?? "";
  if (cor) cor.value = item.COR ?? "";
  if (acabamento) acabamento.value = item.ACABAMENTO ?? "";
  if (rendimentoM2) rendimentoM2.value = item.RENDIMENTO_M2 ?? "";

  if (btnSalvar) btnSalvar.textContent = "Atualizar";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Editando o produto: " + item.DS_PRODUTO, "sucesso");
}

function cancelarEdicao() {
  if (formProduto) formProduto.reset();
  if (produtoIdInput) produtoIdInput.value = "";
  if (btnSalvar) btnSalvar.textContent = "Salvar";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "none";
  if (mensagem) {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
  }
}

/*
  ============================================
  SALVAR E ATUALIZAR PRODUTO
  ============================================
*/
async function salvarProduto() {
  const dsProdutoVal = dsProdutoInput?.value?.trim();
  const categoriaVal = categoriaSelect?.value;
  const vlVendaVal = parseFloat(vlVendaInput?.value || 0);

  if (!dsProdutoVal || !categoriaVal || isNaN(vlVendaVal)) {
    mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
    return;
  }

  const produtoDados = {
    DS_PRODUTO: dsProdutoVal,
    CATEGORIAPRODUTOID: categoriaVal,
    VL_VENDA_PRODUTO: vlVendaVal,
    STATUS_PRODUTO: statusProdutoSelect?.value || "A",
    OBS_PRODUTO: obsProdutoInput?.value?.trim() || null,
    UNIDADE_MEDIDA: unidadeMedida?.value?.trim() || null,
    MARCA: marca?.value?.trim() || null,
    COR: cor?.value?.trim() || null,
    ACABAMENTO: acabamento?.value?.trim() || null,
    RENDIMENTO_M2: rendimentoM2?.value ? parseFloat(rendimentoM2.value) : null,
    DT_CADASTRO_PRODUTO: new Date().toISOString()
  };

  const { error } = await connSubaBase.from("PRODUTO").insert(produtoDados);

  if (error) {
    mostrarMensagem("Erro ao salvar produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  if (formProduto) formProduto.reset();
  carregarProdutos();
}

async function atualizarProduto() {
  const id = produtoIdInput?.value;
  if (!id) return;

  const produtoDados = {
    DS_PRODUTO: dsProdutoInput?.value?.trim(),
    CATEGORIAPRODUTOID: categoriaSelect?.value,
    VL_VENDA_PRODUTO: parseFloat(vlVendaInput?.value || 0),
    STATUS_PRODUTO: statusProdutoSelect?.value || "A",
    OBS_PRODUTO: obsProdutoInput?.value?.trim() || null,
    UNIDADE_MEDIDA: unidadeMedida?.value?.trim() || null,
    MARCA: marca?.value?.trim() || null,
    COR: cor?.value?.trim() || null,
    ACABAMENTO: acabamento?.value?.trim() || null,
    RENDIMENTO_M2: rendimentoM2?.value ? parseFloat(rendimentoM2.value) : null
  };

  const { error } = await connSubaBase
    .from("PRODUTO")
    .update(produtoDados)
    .eq("PRODUTOID", id);

  if (error) {
    mostrarMensagem("Erro ao atualizar produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarProdutos();
}

/*
  ============================================
  EXCLUIR PRODUTO
  ============================================
*/
async function excluirProduto(item) {
  if (!confirm(`Deseja excluir o produto "${item.DS_PRODUTO}"?`)) return;

  const { error } = await connSubaBase
    .from("PRODUTO")
    .delete()
    .eq("PRODUTOID", item.PRODUTOID);

  if (error) {
    mostrarMensagem("Erro ao excluir produto: " + error.message, "erro");
    return;
  }

  if (produtoIdInput && produtoIdInput.value == item.PRODUTOID) {
    cancelarEdicao();
  }

  mostrarMensagem("Produto excluído com sucesso!", "sucesso");
  carregarProdutos();
}

/*
  ============================================
  EVENTOS
  ============================================
*/
if (formProduto) {
  formProduto.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (produtoIdInput && produtoIdInput.value !== "") {
      await atualizarProduto();
    } else {
      await salvarProduto();
    }
  });
}

if (btnPesquisar) btnPesquisar.addEventListener("click", buscarProdutos);

if (campoPesquisa) {
  campoPesquisa.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarProdutos();
    }
  });
  campoPesquisa.addEventListener("input", buscarProdutos);
}

if (btnPaginaAnterior) {
  btnPaginaAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual -= 1;
      carregarProdutos(campoPesquisa?.value || "");
    }
  });
}

if (btnProximaPagina) {
  btnProximaPagina.addEventListener("click", () => {
    paginaAtual += 1;
    carregarProdutos(campoPesquisa?.value || "");
  });
}

if (btnCancelarEdicao) btnCancelarEdicao.addEventListener("click", cancelarEdicao);

// Eventos de Abertura/Fechamento do Modal Flutuante
if (btnListarProdutosModal) {
  btnListarProdutosModal.addEventListener("click", () => {
    if (modalListagem) modalListagem.style.display = "flex";
    buscarProdutos();
  });
}

if (btnFecharModal) {
  btnFecharModal.addEventListener("click", () => {
    if (modalListagem) modalListagem.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modalListagem) {
    modalListagem.style.display = "none";
  }
});

carregarSelectCategorias();
carregarProdutos();
