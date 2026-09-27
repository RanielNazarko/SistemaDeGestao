import {
  collection, doc, getDocs, getDoc, query, orderBy, serverTimestamp,
  runTransaction, writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { normalizeProductName } from "./utils.js";

export function companyRef(uid) { return doc(db, "empresas", uid); }
export function subcollection(uid, name) { return collection(db, "empresas", uid, name); }

export async function getCompany(uid) {
  const snap = await getDoc(companyRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllData(uid) {
  const [gastos, estoque, vendas] = await Promise.all([
    getDocs(query(subcollection(uid, "gastos"), orderBy("criadoEm", "desc"))),
    getDocs(query(subcollection(uid, "estoque"), orderBy("produto"))),
    getDocs(query(subcollection(uid, "vendas"), orderBy("horarioRegistro", "desc")))
  ]);
  return {
    gastos: gastos.docs.map(d => ({ id: d.id, ...d.data() })),
    estoque: estoque.docs.map(d => ({ id: d.id, ...d.data() })),
    vendas: vendas.docs.map(d => ({ id: d.id, ...d.data() }))
  };
}

export async function addExpense(uid, data) {
  const ref = doc(subcollection(uid, "gastos"));
  await runTransaction(db, async transaction => transaction.set(ref, { ...data, criadoEm: serverTimestamp() }));
}

export async function deleteExpense(uid, id) {
  const ref = doc(db, "empresas", uid, "gastos", id);
  await runTransaction(db, async transaction => transaction.delete(ref));
}

async function stockDocumentId(produtoNormalizado, precoUnitarioCentavos) {
  const raw = `${produtoNormalizado}:${Number(precoUnitarioCentavos)}`;
  const bytes = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function addOrMergeStock(uid, { produto, quantidade, precoUnitarioCentavos }) {
  const normalized = normalizeProductName(produto);
  const id = await stockDocumentId(normalized, precoUnitarioCentavos);
  const ref = doc(db, "empresas", uid, "estoque", id);
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (current.exists()) {
      const data = current.data();
      transaction.update(ref, {
        quantidade: Number(data.quantidade) + Number(quantidade),
        atualizadoEm: serverTimestamp()
      });
    } else {
      transaction.set(ref, {
        produto: produto.trim().replace(/\s+/g, " "),
        produtoNormalizado: normalized,
        quantidade: Number(quantidade),
        precoUnitarioCentavos: Number(precoUnitarioCentavos),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });
    }
  });
}

export async function deleteStock(uid, id) {
  const ref = doc(db, "empresas", uid, "estoque", id);
  await runTransaction(db, async transaction => transaction.delete(ref));
}

export async function createSale(uid, sale) {
  const saleRef = doc(subcollection(uid, "vendas"));
  await runTransaction(db, async transaction => {
    const stockRefs = sale.produtos.map(item => doc(db, "empresas", uid, "estoque", item.produtoId));
    const uniqueRefs = [...new Map(stockRefs.map(ref => [ref.path, ref])).values()];
    const snapshots = await Promise.all(uniqueRefs.map(ref => transaction.get(ref)));
    const stockMap = new Map(snapshots.map(s => [s.id, s.exists() ? s.data() : null]));

    for (const item of sale.produtos) {
      const stock = stockMap.get(item.produtoId);
      if (!stock) throw new Error(`O produto "${item.produto}" não está mais no estoque.`);
      if (Number(item.quantidade) <= 0) throw new Error("A quantidade de cada produto deve ser maior que zero.");
      if (Number(stock.quantidade) < Number(item.quantidade)) {
        throw new Error(`Estoque insuficiente para "${item.produto}". Disponível: ${stock.quantidade}.`);
      }
      if (Number(stock.precoUnitarioCentavos) !== Number(item.precoUnitarioCentavos)) {
        throw new Error(`O preço do produto "${item.produto}" mudou. Atualize a venda e tente novamente.`);
      }
    }

    for (const item of sale.produtos) {
      const ref = doc(db, "empresas", uid, "estoque", item.produtoId);
      const stock = stockMap.get(item.produtoId);
      transaction.update(ref, {
        quantidade: Number(stock.quantidade) - Number(item.quantidade),
        atualizadoEm: serverTimestamp()
      });
    }
    transaction.set(saleRef, { ...sale, criadoEm: serverTimestamp(), horarioRegistro: serverTimestamp() });
  });
}

export async function deleteSale(uid, id) {
  const saleRef = doc(db, "empresas", uid, "vendas", id);
  await runTransaction(db, async transaction => {
    const saleSnap = await transaction.get(saleRef);
    if (!saleSnap.exists()) throw new Error("Venda não encontrada.");
    const sale = saleSnap.data();
    const stockRefs = sale.produtos.map(item => doc(db, "empresas", uid, "estoque", item.produtoId));
    const uniqueRefs = [...new Map(stockRefs.map(ref => [ref.path, ref])).values()];
    const snapshots = await Promise.all(uniqueRefs.map(ref => transaction.get(ref)));
    const stockMap = new Map(snapshots.map(s => [s.id, s.exists() ? s.data() : null]));

    for (const item of sale.produtos) {
      const stock = stockMap.get(item.produtoId);
      const ref = doc(db, "empresas", uid, "estoque", item.produtoId);
      if (!stock) {
        // O produto pode ter sido excluído depois da venda. Nesse caso,
        // restauramos a quantidade usando os dados históricos da venda.
        transaction.set(ref, {
          produto: item.produto,
          produtoNormalizado: normalizeProductName(item.produto),
          quantidade: Number(item.quantidade),
          precoUnitarioCentavos: Number(item.precoUnitarioCentavos),
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp()
        });
      } else {
        transaction.update(ref, {
          quantidade: Number(stock.quantidade) + Number(item.quantidade),
          atualizadoEm: serverTimestamp()
        });
      }
    }
    transaction.delete(saleRef);
  });
}
