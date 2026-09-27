import { moneyFromCents, escapeHtml } from "../utils.js";

export function renderGeral(container, data) {
  const faturamento = data.vendas.reduce((sum, v) => sum + Number(v.totalCentavos || 0), 0);
  const gastos = data.gastos.reduce((sum, g) => sum + Number(g.valorTotalCentavos || 0), 0);
  const lucro = faturamento - gastos;
  const products = data.estoque;
  container.innerHTML = `
    <div class="page-head"><div><h2>Geral</h2><p>Visão geral de todos os registros da empresa.</p></div></div>
    <div class="grid stats-grid">
      <div class="card stat-card"><div class="stat-label">Faturamento</div><div class="stat-value">${moneyFromCents(faturamento)}</div></div>
      <div class="card stat-card"><div class="stat-label">Gastos</div><div class="stat-value">${moneyFromCents(gastos)}</div></div>
      <div class="card stat-card"><div class="stat-label">Lucro líquido</div><div class="stat-value">${moneyFromCents(lucro)}</div><div class="stat-detail">Faturamento − Gastos</div></div>
      <div class="card stat-card"><div class="stat-label">Vendas</div><div class="stat-value">${data.vendas.length}</div></div>
    </div>
    <section class="card product-list">
      <h3>Produtos em estoque</h3>
      ${products.length ? `<div class="product-items">${products.map(p => `<div class="product-pill"><span>${escapeHtml(p.produto)}</span><span>${p.quantidade}</span></div>`).join("")}</div>` : `<div class="empty"><strong>Nenhum produto no estoque.</strong>Cadastre produtos na página Estoque.</div>`}
    </section>`;
}
