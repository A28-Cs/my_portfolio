import'/src/scripts/translations.js';import{auth,db,signOut,onAuthStateChanged,checkAdminRole,fetchAllOrdered,fetchSiteSettings,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,query,orderBy,where,serverTimestamp}from'/src/scripts/firebase-config.js';

let currentLang=localStorage.getItem('lang')||'en';
const $=id=>document.getElementById(id);

// Cloudinary unsigned uploads only need the cloud name and upload preset.
// Do not put the API secret in frontend code.
const CLOUDINARY_CLOUD_NAME='dyl2xzgi5';
const CLOUDINARY_UPLOAD_PRESET='portfolio_unsigned';
const MAX_IMAGE_UPLOAD_BYTES=10*1024*1024;

function getCloudinaryCloudName(){
return (window.CLOUDINARY_CLOUD_NAME||CLOUDINARY_CLOUD_NAME||'').trim();
}

async function uploadImageToCloudinary(file){
if(!file)return'';
if(!file.type.startsWith('image/'))throw new Error('Please choose an image file.');
if(file.size>MAX_IMAGE_UPLOAD_BYTES)throw new Error('Image is too large. Please choose an image under 10MB.');
const cloudName=getCloudinaryCloudName();
if(!cloudName)throw new Error('Add your Cloudinary cloud name in dashboard.js before uploading images.');
const data=new FormData();
data.append('file',file);
data.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
const res=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,{method:'POST',body:data});
let payload={};
try{payload=await res.json()}catch(_){}
if(!res.ok)throw new Error(payload.error?.message||'Cloudinary upload failed.');
if(!payload.secure_url)throw new Error('Cloudinary did not return an image URL.');
return payload.secure_url;
}

function renderImageUploadField(label,currentUrl=''){
const safeUrl=escapeHTML(currentUrl||'');
const hasImage=!!currentUrl;
return`<div class="form-group">
<label>${label}</label>
<div class="image-upload-field">
<input name="imageUrl" value="${safeUrl}" placeholder="Cloudinary URL will appear here after upload">
<label class="image-upload-drop">
<input type="file" class="cloudinary-upload-input" accept="image/*" data-target="imageUrl">
<span class="upload-icon"><i data-lucide="image-up"></i></span>
<span class="upload-copy"><strong>Upload image</strong><small>Choose an image, then Save to upload it to Cloudinary.</small></span>
</label>
<div class="image-upload-preview ${hasImage?'':'hidden'}">
<img src="${safeUrl}" alt="">
</div>
<span class="helper-text image-upload-status">You can still paste a URL manually. A selected file replaces it after upload.</span>
</div>
</div>`;
}

function initImageUploadControls(form){
form.querySelectorAll('.cloudinary-upload-input').forEach(input=>{
input.addEventListener('change',()=>{
const file=input.files?.[0];
const field=input.closest('.image-upload-field');
const preview=field?.querySelector('.image-upload-preview');
const previewImg=preview?.querySelector('img');
const status=field?.querySelector('.image-upload-status');
if(!file){
if(status)status.textContent='You can still paste a URL manually. A selected file replaces it after upload.';
return;
}
if(preview?.dataset.objectUrl)URL.revokeObjectURL(preview.dataset.objectUrl);
const objectUrl=URL.createObjectURL(file);
if(previewImg)previewImg.src=objectUrl;
if(preview){preview.dataset.objectUrl=objectUrl;preview.classList.remove('hidden')}
if(status)status.textContent=`Selected: ${file.name}. It will upload when you save.`;
});
});
}

async function uploadPendingImages(form){
const inputs=[...form.querySelectorAll('.cloudinary-upload-input')];
for(const input of inputs){
const file=input.files?.[0];
if(!file)continue;
const target=input.dataset.target;
const urlInput=form.querySelector(`[name="${target}"]`);
const field=input.closest('.image-upload-field');
const status=field?.querySelector('.image-upload-status');
if(status){status.textContent='Uploading image to Cloudinary...';status.classList.add('uploading')}
try{
const imageUrl=await uploadImageToCloudinary(file);
if(urlInput)urlInput.value=imageUrl;
const preview=field?.querySelector('.image-upload-preview');
const previewImg=preview?.querySelector('img');
if(preview?.dataset.objectUrl){URL.revokeObjectURL(preview.dataset.objectUrl);delete preview.dataset.objectUrl}
if(previewImg)previewImg.src=imageUrl;
input.value='';
if(status)status.textContent='Image uploaded. Saving item...';
}finally{
if(status)status.classList.remove('uploading');
}
}
}

