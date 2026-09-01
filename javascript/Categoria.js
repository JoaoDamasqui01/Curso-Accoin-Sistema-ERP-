import { connSuba } from '../conexao/Supabase.js';

/*
  ============================================
  ELEMENTOS DO DOM
  ============================================
*/
const formCategoriaProduto = document.getElementById("formCategoriaProduto");
const tabelaCategorias = document.getElementById("tabelaCategorias");
const mensagem = document.getElementById("mensagem");

const categoriaProdutoIdInput = document.getElementById("categoriaProdutoId");
const dsCategoriaProdutoInput = document.getElementById("dsCategoriaProduto");
const obsCategoriaProdutoInput = document.getElementById("obsCategoriaProduto");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

/*
  ============================================
  MENSAGENS NA TELA
  ============================================
*/
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  CARREGAR CATEGORIAS DE PRODUTOS
  ============================================
*/
async function carregarCategorias() {
  const { data, error } = await connSuba
    .from("CATEGORIA_PRODUTO")
    .select("CATEGORIAPRODUTOID, DS_CATEGORIA_PRODUTO, OBS_CATEGORIA_PRODUTO")
    .order("CATEGORIAPRODUTOID", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `<tr><td colspan="4">Erro ao carregar categorias.</td></tr>`;
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaCategorias.innerHTML = `<tr><td colspan="4">Nenhuma categoria cadastrada.</td></tr>`;
    return;
  }

  tabelaCategorias.innerHTML = "";

  data.forEach(function(item) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${item.CATEGORIAPRODUTOID}</td>
      <td>${item.DS_CATEGORIA_PRODUTO}</td>
      <td>${item.OBS_CATEGORIA_PRODUTO || "-"}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(item);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirCategoria(item);
    });

    const colAcoes = linha.querySelector(".coluna-acoes");
    colAcoes.appendChild(botaoEditar);
    colAcoes.appendChild(botaoExcluir);

    tabelaCategorias.appendChild(linha);
  });
}

/*
  ============================================
  PREPARAR E CANCELAR EDIÇÃO
  ============================================
*/
function prepararEdicao(item) {
  categoriaProdutoIdInput.value = item.CATEGORIAPRODUTOID;
  dsCategoriaProdutoInput.value = item.DS_CATEGORIA_PRODUTO;
  obsCategoriaProdutoInput.value = item.OBS_CATEGORIA_PRODUTO;

  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Editando a categoria: " + item.DS_CATEGORIA_PRODUTO, "sucesso");
}

function cancelarEdicao() {
  formCategoriaProduto.reset();
  categoriaProdutoIdInput.value = "";
  btnSalvar.textContent = "Salvar";
  btnCancelarEdicao.style.display = "none";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

/*
  ============================================
  SALVAR CATEGORIA
  ============================================
*/
async function salvarCategoria() {
  const descricao = dsCategoriaProdutoInput.value.trim();
  const observacao = obsCategoriaProdutoInput.value.trim();

  if (!observacao) {
    mostrarMensagem("A observação é obrigatória para o cadastro.", "erro");
    obsCategoriaProdutoInput.focus();
    return;
  }

  const novaCategoria = {
    DS_CATEGORIA_PRODUTO: descricao,
    OBS_CATEGORIA_PRODUTO: observacao
  };

  const { error } = await connSuba
    .from("CATEGORIA_PRODUTO")
    .insert(novaCategoria);

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria salva com sucesso!", "sucesso");
  formCategoriaProduto.reset();
  carregarCategorias();
}

/*
  ============================================
  ATUALIZAR CATEGORIA
  ============================================
*/
async function atualizarCategoria() {
  const id = categoriaProdutoIdInput.value;
  const descricao = dsCategoriaProdutoInput.value.trim();
  const observacao = obsCategoriaProdutoInput.value.trim();

  if (!observacao) {
    mostrarMensagem("A observação é obrigatória para atualização.", "erro");
    obsCategoriaProdutoInput.focus();
    return;
  }

  const { error } = await connSuba
    .from("CATEGORIA_PRODUTO")
    .update({
      DS_CATEGORIA_PRODUTO: descricao,
      OBS_CATEGORIA_PRODUTO: observacao
    })
    .eq("CATEGORIAPRODUTOID", id);

  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
  cancelarEdicao();
  carregarCategorias();
}

/*
  ============================================
  EXCLUIR CATEGORIA
  ============================================
*/
async function excluirCategoria(item) {
  const confirmou = confirm("Deseja excluir a categoria " + item.DS_CATEGORIA_PRODUTO + "?");
  if (!confirmou) return;

  const { error } = await connSuba
    .from("CATEGORIA_PRODUTO")
    .delete()
    .eq("CATEGORIAPRODUTOID", item.CATEGORIAPRODUTOID);

  if (error) {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  if (categoriaProdutoIdInput.value == item.CATEGORIAPRODUTOID) {
    cancelarEdicao();
  }

  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");
  carregarCategorias();
}

/*
  ============================================
  EVENTOS
  ============================================
*/
formCategoriaProduto.addEventListener("submit", async function(evento) {
  evento.preventDefault();
  const estaEditando = categoriaProdutoIdInput.value !== "";

  if (estaEditando) {
    await atualizarCategoria();
  } else {
    await salvarCategoria();
  }
});

btnCancelarEdicao.addEventListener("click", cancelarEdicao);

carregarCategorias();