import { observeAuth, createCompany, loginCompany, logout, deleteCompanyAccount } from "./auth.js";
import { getCompany, getAllData } from "./data.js";
import { friendlyFirebaseError } from "./utils.js";
import { renderGeral } from "./pages/geral.js";
import { renderGastos } from "./pages/gastos.js";
import { renderEstoque } from "./pages/estoque.js";
import { renderVendas } from "./pages/vendas.js";

const authScreen=document.querySelector("#auth-screen");
const appScreen=document.querySelector("#app-screen");
const modalRoot=document.querySelector("#modal-root");
const companyHeader=document.querySelector("#company-name-header");
let currentUser=null; let company=null; let data={gastos:[],estoque:[],vendas:[]}; let currentPage="geral";
const pages={geral:document.querySelector("#page-geral"),gastos:document.querySelector("#page-gastos"),estoque:document.querySelector("#page-estoque"),vendas:document.querySelector("#page-vendas")};

function toast(message,type="") { const el=document.createElement("div"); el.className=`toast ${type}`; el.textContent=message; document.querySelector("#toast-root").appendChild(el); setTimeout(()=>el.remove(),4500); }
function showAuth(){authScreen.classList.remove("hidden");appScreen.classList.add("hidden");}
function showApp(){authScreen.classList.add("hidden");appScreen.classList.remove("hidden");}
async function refresh(){ if(!currentUser)return; try{ company=await getCompany(currentUser.uid); data=await getAllData(currentUser.uid); companyHeader.textContent=company?.nome||"Empresa"; renderCurrent(); }catch(e){toast(friendlyFirebaseError(e),"error");} }
function renderCurrent(){ Object.values(pages).forEach(p=>p.classList.add("hidden")); pages[currentPage].classList.remove("hidden"); const helpers={refresh,toast}; if(currentPage==="geral")renderGeral(pages.geral,data); if(currentPage==="gastos")renderGastos(pages.gastos,data,currentUser.uid,helpers); if(currentPage==="estoque")renderEstoque(pages.estoque,data,currentUser.uid,helpers); if(currentPage==="vendas")renderVendas(pages.vendas,data,currentUser.uid,helpers); document.querySelectorAll(".nav-tab").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage)); }
function openModal(title,body){modalRoot.innerHTML=`<div class="modal-backdrop" id="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close-btn" id="modal-close">×</button></div><div class="modal-body">${body}</div></div></div>`; document.querySelector("#modal-close").addEventListener("click",closeModal); document.querySelector("#modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")closeModal();});}
function closeModal(){modalRoot.innerHTML="";}
function openCreate(){openModal("Criar login",`<form id="create-form"><div class="field"><label>Nome da empresa *</label><input id="create-name" required placeholder="Nome da empresa"></div><div class="field" style="margin-top:14px"><label>Senha *</label><input id="create-pass" type="password" required minlength="6" placeholder="Senha (mínimo 6 caracteres)">
<small class="small-muted">A senha deve ter no mínimo 6 caracteres.</small></div><div class="field" style="margin-top:14px"><label>Confirmar senha *</label><input id="create-confirm" type="password" required placeholder="Repita a senha"></div><div class="small-muted" style="margin-top:12px">O nome e a senha não poderão ser alterados depois.</div><div class="form-actions"><button class="btn btn-primary" type="submit">Criar login</button></div></form>`); document.querySelector("#create-form").addEventListener("submit",async e=>{e.preventDefault();const name=document.querySelector("#create-name").value.trim();const pass=document.querySelector("#create-pass").value;const confirmPass=document.querySelector("#create-confirm").value;if(!name)return toast("Informe o nome da empresa.","error");

if(pass.length < 6)
  return toast("A senha deve ter no mínimo 6 caracteres.","error");

if(pass!==confirmPass)
  return toast("As senhas não coincidem.","error");try{await createCompany({name,password:pass});closeModal();toast("Login criado com sucesso.","success");}catch(err){toast(err.message,"error");}});}
function openLogin(){openModal("Logar",`<form id="login-form"><div class="field"><label>Nome da empresa *</label><input id="login-name" required placeholder="Nome da empresa"></div><div class="field" style="margin-top:14px"><label>Senha *</label><input id="login-pass" type="password" required placeholder="Senha"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Entrar</button></div></form>`);document.querySelector("#login-form").addEventListener("submit",async e=>{e.preventDefault();const name=document.querySelector("#login-name").value;const password=document.querySelector("#login-pass").value;try{await loginCompany({name,password});closeModal();}catch(err){toast(err.message,"error");}});}
function openProfile(){openModal("Perfil",`<div class="profile-actions"><div class="card" style="padding:16px"><div class="small-muted">Empresa</div><strong>${company?.nome||""}</strong></div><button class="btn btn-secondary" id="profile-logout">Sair</button><button class="btn btn-danger" id="profile-delete">Excluir conta</button></div>`);document.querySelector("#profile-logout").addEventListener("click",async()=>{await logout();closeModal();});document.querySelector("#profile-delete").addEventListener("click",openDeleteConfirm);}
function openDeleteConfirm(){openModal("Excluir conta",`<div class="alert">Esta ação é permanente. Todos os gastos, estoque, vendas e o login da empresa serão excluídos.</div><form id="delete-form"><div class="field"><label>Senha da conta *</label><input id="delete-pass" type="password" required></div><label class="confirm-line"><input id="delete-check" type="checkbox"><span>Entendo que a conta e seus dados serão excluídos permanentemente.</span></label><div class="form-actions"><button class="btn btn-danger" type="submit">Continuar</button></div></form>`);document.querySelector("#delete-form").addEventListener("submit",async e=>{e.preventDefault();if(!document.querySelector("#delete-check").checked)return toast("Confirme que entende a exclusão.","error");const pass=document.querySelector("#delete-pass").value;try{await deleteCompanyAccount(pass);closeModal();toast("Conta excluída.","success");}catch(err){toast(friendlyFirebaseError(err),"error");}});}

document.querySelector("#btn-open-create").addEventListener("click",openCreate);
document.querySelector("#btn-open-login").addEventListener("click",openLogin);
document.querySelector("#btn-profile").addEventListener("click",openProfile);
document.querySelectorAll(".nav-tab").forEach(btn=>btn.addEventListener("click",()=>{currentPage=btn.dataset.page;renderCurrent();}));

observeAuth(async user=>{currentUser=user;if(!user){company=null;data={gastos:[],estoque:[],vendas:[]};showAuth();return;}showApp();await refresh();});