function setFormSubmitting(form,isSubmitting){
const btn=form.querySelector('button[type="submit"]');
if(!btn)return;
if(!btn.dataset.defaultHtml)btn.dataset.defaultHtml=btn.innerHTML;
btn.disabled=isSubmitting;
btn.innerHTML=isSubmitting?'<i data-lucide="loader-circle"></i><span>Saving...</span>':btn.dataset.defaultHtml;
lucide?.createIcons({nodes:[btn]});
}

// Toast
function showToast(msg,type='success',dur=3500){
const c=$('toastContainer');if(!c)return;
const t=document.createElement('div');t.className=`toast toast-${type}`;
const icons={success:'check-circle-2',error:'alert-circle',info:'info',warning:'alert-triangle'};
t.innerHTML=`<i data-lucide="${icons[type]||'info'}"></i><span>${msg}</span>`;
c.appendChild(t);lucide?.createIcons({nodes:[t]});
requestAnimationFrame(()=>t.classList.add('show'));
setTimeout(()=>{t.classList.remove('show');t.addEventListener('transitionend',()=>t.remove())},dur);
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
lucide?.createIcons();
onAuthStateChanged(auth,async user=>{
if(!user){window.location.href='admin/';return}
const isAdmin=await checkAdminRole(user.uid);
if(!isAdmin){await signOut(auth);window.location.href='admin/';return}
$('authGuard').classList.add('hidden');
initDashboard();
});
});

function initDashboard(){
initNav();initLang();initLogout();initMobile();
loadModule('overview');
}

// Navigation
function initNav(){
document.querySelectorAll('.sidebar-link').forEach(btn=>{
btn.addEventListener('click',()=>{
document.querySelectorAll('.sidebar-link').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
const mod=btn.dataset.module;
document.querySelectorAll('.dash-module').forEach(m=>m.classList.add('hidden'));
const el=$(`module-${mod}`);if(el){el.classList.remove('hidden')}
loadModule(mod);
closeMobileSidebar();
});
});
}

function initLang(){
applyLang(currentLang);
$('dashLangToggle')?.addEventListener('click',()=>{
currentLang=currentLang==='en'?'ar':'en';
localStorage.setItem('lang',currentLang);applyLang(currentLang);
});
}

function applyLang(lang){
document.documentElement.lang=lang;
document.documentElement.dir=lang==='ar'?'rtl':'ltr';
const l=$('dashCurrentLang');if(l)l.textContent=lang==='en'?'EN':'AR';
if(window.i18nTranslations?.[lang]){
const t=window.i18nTranslations[lang];
document.querySelectorAll('[data-i18n]').forEach(el=>{
const k=el.getAttribute('data-i18n');if(t[k])el.innerHTML=t[k];
});
}
}

function tr(key,fallback){
return window.i18nTranslations?.[currentLang]?.[key]||fallback;
}

