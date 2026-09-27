import { addExpense, deleteExpense } from "../data.js";
import { centsFromInput, escapeHtml, formatDate, moneyFromCents } from "../utils.js";

export function renderGastos(container, data, uid, helpers) {
  const total = data.gastos.reduce((s,g)=>s+Number(g.valorTotalCentavos||0),0);
  container.innerHTML = `
    <div class="page-head"><div><h2>Gastos</h2><p>Registre e acompanhe todos os gastos da empresa.</p></div><span class="badge">Total: ${moneyFromCents(total)}</span></div>
    <form class="card form-card" id="expense-form">
      <div class="form-grid three">
        <div class="field"><label for="expense-description">Descrição *</label><input id="expense-description" required placeholder="Ex.: farinha"></div>
        <div class="field"><label for="expense-category">Categoria *</label><select id="expense-category" required><option value="">Selecione</option><option>Ingredientes</option><option>Embalagens</option><option>Equipamentos</option><option>Divulgação</option><option>Transporte</option><option>Outros</option></select></div>
        <div class="field"><label for="expense-quantity">Quantidade *</label><input id="expense-quantity" type="number" min="0" step="1" value="1" required></div>
        <div class="field"><label for="expense-unit">Valor por unidade *</label><input id="expense-unit" type="number" min="0" step="0.01" placeholder="0,00" required></div>
        <div class="field"><label>Valor total</label><div class="total-box"><span>Total</span><strong id="expense-total">R$ 0,00</strong></div></div>
        <div class="field"><label for="expense-date">Data *</label><input id="expense-date" type="date" required></div>
        <div class="field full"><label for="expense-notes">Observações</label><textarea id="expense-notes" placeholder="Opcional"></textarea></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">Salvar gasto</button></div>
    </form>
    <div class="card table-card">${data.gastos.length ? `<div class="table-scroll"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Quantidade</th><th>Valor/un.</th><th>Valor total</th><th>Data</th><th>Observações</th><th>Excluir</th></tr></thead><tbody>${data.gastos.map(g=>`<tr><td>${escapeHtml(g.descricao)}</td><td>${escapeHtml(g.categoria)}</td><td>${g.quantidade}</td><td class="money">${moneyFromCents(g.valorUnitarioCentavos)}</td><td class="money">${moneyFromCents(g.valorTotalCentavos)}</td><td>${formatDate(g.data)}</td><td>${escapeHtml(g.observacoes || "—")}</td><td><button class="btn btn-danger btn-small delete-expense" data-id="${g.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><strong>Nenhum gasto cadastrado.</strong>Os gastos registrados aparecerão aqui.</div>`}</div>`;

  const date = container.querySelector("#expense-date");
  const qty = container.querySelector("#expense-quantity");
  const unit = container.querySelector("#expense-unit");
  const totalEl = container.querySelector("#expense-total");
  const updateTotal = () => { const q=Number(qty.value||0); const c=centsFromInput(unit.value||0); totalEl.textContent=moneyFromCents(Number.isFinite(c)?Math.round(q*c):0); };
  qty.addEventListener("input", updateTotal); unit.addEventListener("input", updateTotal);
  container.querySelector("#expense-form").addEventListener("submit", async e => {
    e.preventDefault();
    const description=container.querySelector("#expense-description").value.trim();
    const category=container.querySelector("#expense-category").value;
    const quantity=Number(qty.value); const unitCents=centsFromInput(unit.value); const dateValue=date.value; const notes=container.querySelector("#expense-notes").value.trim();
    if (!description || !category || !Number.isInteger(quantity) || quantity < 0 || !Number.isFinite(unitCents) || unitCents < 0 || !dateValue) return helpers.toast("Preencha os campos obrigatórios corretamente.", "error");
    try { await addExpense(uid,{descricao:description,categoria:category,quantidade:quantity,valorUnitarioCentavos:unitCents,valorTotalCentavos:quantity*unitCents,data:dateValue,observacoes:notes}); helpers.toast("Gasto salvo.","success"); await helpers.refresh(); }
    catch(err){ helpers.toast(err.message,"error"); }
  });
  container.querySelectorAll(".delete-expense").forEach(btn=>btn.addEventListener("click",async()=>{
    if(!confirm("Tem certeza que deseja excluir este gasto?")) return;
    try { await deleteExpense(uid,btn.dataset.id); helpers.toast("Gasto excluído.","success"); await helpers.refresh(); } catch(err){helpers.toast(err.message,"error");}
  }));
}
