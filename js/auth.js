import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { friendlyFirebaseError, identifierEmail, normalizeCompanyName } from "./utils.js";

export async function createCompany({ name, password }) {
  const nome = name.trim().replace(/\s+/g, " ");
  const nomeNormalizado = normalizeCompanyName(nome);
  if (!nomeNormalizado) throw new Error("Informe o nome da empresa.");
  const nameRef = doc(db, "nomesEmpresas", nomeNormalizado);
  const existing = await getDoc(nameRef);
  if (existing.exists()) throw new Error("Este nome de empresa já está em uso.");

  const email = await identifierEmail(nomeNormalizado);
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    const empresaRef = doc(db, "empresas", uid);
    const batch = writeBatch(db);
    batch.set(nameRef, { uid, nome });
    batch.set(empresaRef, { nome, nomeNormalizado, criadoEm: serverTimestamp() });
    await batch.commit();
    return credential.user;
  } catch (error) {
    if (credential?.user) {
      try { await deleteUser(credential.user); } catch (_) {}
    }
    throw new Error(friendlyFirebaseError(error));
  }
}

export async function loginCompany({ name, password }) {
  const nomeNormalizado = normalizeCompanyName(name);
  if (!nomeNormalizado) throw new Error("Informe o nome da empresa.");
  const email = await identifierEmail(nomeNormalizado);
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const companyRef = doc(db, "empresas", credential.user.uid);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      await signOut(auth);
      throw new Error("A conta existe, mas os dados da empresa não foram encontrados.");
    }
    return credential.user;
  } catch (error) {
    throw new Error(friendlyFirebaseError(error));
  }
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function logout() {
  await signOut(auth);
}

async function deleteCollectionDocs(path) {
  const snapshot = await getDocs(collection(db, path));
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
}

export async function deleteCompanyAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error("Nenhuma conta está conectada.");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const uid = user.uid;
  const companyRef = doc(db, "empresas", uid);
  const companySnap = await getDoc(companyRef);
  if (!companySnap.exists()) throw new Error("Dados da empresa não encontrados.");
  const company = companySnap.data();
  const nameRef = doc(db, "nomesEmpresas", company.nomeNormalizado);

  await deleteCollectionDocs(`empresas/${uid}/gastos`);
  await deleteCollectionDocs(`empresas/${uid}/estoque`);
  await deleteCollectionDocs(`empresas/${uid}/vendas`);

  const batch = writeBatch(db);
  batch.delete(nameRef);
  batch.delete(companyRef);
  await batch.commit();
  await deleteUser(user);
}