function escapeHTML(value){
return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function initLogout(){
const logout=async()=>{await signOut(auth);window.location.href='admin/'};
$('dashLogout')?.addEventListener('click',logout);
$('mobileLogout')?.addEventListener('click',logout);
}

function initMobile(){
$('mobileMenuBtn')?.addEventListener('click',()=>{
$('dashSidebar')?.classList.toggle('open');
$('sidebarOverlay')?.classList.toggle('active');
});
$('sidebarOverlay')?.addEventListener('click',closeMobileSidebar);
}
function closeMobileSidebar(){
$('dashSidebar')?.classList.remove('open');
$('sidebarOverlay')?.classList.remove('active');
}

// Module loader
async function loadModule(mod){
try{
if(mod==='overview')await loadOverview();
else if(mod==='settings')await loadSettings();
else if(mod==='services')await loadCRUD('services');
else if(mod==='skills')await loadCRUD('skills');
else if(mod==='experience')await loadCRUD('experience');
else if(mod==='certificates')await loadCRUD('certificates');
else if(mod==='education')await loadCRUD('education');
else if(mod==='projects')await loadCRUD('projects');
else if(mod==='messages')await loadMessages();
}catch(e){console.error('Module load error:',e)}
}

// Overview
async function loadOverview(){
const grid=$('statsGrid');
if(!grid)return;
const stats=[
{key:'services',icon:'briefcase',labelKey:'dashServices',fallback:'Services',ref:()=>collection(db,'services')},
{key:'skills',icon:'cpu',labelKey:'dashSkills',fallback:'Skills',ref:()=>collection(db,'skills')},
{key:'experience',icon:'briefcase-business',labelKey:'dashExperience',fallback:'Experience',ref:()=>collection(db,'experience')},
{key:'certificates',icon:'award',labelKey:'dashCertificates',fallback:'Certificates',ref:()=>collection(db,'certificates')},
{key:'education',icon:'graduation-cap',labelKey:'dashEducation',fallback:'Education',ref:()=>collection(db,'education')},
{key:'projects',icon:'folder-open',labelKey:'dashProjects',fallback:'Projects',ref:()=>collection(db,'projects')},
{key:'messages',icon:'mail',labelKey:'dashUnreadMessages',fallback:'Unread Messages',ref:()=>query(collection(db,'messages'),where('isRead','==',false))}
];
grid.innerHTML=stats.map(s=>renderStatCard({...s,num:'...',loading:true,ok:true})).join('');
lucide?.createIcons();
const loaded=await Promise.all(stats.map(async s=>{
try{
const snap=await getDocs(s.ref());
return{...s,num:snap.size,ok:true};
}catch(error){
console.error(`Overview count failed for ${s.key}:`,error);
return{...s,num:'--',ok:false};
}
}));
grid.innerHTML=loaded.map(renderStatCard).join('');
if(loaded.some(s=>!s.ok))showToast(tr('dashOverviewLoadError','Some overview counts could not load.'),'warning');
const msgs=loaded.find(s=>s.key==='messages');
updateUnreadBadge(msgs?.ok?msgs.num:0);
lucide?.createIcons();
}

function renderStatCard(s){
const classes=`stat-card${s.loading?' stat-card-loading':''}${!s.ok?' stat-card-error':''}`;
const errorTitle=!s.ok?` title="${escapeHTML(tr('dashOverviewStatError','Could not load this count'))}"`:'';
return`<div class="${classes}"${errorTitle}><div class="stat-card-header"><div class="stat-card-icon"><i data-lucide="${s.icon}"></i></div></div><div class="stat-card-number">${escapeHTML(s.num)}</div><div class="stat-card-label">${escapeHTML(tr(s.labelKey,s.fallback))}</div></div>`;
}

function updateUnreadBadge(count){
const badge=$('unreadBadge');
if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none'}
}

// Settings
async function loadSettings(){
const s=await fetchSiteSettings();
if(s){
$('settingHeroTitle').value=s.heroTitle||'';
$('settingHeroRole').value=s.heroRole||'';
$('settingContactEmail').value=s.contactEmail||'';
$('settingContactPhone').value=s.contactPhone||'';
}
$('settingsForm').onsubmit=async e=>{
e.preventDefault();
try{
await setDoc(doc(db,'siteSettings','main'),{
heroTitle:$('settingHeroTitle').value,heroRole:$('settingHeroRole').value,
contactEmail:$('settingContactEmail').value,contactPhone:$('settingContactPhone').value,
updatedAt:serverTimestamp()
},{merge:true});
showToast(currentLang==='ar'?'تم حفظ الإعدادات':'Settings saved!');
}catch(err){showToast(err.message,'error')}
};
}

// Generic CRUD
async function loadCRUD(type){
const items=await fetchAllOrdered(type);
const tbody=$(`${type}TableBody`);
const empty=$(`${type}Empty`);
const addBtn=$(`add${type.charAt(0).toUpperCase()+type.slice(1,-1)}Btn`)||$(`add${type.charAt(0).toUpperCase()+type.slice(1)}Btn`);
if(addBtn){addBtn.onclick=()=>openEditModal(type,null,null)}
if(!items.length){tbody.innerHTML='';empty?.classList.remove('hidden');return}
empty?.classList.add('hidden');
tbody.innerHTML=items.map(item=>renderRow(type,item)).join('');
// Bind actions
tbody.querySelectorAll('.toggle-switch input').forEach(inp=>{
inp.addEventListener('change',async()=>{
await updateDoc(doc(db,type,inp.dataset.id),{[inp.dataset.field]:inp.checked,updatedAt:serverTimestamp()});
showToast('Updated');if(type==='projects'||type==='services')return;
});
});
tbody.querySelectorAll('.btn-edit').forEach(btn=>{
btn.addEventListener('click',()=>openEditModal(type,btn.dataset.id,items.find(i=>i.id===btn.dataset.id)));
});
tbody.querySelectorAll('.btn-delete').forEach(btn=>{
btn.addEventListener('click',()=>confirmDelete(type,btn.dataset.id));
});
lucide?.createIcons();
}

function renderRow(type,item){
const acts=`<td class="actions-cell"><button class="btn-icon btn-edit" data-id="${item.id}"><i data-lucide="edit-3"></i></button><button class="btn-icon danger btn-delete" data-id="${item.id}"><i data-lucide="trash-2"></i></button></td>`;
const toggle=(field,val,id)=>`<td><label class="toggle-switch"><input type="checkbox" ${val?'checked':''} data-id="${id}" data-field="${field}"><span class="toggle-slider"></span></label></td>`;
if(type==='services')return`<tr><td>${item.order||0}</td><td>${item.title||''}</td><td>${item.category||''}</td><td>$${item.priceMin||0}–$${item.priceMax||0}</td>${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
if(type==='skills')return`<tr><td>${item.order||0}</td><td>${item.name||''}</td><td>${item.category||''}</td><td>${item.level||0}%</td>${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
if(type==='experience')return`<tr><td>${item.order||0}</td><td>${item.role||''}</td><td>${item.company||''}</td><td>${item.date||''}</td>${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
if(type==='certificates')return`<tr><td>${item.order||0}</td><td>${item.title||''}</td><td>${item.issuer||''}</td>${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
if(type==='education')return`<tr><td>${item.order||0}</td><td>${item.title||''}</td><td>${item.institution||''}</td><td>${item.date||''}</td>${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
if(type==='projects')return`<tr><td>${item.order||0}</td><td>${item.title||''}</td>${toggle('isFeatured',item.isFeatured,item.id)}${toggle('isActive',item.isActive,item.id)}${acts}</tr>`;
return'';
}

// Modal
function openEditModal(type,id,data){
const modal=$('dashModal');
const title=$('modalTitle');
const body=$('modalBody');
const isEdit=!!id;
const isAr=currentLang==='ar';
title.textContent=isEdit?(isAr?'تعديل':'Edit'):(isAr?'إضافة جديد':'Add New');
body.innerHTML=getFormHTML(type,data);
modal.classList.add('active');
$('modalClose').onclick=()=>modal.classList.remove('active');
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('active')},{once:true});
const form=body.querySelector('form');
initImageUploadControls(form);
form.onsubmit=async e=>{
e.preventDefault();
try{
setFormSubmitting(form,true);
await uploadPendingImages(form);
const formData=extractFormData(type,form);
if(isEdit){await updateDoc(doc(db,type,id),{...formData,updatedAt:serverTimestamp()})}
else{await addDoc(collection(db,type),{...formData,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}
modal.classList.remove('active');
showToast(isEdit?(isAr?'تم التحديث':'Updated!'):(isAr?'تمت الإضافة':'Added!'));
loadCRUD(type);
}catch(err){showToast(err.message,'error')}
finally{setFormSubmitting(form,false)}
};
lucide?.createIcons();
}

function arSection(){
return`<div class="form-section-divider"><span>Arabic Translation (العربية)</span></div>`;
}

function getFormHTML(type,d){
d=d||{};
const v=(k,def='')=>d[k]!=null?d[k]:def;
const chk=(k,def=k==='isActive')=>v(k,def)?'checked':'';
if(type==='services')return`<form>
<div class="form-group"><label>Title (English)</label><input name="title" value="${escapeHTML(v('title'))}" required></div>
<div class="form-group"><label>Category</label><input name="category" value="${escapeHTML(v('category'))}"></div>
<div class="form-group"><label>Description (English)</label><textarea name="description">${escapeHTML(v('description'))}</textarea></div>
<div class="form-group"><label>Icon (Lucide name)</label><input name="icon" value="${escapeHTML(v('icon'))}"><span class="helper-text">e.g. brain-circuit, shopping-bag</span></div>
<div class="form-group"><label>Features (English, comma separated)</label><input name="features" value="${escapeHTML((v('features',[])).join(', '))}"></div>
<div class="form-row"><div class="form-group"><label>Price Min ($)</label><input type="number" name="priceMin" value="${v('priceMin',0)}"></div>
<div class="form-group"><label>Price Max ($)</label><input type="number" name="priceMax" value="${v('priceMax',0)}"></div></div>
${arSection()}
<div class="form-group"><label>العنوان (Title Arabic)</label><input name="titleAr" value="${escapeHTML(v('titleAr'))}" dir="rtl"></div>
<div class="form-group"><label>التصنيف (Category Arabic)</label><input name="categoryAr" value="${escapeHTML(v('categoryAr'))}" dir="rtl"></div>
<div class="form-group"><label>الوصف (Description Arabic)</label><textarea name="descriptionAr" dir="rtl">${escapeHTML(v('descriptionAr'))}</textarea></div>
<div class="form-group"><label>المميزات (Features Arabic, comma separated)</label><input name="featuresAr" value="${escapeHTML((v('featuresAr',[])).join(', '))}" dir="rtl"></div>
<div class="form-row"><div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div>
<div class="form-group"><label class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}> Active</label></div></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
if(type==='skills')return`<form>
<div class="form-group"><label>Name (English)</label><input name="name" value="${escapeHTML(v('name'))}" required></div>
<div class="form-group"><label>Category (English)</label><input name="category" value="${escapeHTML(v('category'))}"></div>
<div class="form-row"><div class="form-group"><label>Icon Type</label><select name="iconType"><option value="icon" ${v('iconType')==='icon'?'selected':''}>Lucide Icon</option><option value="image" ${v('iconType')==='image'?'selected':''}>Image URL</option></select></div>
<div class="form-group"><label>Icon Value</label><input name="iconValue" value="${escapeHTML(v('iconValue'))}"><span class="helper-text">Lucide name or image URL</span></div></div>
<div class="form-row"><div class="form-group"><label>Level (0-100)</label><input type="number" name="level" min="0" max="100" value="${v('level',0)}"></div>
<div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div></div>
${arSection()}
<div class="form-group"><label>الاسم (Name Arabic)</label><input name="nameAr" value="${escapeHTML(v('nameAr'))}" dir="rtl"></div>
<div class="form-group"><label>التصنيف (Category Arabic)</label><input name="categoryAr" value="${escapeHTML(v('categoryAr'))}" dir="rtl"></div>
<div class="form-group"><label class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}> Active</label></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
if(type==='experience')return`<form>
<div class="form-group"><label>Role (English)</label><input name="role" value="${escapeHTML(v('role'))}" required></div>
<div class="form-row"><div class="form-group"><label>Company (English)</label><input name="company" value="${escapeHTML(v('company'))}"></div>
<div class="form-group"><label>Date (English)</label><input name="date" value="${escapeHTML(v('date'))}" placeholder="Jan 2026 - Present"></div></div>
<div class="form-group"><label>Description (English)</label><textarea name="description">${escapeHTML(v('description'))}</textarea></div>
<div class="form-group"><label>Tags (comma separated)</label><input name="tags" value="${escapeHTML((v('tags',[])).join(', '))}"></div>
${arSection()}
<div class="form-group"><label>المسمى الوظيفي (Role Arabic)</label><input name="roleAr" value="${escapeHTML(v('roleAr'))}" dir="rtl"></div>
<div class="form-row"><div class="form-group"><label>الشركة (Company Arabic)</label><input name="companyAr" value="${escapeHTML(v('companyAr'))}" dir="rtl"></div>
<div class="form-group"><label>التاريخ (Date Arabic)</label><input name="dateAr" value="${escapeHTML(v('dateAr'))}" dir="rtl" placeholder="يناير 2026 - حتى الآن"></div></div>
<div class="form-group"><label>الوصف (Description Arabic)</label><textarea name="descriptionAr" dir="rtl">${escapeHTML(v('descriptionAr'))}</textarea></div>
<div class="form-row"><div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div>
<div class="form-group"><label class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}> Active</label></div></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
if(type==='certificates')return`<form>
<div class="form-group"><label>Title (English)</label><input name="title" value="${escapeHTML(v('title'))}" required></div>
<div class="form-row"><div class="form-group"><label>Issuer (English)</label><input name="issuer" value="${escapeHTML(v('issuer'))}"></div>
<div class="form-group"><label>Issue Date</label><input name="issueDate" value="${escapeHTML(v('issueDate'))}"></div></div>
<div class="form-group"><label>Credential ID</label><input name="credentialId" value="${escapeHTML(v('credentialId'))}"></div>
${renderImageUploadField('Image',v('imageUrl'))}
<div class="form-group"><label>Verify URL</label><input name="verifyUrl" value="${escapeHTML(v('verifyUrl'))}"></div>
${arSection()}
<div class="form-group"><label>العنوان (Title Arabic)</label><input name="titleAr" value="${escapeHTML(v('titleAr'))}" dir="rtl"></div>
<div class="form-group"><label>الجهة المانحة (Issuer Arabic)</label><input name="issuerAr" value="${escapeHTML(v('issuerAr'))}" dir="rtl"></div>
<div class="form-row"><div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div>
<div class="form-group"><label class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}> Active</label></div></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
if(type==='education')return`<form>
<div class="form-group"><label>Title / Degree (English)</label><input name="title" value="${escapeHTML(v('title'))}" required></div>
<div class="form-row"><div class="form-group"><label>Institution (English)</label><input name="institution" value="${escapeHTML(v('institution'))}"></div>
<div class="form-group"><label>Date (English)</label><input name="date" value="${escapeHTML(v('date'))}" placeholder="Aug 2022 - Expected Jul 2026"></div></div>
<div class="form-group"><label>Description (English)</label><textarea name="description">${escapeHTML(v('description'))}</textarea></div>
<div class="form-group"><label>Highlights (comma separated)</label><input name="highlights" value="${escapeHTML((v('highlights',[])).join(', '))}"></div>
<div class="form-group"><label>Icon (Lucide name)</label><input name="icon" value="${escapeHTML(v('icon','graduation-cap'))}"></div>
${arSection()}
<div class="form-group"><label>العنوان / الدرجة (Title Arabic)</label><input name="titleAr" value="${escapeHTML(v('titleAr'))}" dir="rtl"></div>
<div class="form-row"><div class="form-group"><label>الجامعة (Institution Arabic)</label><input name="institutionAr" value="${escapeHTML(v('institutionAr'))}" dir="rtl"></div>
<div class="form-group"><label>التاريخ (Date Arabic)</label><input name="dateAr" value="${escapeHTML(v('dateAr'))}" dir="rtl"></div></div>
<div class="form-group"><label>الوصف (Description Arabic)</label><textarea name="descriptionAr" dir="rtl">${escapeHTML(v('descriptionAr'))}</textarea></div>
<div class="form-row"><div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div>
<div class="form-group"><label class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}> Active</label></div></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
if(type==='projects')return`<form>
<div class="form-group"><label>Title (English)</label><input name="title" value="${escapeHTML(v('title'))}" required></div>
<div class="form-group"><label>Description (English)</label><textarea name="description">${escapeHTML(v('description'))}</textarea></div>
${renderImageUploadField('Project Image',v('imageUrl'))}
<div class="form-row"><div class="form-group"><label>GitHub URL</label><input name="githubUrl" value="${escapeHTML(v('githubUrl'))}"></div>
<div class="form-group"><label>Live URL</label><input name="liveUrl" value="${escapeHTML(v('liveUrl'))}"></div></div>
<div class="form-group"><label>Tags (comma separated)</label><input name="tags" value="${escapeHTML((v('tags',[])).join(', '))}"></div>
<div class="form-group"><label>Features (English, comma separated)</label><input name="features" value="${escapeHTML((v('features',[])).join(', '))}"></div>
<div class="form-group"><label>Date (English)</label><input name="date" value="${escapeHTML(v('date'))}" placeholder="Jan 2026"></div>
${arSection()}
<div class="form-group"><label>العنوان (Title Arabic)</label><input name="titleAr" value="${escapeHTML(v('titleAr'))}" dir="rtl"></div>
<div class="form-group"><label>الوصف (Description Arabic)</label><textarea name="descriptionAr" dir="rtl">${escapeHTML(v('descriptionAr'))}</textarea></div>
<div class="form-group"><label>المميزات (Features Arabic, comma separated)</label><input name="featuresAr" value="${escapeHTML((v('featuresAr',[])).join(', '))}" dir="rtl"></div>
<div class="form-group"><label>التاريخ (Date Arabic)</label><input name="dateAr" value="${escapeHTML(v('dateAr'))}" dir="rtl" placeholder="يناير 2026"></div>
<div class="form-row"><div class="form-group"><label>Order</label><input type="number" name="order" value="${v('order',0)}"></div>
<div class="form-group"><div class="form-check" style="margin-top:24px"><input type="checkbox" name="isFeatured" ${chk('isFeatured')}><label>Featured</label></div>
<div class="form-check"><input type="checkbox" name="isActive" ${chk('isActive')}><label>Active</label></div></div></div>
<div class="form-actions"><button type="submit" class="btn-dash-primary"><i data-lucide="save"></i><span>Save</span></button></div></form>`;
return'';
}

