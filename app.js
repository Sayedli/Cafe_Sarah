const KEY="cafeManagerV1";
const uid=()=>crypto.randomUUID();
const initial={settings:{shopName:"Khoka Kholdiya",currency:"$"},inventory:[
{id:uid(),name:"Milk",quantity:12,unit:"liters",cost:1.6,threshold:3},
{id:uid(),name:"Coffee Beans",quantity:8,unit:"bags",cost:12,threshold:2},
{id:uid(),name:"Cake Slices",quantity:14,unit:"pieces",cost:2,threshold:4}
],products:[],sales:[]};
initial.products=[
{id:uid(),name:"Latte",price:4.5,category:"Coffee",inventoryId:initial.inventory[0].id,deduction:.25},
{id:uid(),name:"Chocolate Cake",price:5,category:"Cake",inventoryId:initial.inventory[2].id,deduction:1},
{id:uid(),name:"Croissant",price:3.25,category:"Pastry",inventoryId:"",deduction:1}
];

let data=(()=>{try{return JSON.parse(localStorage.getItem(KEY))||initial}catch{return initial}})();
data.settings=data.settings||{};
data.settings.shopName="Khoka Kholdiya";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>(data.settings.currency||"$")+Number(n||0).toFixed(2);
const day=d=>new Date(d).toLocaleDateString();

function save(){
 data.settings.shopName="Khoka Kholdiya";
 localStorage.setItem(KEY,JSON.stringify(data));
 render();
}

function toast(t){
 $("toast").textContent=t;
 $("toast").classList.add("show");
 setTimeout(()=>$("toast").classList.remove("show"),1800);
}

function render(){
 document.title="Khoka Kholdiya";
 $("currency").value=data.settings.currency||"$";

 const today=new Date().toLocaleDateString();
 const sales=data.sales.filter(s=>day(s.createdAt)===today);

 $("todayRevenue").textContent=money(sales.reduce((a,s)=>a+s.total,0));
 $("todayOrders").textContent=sales.length;
 $("inventoryValue").textContent=money(data.inventory.reduce((a,i)=>a+i.quantity*i.cost,0));
 $("lowStock").textContent=data.inventory.filter(i=>+i.quantity<=+i.threshold).length;

 $("productGrid").innerHTML=data.products.length
 ? data.products.map(p=>`<button class="product-card" data-sale="${p.id}"><small>${esc(p.category||"Product")}</small><b>${esc(p.name)}</b><span class="price">${money(p.price)}</span></button>`).join("")
 : `<div class="empty">Add a product to begin.</div>`;

 document.querySelectorAll("[data-sale]").forEach(b=>b.onclick=()=>openSale(b.dataset.sale));

 $("recentSales").innerHTML=data.sales.length
 ? [...data.sales].reverse().slice(0,8).map(s=>`<div class="item"><div><b>${esc(s.productName)} × ${s.quantity}</b><span>${new Date(s.createdAt).toLocaleString()} · ${esc(s.payment)}</span></div><b>${money(s.total)}</b></div>`).join("")
 : `<div class="empty">No sales yet.</div>`;

 $("productList").innerHTML=data.products.length
 ? data.products.map(p=>{const i=data.inventory.find(x=>x.id===p.inventoryId);return `<div class="item"><div><b>${esc(p.name)} · ${money(p.price)}</b><span>${esc(p.category||"Uncategorized")}${i?` · deducts ${p.deduction} ${esc(i.unit)} ${esc(i.name)}`:""}</span></div><div class="item-actions"><button class="secondary" data-pe="${p.id}">Edit</button><button class="secondary danger" data-pd="${p.id}">Delete</button></div></div>`}).join("")
 : `<div class="empty">No products.</div>`;

 $("inventoryList").innerHTML=data.inventory.length
 ? data.inventory.map(i=>`<div class="item ${+i.quantity<=+i.threshold?"low":""}"><div><b>${esc(i.name)}</b><span>${i.quantity} ${esc(i.unit)} · ${money(i.cost)} each · low at ${i.threshold}</span></div><div class="item-actions"><button class="secondary" data-ie="${i.id}">Edit</button><button class="secondary danger" data-id="${i.id}">Delete</button></div></div>`).join("")
 : `<div class="empty">No inventory.</div>`;

 document.querySelectorAll("[data-pe]").forEach(b=>b.onclick=()=>openProduct(b.dataset.pe));
 document.querySelectorAll("[data-pd]").forEach(b=>b.onclick=()=>{if(confirm("Delete this product?")){data.products=data.products.filter(x=>x.id!==b.dataset.pd);save()}});
 document.querySelectorAll("[data-ie]").forEach(b=>b.onclick=()=>openInventory(b.dataset.ie));
 document.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{if(confirm("Delete this item?")){data.inventory=data.inventory.filter(x=>x.id!==b.dataset.id);data.products=data.products.map(p=>p.inventoryId===b.dataset.id?{...p,inventoryId:""}:p);save()}});
}

