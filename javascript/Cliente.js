import { connSuba } from '../conexao/Supabase.js';
/*
  ============================================
  PEGANDO ELEMENTOS DO HTML
  ============================================
*/

const formCliente = document.getElementById("formCliente");
const tabelaClientes = document.getElementById("tabelaClientes");
const mensagem = document.getElementById("mensagem");

const clienteIdInput = document.getElementById("clienteId");
const tipoClienteInput = document.getElementById("tipoCliente");
const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput = document.getElementById("nomeCliente");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
mostrarMensagem("Erro ao salvar cliente.", "erro");

/*
  ============================================
  FUNÇÃO PARA FORMATAR O TIPO DO CLIENTE
  ============================================
*/

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") {
    return "Pessoa Física";
  }

  if (tipoCliente === "J") {
    return "Pessoa Jurídica";
  }

  return "Não informado";
}

/*
  ============================================
  CARREGAR CLIENTES
  ============================================
*/

async function carregarClientes() {
  const { data, error } = await connSuba
    .from("CLIENTE")
    .select("CLIENTEID, TIPO_CLIENTE, CPF_CNPJ_CLIENTE, NOME_CLIENTE")
    .order("CLIENTEID", { ascending: true });

  if (error) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Erro ao carregar clientes.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Nenhum cliente cadastrado.</td>
      </tr>
    `;
    return;
  }

  tabelaClientes.innerHTML = "";

  data.forEach(function(cliente) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${cliente.CLIENTEID}</td>
      <td>${formatarTipoCliente(cliente.TIPO_CLIENTE)}</td>
      <td>${cliente.CPF_CNPJ_CLIENTE}</td>
      <td>${cliente.NOME_CLIENTE}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";

    botaoEditar.addEventListener("click", function() {
      prepararEdicao(cliente);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";

    botaoExcluir.addEventListener("click", function() {
      excluirCliente(cliente);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaClientes.appendChild(linha);
  });
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================
*/

function prepararEdicao(cliente) {
  clienteIdInput.value = cliente.CLIENTEID;

  tipoClienteInput.value = cliente.TIPO_CLIENTE;
  cpfCnpjClienteInput.value = cliente.CPF_CNPJ_CLIENTE;
  nomeClienteInput.value = cliente.NOME_CLIENTE;

  tipoClienteInput.disabled = true;
  cpfCnpjClienteInput.readOnly = true;

  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Editando o cliente: " + cliente.NOME_CLIENTE, "sucesso");
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================
*/

function cancelarEdicao() {
  formCliente.reset();
  clienteIdInput.value = "";

  tipoClienteInput.disabled = false;
  cpfCnpjClienteInput.readOnly = false;

  btnSalvar.textContent = "Salvar";
  btnCancelarEdicao.style.display = "none";

  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

/*
  ============================================
  SALVAR CLIENTE
  ============================================
*/

async function salvarCliente() {
  const tipoCliente = tipoClienteInput.value;
  const cpfCnpjCliente = cpfCnpjClienteInput.value;
  const nomeCliente = nomeClienteInput.value;

  const novoCliente = {
    TIPO_CLIENTE: tipoCliente,
    CPF_CNPJ_CLIENTE: cpfCnpjCliente,
    NOME_CLIENTE: nomeCliente
  };

  const { error } = await connSuba
    .from("CLIENTE")
    .insert(novoCliente);

  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
  formCliente.reset();
  carregarClientes();
}

/*
  ============================================
  ATUALIZAR NOME DO CLIENTE
  ============================================
*/

async function atualizarNomeCliente() {
  const clienteId = clienteIdInput.value;
  const nomeCliente = nomeClienteInput.value;

  const { error } = await connSuba
    .from("CLIENTE")
    .update({
      NOME_CLIENTE: nomeCliente
    })
    .eq("CLIENTEID", clienteId);

  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Nome atualizado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarClientes();
}

/*
  ============================================
  EXCLUIR CLIENTE
  ============================================
*/

async function excluirCliente(cliente) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o cliente " + cliente.NOME_CLIENTE + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await connSuba
    .from("CLIENTE")
    .delete()
    .eq("CLIENTEID", cliente.CLIENTEID);

  if (error) {
    mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
    return;
  }

  if (clienteIdInput.value == cliente.CLIENTEID) {
    cancelarEdicao();
  }

  mostrarMensagem("Cliente excluído com sucesso!", "sucesso");
  carregarClientes();
}

/*
  ============================================
  EVENTOS
  ============================================
*/

formCliente.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  const estaEditando = clienteIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeCliente();
  } else {
    await salvarCliente();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

/*
  ============================================
  CARREGAMENTO INICIAL
  ============================================
*/

carregarClientes();