function extractFormData(type,form){
const fd=new FormData(form);
const str=k=>String(fd.get(k)||'').trim();
const num=k=>parseInt(fd.get(k))||0;
const bool=k=>form.querySelector(`[name="${k}"]`)?.checked||false;
const arr=k=>(fd.get(k)||'').split(',').map(s=>s.trim()).filter(Boolean);
const lines=k=>(fd.get(k)||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
if(type==='services')return{title:str('title'),titleAr:str('titleAr'),category:str('category'),categoryAr:str('categoryAr'),description:str('description'),descriptionAr:str('descriptionAr'),icon:str('icon'),features:arr('features'),featuresAr:arr('featuresAr'),priceMin:num('priceMin'),priceMax:num('priceMax'),order:num('order'),isActive:bool('isActive')};
if(type==='skills')return{name:str('name'),nameAr:str('nameAr'),category:str('category'),categoryAr:str('categoryAr'),iconType:str('iconType'),iconValue:str('iconValue'),level:num('level'),order:num('order'),isActive:bool('isActive')};
if(type==='experience')return{role:str('role'),roleAr:str('roleAr'),company:str('company'),companyAr:str('companyAr'),date:str('date'),dateAr:str('dateAr'),description:str('description'),descriptionAr:str('descriptionAr'),tags:arr('tags'),order:num('order'),isActive:bool('isActive')};
if(type==='certificates')return{title:str('title'),titleAr:str('titleAr'),issuer:str('issuer'),issuerAr:str('issuerAr'),issueDate:str('issueDate'),credentialId:str('credentialId'),imageUrl:str('imageUrl'),verifyUrl:str('verifyUrl'),order:num('order'),isActive:bool('isActive')};
if(type==='education')return{title:str('title'),titleAr:str('titleAr'),institution:str('institution'),institutionAr:str('institutionAr'),date:str('date'),dateAr:str('dateAr'),description:str('description'),descriptionAr:str('descriptionAr'),highlights:arr('highlights'),icon:str('icon')||'graduation-cap',order:num('order'),isActive:bool('isActive')};
if(type==='projects')return{title:str('title'),titleAr:str('titleAr'),description:str('description'),descriptionAr:str('descriptionAr'),imageUrl:str('imageUrl'),githubUrl:str('githubUrl'),liveUrl:str('liveUrl'),tags:arr('tags'),features:arr('features'),featuresAr:arr('featuresAr'),date:str('date'),dateAr:str('dateAr'),order:num('order'),isActive:bool('isActive'),isFeatured:bool('isFeatured')};
return{};
}

// Delete confirm
function confirmDelete(type,id){
const dialog=$('confirmDialog');
dialog.style.display='flex';
$('confirmCancel').onclick=()=>dialog.style.display='none';
$('confirmOk').onclick=async()=>{
try{await deleteDoc(doc(db,type,id));dialog.style.display='none';showToast(currentLang==='ar'?'تم الحذف':'Deleted');if(type==='messages'){loadMessages();loadOverviewBadge()}else{loadCRUD(type)}}
catch(e){showToast(e.message,'error')}
};
lucide?.createIcons();
}

// Messages
async function loadMessages(){
const q2=query(collection(db,'messages'),orderBy('createdAt','desc'));
const snap=await getDocs(q2);
const list=$('messagesList');
const empty=$('messagesEmpty');
if(snap.empty){list.innerHTML='';empty?.classList.remove('hidden');return}
empty?.classList.add('hidden');
list.innerHTML=snap.docs.map(d=>{
const m=d.data();const id=d.id;
const date=m.createdAt?.toDate?m.createdAt.toDate().toLocaleDateString():'';
return`<div class="message-item ${m.isRead?'':'unread'}" data-id="${id}">
<div class="message-dot"></div>
<div class="message-content"><div class="message-top"><span class="message-sender">${m.name||''}</span><span class="message-date">${date}</span></div>
<div class="message-subject">${m.subject||'(No subject)'}</div></div>
<div class="message-actions"><button class="btn-icon btn-msg-toggle" data-id="${id}" data-read="${m.isRead}" title="Toggle read"><i data-lucide="${m.isRead?'mail':'mail-open'}"></i></button>
<button class="btn-icon danger btn-msg-delete" data-id="${id}" title="Delete"><i data-lucide="trash-2"></i></button></div></div>`;
}).join('');
// Bind events
list.querySelectorAll('.message-item').forEach(el=>{
el.addEventListener('click',async e=>{
if(e.target.closest('.btn-icon'))return;
const id=el.dataset.id;const d=snap.docs.find(x=>x.id===id);if(!d)return;
const m=d.data();
if(!m.isRead)await updateDoc(doc(db,'messages',id),{isRead:true,updatedAt:serverTimestamp()});
openMessageDetail(m,id);loadMessages();
});
});
list.querySelectorAll('.btn-msg-toggle').forEach(btn=>{
btn.addEventListener('click',async e=>{
e.stopPropagation();const id=btn.dataset.id;const isRead=btn.dataset.read==='true';
await updateDoc(doc(db,'messages',id),{isRead:!isRead,updatedAt:serverTimestamp()});
showToast(isRead?'Marked unread':'Marked read');loadMessages();loadOverviewBadge();
});
});
list.querySelectorAll('.btn-msg-delete').forEach(btn=>{
btn.addEventListener('click',e=>{
e.stopPropagation();confirmDelete('messages',btn.dataset.id);
});
});
lucide?.createIcons();
}

async function loadOverviewBadge(){
try{
const msgs=await getDocs(query(collection(db,'messages'),where('isRead','==',false)));
updateUnreadBadge(msgs.size);
}catch(error){
console.error('Unread badge load failed:',error);
updateUnreadBadge(0);
}
}

function openMessageDetail(m,id){
const overlay=$('messageDetailOverlay');
const body=$('messageDetailBody');
const date=m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():'';
body.innerHTML=`
<div class="message-detail-row"><span class="message-detail-label">From</span><span class="message-detail-value">${m.name||''}</span></div>
<div class="message-detail-row"><span class="message-detail-label">Email</span><span class="message-detail-value">${m.email||''}</span></div>
<div class="message-detail-row"><span class="message-detail-label">Phone</span><span class="message-detail-value">${m.phone||'—'}</span></div>
<div class="message-detail-row"><span class="message-detail-label">Subject</span><span class="message-detail-value">${m.subject||'—'}</span></div>
<div class="message-detail-row"><span class="message-detail-label">Date</span><span class="message-detail-value">${date}</span></div>
<div class="message-body-text">${m.message||''}</div>`;
overlay.style.display='flex';
$('messageDetailClose').onclick=()=>overlay.style.display='none';
overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.style.display='none'},{once:true});
}
