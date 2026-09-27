import { addOrMergeStock, deleteStock } from "../data.js";
import { centsFromInput, escapeHtml, moneyFromCents } from "../utils.js";

export function renderEstoque(container, data, uid, helpers) {
  container.innerHTML = `
    <div class="page-head"><div><h2>Estoque</h2><p>Cadastre produtos e acompanhe as quantidades disponíveis.</p></div></div>
    <form class="card form-card" id="stock-form">
      <div class="form-grid three">
        <div class="field"><label for="stock-product">Produto *</label><input id="stock-product" required placeholder="Ex.: Pão de queijo"></div>
        <div class="field"><label for="stock-quantity">Quantidade *</label><input id="stock-quantity" type="number" min="0" step="1" required></div>
        <div class="field"><label for="stock-price">Preço unitário *</label><input id="stock-price" type="number" min="0" step="0.01" required placeholder="0,00"></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">Adicionar ao estoque</button></div>
    </form>
    <div class="card table-card">${data.estoque.length ? `<div class="table-scroll"><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Preço unitário</th><th>Excluir</th></tr></thead><tbody>${data.estoque.map(p=>`<tr><td class="product-name">${escapeHtml(p.produto)}</td><td>${p.quantidade}</td><td class="money">${moneyFromCents(p.precoUnitarioCentavos)}</td><td><button class="btn btn-danger btn-small delete-stock" data-id="${p.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><strong>Nenhum produto cadastrado.</strong>Adicione seu primeiro produto ao estoque.</div>`}</div>`;
  container.querySelector("#stock-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const produto=container.querySelector("#stock-product").value.trim(); const quantidade=Number(container.querySelector("#stock-quantity").value); const preco=centsFromInput(container.querySelector("#stock-price").value);
    if(!produto || !Number.isInteger(quantidade) || quantidade<0 || !Number.isFinite(preco) || preco<0) return helpers.toast("Preencha os campos corretamente.","error");
    try { await addOrMergeStock(uid,{produto,quantidade,precoUnitarioCentavos:preco}); helpers.toast("Estoque atualizado.","success"); await helpers.refresh(); } catch(err){helpers.toast(err.message,"error");}
  });
  container.querySelectorAll(".delete-stock").forEach(btn=>btn.addEventListener("click",async()=>{
    if(!confirm("Tem certeza que deseja excluir este produto do estoque? As vendas históricas serão mantidas.")) return;
    try { await deleteStock(uid,btn.dataset.id); helpers.toast("Produto excluído do estoque.","success"); await helpers.refresh(); } catch(err){helpers.toast(err.message,"error");}
  }));
}
