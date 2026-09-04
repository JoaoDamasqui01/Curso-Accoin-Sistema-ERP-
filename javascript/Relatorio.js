import { connSubaBase } from '../conexao/Supabase.js';

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dataBR = (valor) => (valor ? new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '-');

const escaparHtml = (valor) =>
  String(valor ?? '').replace(
    /[&<>'"]/g,
    (caractere) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[caractere]
  );

export async function GERAR_RELATORIO_ORCAMENTO(orcamentoId) {
  // 1. Busca os dados principais do Orçamento
  const { data: orcamento, error: erroOrcamento } = await connSubaBase
    .from('ORCAMENTO')
    .select('ORCAMENTOID, CLIENTEID, USUARIOID, DT_ORCAMENTO, DT_VALIDADE_ORCAMENTO, VL_TOTAL_ORCAMENTO, STATUS')
    .eq('ORCAMENTOID', orcamentoId)
    .single();

  if (erroOrcamento || !orcamento) {
    throw new Error(erroOrcamento?.message || 'Orçamento não encontrado.');
  }

  // 2. Busca informações do Cliente, Usuário e Itens em paralelo
  const [resultadoCliente, resultadoUsuario, resultadoItens] = await Promise.all([
    connSubaBase.from('CLIENTE').select('NOME_CLIENTE, CPF_CNPJ, TELEFONE, EMAIL').eq('CLIENTEID', orcamento.CLIENTEID).maybeSingle(),
    connSubaBase.from('USUARIO').select('NOME_USUARIO').eq('USUARIOID', orcamento.USUARIOID).maybeSingle(),
    connSubaBase.from('ORCAMENTO_ITEM').select('PRODUTOID, QT_PRODUTO, VL_UNITARIO, VL_TOTAL, COR_SISTEMA, OBS_MISTURA').eq('ORCAMENTOID', orcamentoId),
  ]);

  if (resultadoCliente.error || resultadoUsuario.error || resultadoItens.error) {
    throw new Error(resultadoCliente.error?.message || resultadoUsuario.error?.message || resultadoItens.error?.message);
  }

  // 3. Busca a descrição dos produtos
  const itens = resultadoItens.data || [];
  const idsProdutos = [...new Set(itens.map((item) => item.PRODUTOID))];

  const { data: produtos, error: erroProdutos } = idsProdutos.length
    ? await connSubaBase.from('PRODUTO').select('PRODUTOID, DS_PRODUTO, UNIDADE_MEDIDA').in('PRODUTOID', idsProdutos)
    : { data: [], error: null };

  if (erroProdutos) throw new Error(erroProdutos.message);

  const produtosPorId = new Map((produtos || []).map((produto) => [produto.PRODUTOID, produto]));
  const titulo = orcamento.STATUS === 'APROVADO' ? 'COMPROVANTE DE VENDA' : 'ORÇAMENTO DE VENDA';

  // 4. Abertura da janela de impressão
  const janela = window.open('', '_blank');
  if (!janela) throw new Error('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');
  janela.opener = null;

  // 5. Montagem das linhas da tabela
  const linhasItens = itens
    .map((item) => {
      const produto = produtosPorId.get(item.PRODUTOID);
      const detalhe = [item.COR_SISTEMA, item.OBS_MISTURA].filter(Boolean).map(escaparHtml).join(' · ');

      return `
        <tr>
          <td>
            <strong>${escaparHtml(produto?.DS_PRODUTO || `Produto #${item.PRODUTOID}`)}</strong>
            ${detalhe ? `<br><small>${detalhe}</small>` : ''}
          </td>
          <td>${escaparHtml(item.QT_PRODUTO)}</td>
          <td>${escaparHtml(produto?.UNIDADE_MEDIDA || 'UN')}</td>
          <td class="direita">${moeda(item.VL_UNITARIO)}</td>
          <td class="direita">${moeda(item.VL_TOTAL)}</td>
        </tr>
      `;
    })
    .join('');

  // 6. Renderização do documento na janela de impressão
  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulo} #${orcamento.ORCAMENTOID}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 32px; font: 14px Arial, sans-serif; color: #243746; }
        .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 3px solid #b7d63a; }
        h1 { margin: 0; color: #172b3a; font-size: 24px; }
        .codigo { color: #687886; font-weight: bold; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 22px 0; }
        .bloco { padding: 16px; background: #f6f9fb; border: 1px solid #dce4ea; border-radius: 8px; }
        .bloco h2 { margin: 0 0 10px; color: #216bb3; font-size: 12px; text-transform: uppercase; }
        .bloco p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border-bottom: 1px solid #dce4ea; text-align: left; }
        th { color: #fff; background: #172b3a; font-size: 11px; text-transform: uppercase; }
        .direita { text-align: right; }
        .total { margin-top: 18px; text-align: right; font-size: 19px; font-weight: bold; }
        .rodape { margin-top: 40px; padding-top: 12px; color: #687886; font-size: 11px; text-align: center; border-top: 1px solid #dce4ea; }
        @media print { body { padding: 16px; } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
      </style>
    </head>
    <body>
      <header class="cabecalho">
        <div>
          <h1>${titulo}</h1>
          <p>Emissão: ${dataBR(orcamento.DT_ORCAMENTO)}</p>
        </div>
        <span class="codigo">Nº ${orcamento.ORCAMENTOID}</span>
      </header>

      <section class="grid">
        <div class="bloco">
          <h2>Cliente</h2>
          <p><strong>${escaparHtml(resultadoCliente.data?.NOME_CLIENTE || 'Não informado')}</strong></p>
          <p>CPF/CNPJ: ${escaparHtml(resultadoCliente.data?.CPF_CNPJ || '-')}</p>
          <p>Telefone: ${escaparHtml(resultadoCliente.data?.TELEFONE || '-')}</p>
          <p>E-mail: ${escaparHtml(resultadoCliente.data?.EMAIL || '-')}</p>
        </div>
        <div class="bloco">
          <h2>Informações</h2>
          <p>Responsável: ${escaparHtml(resultadoUsuario.data?.NOME_USUARIO || '-')}</p>
          <p>Válido até: ${dataBR(orcamento.DT_VALIDADE_ORCAMENTO)}</p>
          <p>Status: ${escaparHtml(orcamento.STATUS || 'PENDENTE')}</p>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd.</th>
            <th>Un.</th>
            <th class="direita">Valor unitário</th>
            <th class="direita">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${linhasItens || '<tr><td colspan="5">Nenhum item encontrado.</td></tr>'}
        </tbody>
      </table>

      <div class="total">Total: ${moeda(orcamento.VL_TOTAL_ORCAMENTO)}</div>

      <footer class="rodape">
        Documento gerado em ${new Date().toLocaleString('pt-BR')}
      </footer>

      <script>
        window.onload = () => window.print();
      </script>
    </body>
    </html>
  `);

  janela.document.close();
}