function fillInventory(selected=""){
 $("productInventory").innerHTML=`<option value="">No automatic deduction</option>`+
 data.inventory.map(i=>`<option value="${i.id}" ${i.id===selected?"selected":""}>${esc(i.name)} (${esc(i.unit)})</option>`).join("");
}

function openProduct(id=""){
 const p=data.products.find(x=>x.id===id);
 $("productDialogTitle").textContent=p?"Edit product":"Add product";
 $("productId").value=p?.id||"";
 $("productName").value=p?.name||"";
 $("productPrice").value=p?.price??"";
 $("productCategory").value=p?.category||"";
 $("productDeduction").value=p?.deduction??1;
 fillInventory(p?.inventoryId||"");
 $("productDialog").showModal();
}

function openInventory(id=""){
 const i=data.inventory.find(x=>x.id===id);
 $("inventoryDialogTitle").textContent=i?"Edit inventory item":"Add inventory item";
 $("inventoryId").value=i?.id||"";
 $("inventoryName").value=i?.name||"";
 $("inventoryQuantity").value=i?.quantity??"";
 $("inventoryUnit").value=i?.unit||"";
 $("inventoryCost").value=i?.cost??0;
 $("inventoryThreshold").value=i?.threshold??5;
 $("inventoryDialog").showModal();
}

function openSale(id){
 const p=data.products.find(x=>x.id===id);
 $("saleProductId").value=id;
 $("saleName").textContent=p.name;
 $("saleQuantity").value=1;
 updateTotal();
 $("saleDialog").showModal();
}

function updateTotal(){
 const p=data.products.find(x=>x.id===$("saleProductId").value);
 $("saleTotal").textContent=money((p?.price||0)*(+$("saleQuantity").value||0));
}

$("productForm").onsubmit=e=>{
 e.preventDefault();
 const id=$("productId").value||uid();
 const p={id,name:$("productName").value.trim(),price:+$("productPrice").value,category:$("productCategory").value.trim(),inventoryId:$("productInventory").value,deduction:+$("productDeduction").value||0};
 const n=data.products.findIndex(x=>x.id===id);
 n>=0?data.products[n]=p:data.products.push(p);
 $("productDialog").close();
 save();
 toast("Product saved");
};

$("inventoryForm").onsubmit=e=>{
 e.preventDefault();
 const id=$("inventoryId").value||uid();
 const i={id,name:$("inventoryName").value.trim(),quantity:+$("inventoryQuantity").value,unit:$("inventoryUnit").value.trim(),cost:+$("inventoryCost").value||0,threshold:+$("inventoryThreshold").value||0};
 const n=data.inventory.findIndex(x=>x.id===id);
 n>=0?data.inventory[n]=i:data.inventory.push(i);
 $("inventoryDialog").close();
 save();
 toast("Inventory saved");
};

$("saleForm").onsubmit=e=>{
 e.preventDefault();
 const p=data.products.find(x=>x.id===$("saleProductId").value);
 const q=+$("saleQuantity").value;
 if(p.inventoryId){
   const i=data.inventory.find(x=>x.id===p.inventoryId);
   const need=q*p.deduction;
   if(i&&i.quantity<need&&!confirm(`Only ${i.quantity} ${i.unit} of ${i.name} remains. Record sale anyway?`))return;
   if(i)i.quantity=Math.max(0,i.quantity-need);
 }
 data.sales.push({id:uid(),productId:p.id,productName:p.name,quantity:q,total:p.price*q,payment:$("salePayment").value,createdAt:new Date().toISOString()});
 $("saleDialog").close();
 save();
 toast("Sale recorded");
};

$("saleQuantity").oninput=updateTotal;
$("addProduct").onclick=()=>openProduct();
$("addInventory").onclick=()=>openInventory();
$("clearSales").onclick=()=>{if(confirm("Clear all sales history?")){data.sales=[];save()}};

$("saveSettings").onclick=()=>{
 data.settings.shopName="Khoka Kholdiya";
 data.settings.currency=$("currency").value||"$";
 save();
 toast("Settings saved");
};

$("exportData").onclick=()=>{
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="khoka-kholdiya-backup.json";
 a.click();
 URL.revokeObjectURL(a.href);
};

$("importData").onchange=async e=>{
 try{
   const d=JSON.parse(await e.target.files[0].text());
   if(!d.products||!d.inventory||!d.sales)throw 0;
   data=d;
   data.settings=data.settings||{};
   data.settings.shopName="Khoka Kholdiya";
   save();
   toast("Backup imported");
 }catch{
   alert("That backup file is not valid.");
 }
};

document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x===b));
 document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===b.dataset.screen));
});

document.querySelectorAll(".close,.cancel").forEach(b=>b.onclick=()=>b.closest("dialog").close());

let installPrompt;
window.addEventListener("beforeinstallprompt",e=>{
 e.preventDefault();
 installPrompt=e;
 $("installBtn").classList.remove("hidden");
});
$("installBtn").onclick=async()=>{
 if(installPrompt){
   installPrompt.prompt();
   await installPrompt.userChoice;
   installPrompt=null;
   $("installBtn").classList.add("hidden");
 }
};

if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js");
save();
