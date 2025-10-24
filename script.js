// ==============================
// script.js – V22 (final consolidée)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
// ---- DOM
const form = document.getElementById("questionnaireForm");
const zonesBox = document.getElementById("zones");
const zoneQuestions = document.getElementById("zoneQuestions");
const btnSubmit = document.getElementById("submitBtn");
const msg = document.getElementById("resultMessage");

const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

// Champs "autre" pour rôle/structure + communs
const roleAutre = document.getElementById("role-autre");
const roleAutreWrap = document.getElementById("role-autre-wrap");
const structAutre = document.getElementById("struct-autre");
const structAutreWrap = document.getElementById("struct-autre-wrap");
const commBarAutre = document.getElementById("comm-bar-autre");
const commBarAutreWrap = document.getElementById("comm-bar-autre-wrap");
const commRaisAutre = document.getElementById("comm-rais-autre");
const commRaisAutreWrap = document.getElementById("comm-rais-autre-wrap");

const globalFunctionalMI = document.getElementById("global-functional-mi");
const globalFunctionalMS = document.getElementById("global-functional-ms");
const globalJumps = document.getElementById("global-jumps");
const globalCourse = document.getElementById("global-course");
const globalCombat = document.getElementById("global-combat");

// ---- Constantes & helpers
const ENDPOINT = window.GFORM_ENDPOINT;
const ENTRY = window.GFORM_ENTRY_KEY;

const lowerBody = ["Hanche","Genou","Cheville / Pied"];
const upperBody = ["Épaule","Coude","Poignet / Main"];
const headNeck = "Tête / Rachis cervical";

const slug = s => s.toLowerCase().normalize("NFD")
.replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-");

function addOtherField(container, checkedEl, placeholder="Précisez"){
// Supprimer un éventuel doublon existant pour ce groupe
let wrap = container.querySelector(".other-wrap");
if (checkedEl && checkedEl.checked) {
if (!wrap) {
wrap = document.createElement("div");
wrap.className = "slide show other-wrap";
wrap.innerHTML = `<input type="text" class="other-input" placeholder="${placeholder}" required style="width:100%;padding:8px;border:1px solid #d9dee7;border-radius:8px">`;
container.appendChild(wrap);
}
} else if (wrap) {
wrap.classList.remove("show");
setTimeout(()=>wrap.remove(),300);
}
}

function makeOtherReactive(scope, labelText="Précisez"){
const cbs = scope.querySelectorAll("input[type='checkbox'],input[type='radio']");
cbs.forEach(cb => {
if (!cb.value) return;
const val = cb.value.toLowerCase();
if (val === "autre" || val.includes("autre")) {
cb.addEventListener("change", () => {
const grp = cb.closest(".checkbox-group") || scope;
addOtherField(grp, cb, labelText);
});
}
});
}

function attachIsokineticHandlers(scope){
// Pour chaque groupe d'outils, si "Isocinétisme" est coché → vitesses & modes
scope.querySelectorAll(".tools-group").forEach(group=>{
const iso = group.querySelector("input[type='checkbox'][value='Isocinétisme']");
if (!iso) return;
const ensure = ()=>{
let sub = group.parentElement.querySelector(".isokinetic-sub");
if (iso.checked){
if (!sub){
sub = document.createElement("div");
sub.className = "slide show isokinetic-sub";
sub.innerHTML = `
<label>Vitesse (isocinétisme)</label>
<div class="checkbox-group iso-speed">
<label><input type="checkbox" value="30°/s"> 30°/s</label>
<label><input type="checkbox" value="60°/s"> 60°/s</label>
<label><input type="checkbox" value="120°/s"> 120°/s</label>
<label><input type="checkbox" value="180°/s"> 180°/s</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Mode de contraction (isocinétisme)</label>
<div class="checkbox-group iso-mode">
<label><input type="checkbox" value="Concentrique"> Concentrique</label>
<label><input type="checkbox" value="Excentrique"> Excentrique</label>
<label><input type="checkbox" value="Isométrique"> Isométrique</label>
<label><input type="checkbox" value="Combiné"> Combiné</label>
</div>
`;
group.insertAdjacentElement("afterend", sub);
makeOtherReactive(sub.querySelector(".iso-speed"), "Vitesse (précisez)");
}
} else if (sub){
sub.classList.remove("show");
setTimeout(()=>sub.remove(),300);
}
};
iso.addEventListener("change", ensure);
ensure();
});
}

function hasUncheckedOther(scope){
const others = scope.querySelectorAll("input[value='Autre']:checked, input[value='Autres']:checked");
for (const oc of others){
const grp = oc.closest(".checkbox-group");
const txt = grp && grp.querySelector(".other-input");
if (!txt || !txt.value.trim()) return true;
}
return false;
}

function updateProgress(){
// Approche simple : % d'éléments avec au moins 1 sélection/champ rempli
const sections = document.querySelectorAll(".card");
let filled=0, total=sections.length;
sections.forEach(sec=>{
const anyChecked = sec.querySelector("input:checked");
const anyText = sec.querySelector("input[type='text'][value]:not([value=''])");
if (anyChecked || anyText) filled++;
});
const pct = Math.max(0, Math.min(100, Math.round(100*filled/Math.max(1,total))));
progressBar.style.width = pct+"%";
progressText.textContent = `Progression : ${pct}%`;
}
document.addEventListener("change", updateProgress);
document.addEventListener("input", updateProgress);

// Champs "Autre" : rôle / structure / communs
function toggleAutreRadio(radio, wrap, placeholder){
const on = radio && radio.checked;
addOtherField(wrap, on ? radio : null, placeholder);
}
roleAutre?.addEventListener("change", ()=>toggleAutreRadio(roleAutre, roleAutreWrap, "Précisez votre rôle"));
structAutre?.addEventListener("change", ()=>toggleAutreRadio(structAutre, structAutreWrap, "Précisez l’équipe"));
commBarAutre?.addEventListener("change", ()=>toggleAutreRadio(commBarAutre, commBarAutreWrap, "Précisez la barrière"));
commRaisAutre?.addEventListener("change", ()=>toggleAutreRadio(commRaisAutre, commRaisAutreWrap, "Précisez le motif"));
// init si pré-coché
toggleAutreRadio(roleAutre, roleAutreWrap, "Précisez votre rôle");
toggleAutreRadio(structAutre, structAutreWrap, "Précisez l’équipe");
toggleAutreRadio(commBarAutre, commBarAutreWrap, "Précisez la barrière");
toggleAutreRadio(commRaisAutre, commRaisAutreWrap, "Précisez le motif");

// ----- Données
const toolsForceGeneric = ["Dynamomètre manuel","Dynamomètre fixe","Isocinétisme","Plateforme de force","Sans outil","Autre"];
const toolsMobilityGeneric = ["Goniomètre","Inclinomètre","Autre"];
const paramsForceWithUnits = [
"Force max (N)","Force moyenne (N)","Force relative (N/kg)",
"Puissance max (W)","Puissance relative (W/kg)","RFD (N/s)",
"Angle du pic de force (°)","Endurance","Autre"
];
const criteriaForce = ["Ratio agoniste/antagoniste","Ratio droite/gauche","Valeur de référence individuelle","Autre"];
const criteriaMobilityGeneric = ["Comparaison droite/gauche","Valeur de référence individuelle","Autre"];
const criteriaMobilityLumbar = ["Moyenne du groupe","Valeur de référence individuelle","Autre"];

const proprioByZone = {
"Cheville / Pied": ["Y-Balance Test","Star Excursion","Single Leg Balance Test","Autre"],
"Genou": ["Y-Balance Test","Star Excursion","FMS (Lower)","Autre"],
"Hanche": ["Y-Balance Test","Star Excursion","FMS (Lower)","Autre"],
"Épaule": ["Y-Balance Test (épaule)","FMS (Upper)","Autre"],
[headNeck]: ["Test proprio cervical (laser)","Autre"],
"Poignet / Main": ["Autre"],
"Coude": ["Autre"],
"Rachis lombaire": ["FMS (Core)","Autre"]
};

const questionnairesByZone = {
"Genou": ["KOOS","IKDC","Lysholm","Tegner","ACL-RSI","KOS-ADLS","LEFS","Autre"],
"Hanche": ["HAGOS","iHOT-12","HOOS","HOS","Autre"],
"Épaule": ["QuickDASH","DASH","SIRSI","ASES","SPADI","Oxford Shoulder Score","Autre"],
"Coude": ["Oxford Elbow Score","MEPS","DASH","QuickDASH","Autre"],
"Poignet / Main": ["PRWE","DASH","QuickDASH","Boston Carpal Tunnel","Autre"],
"Cheville / Pied": ["CAIT","FAAM-ADL","FAAM-Sport","FAOS","FFI","Autre"],
"Rachis lombaire": ["ODI (Oswestry)","Roland-Morris","Quebec Back Pain","FABQ","Autre"],
[headNeck]: ["SCAT6","Neck Disability Index (NDI)","Copenhagen Neck Functional Scale","Autre"]
};

// Listes de tests “force” par muscle/articulation (sans dupliquer l’isocinétisme ici)
const testsByMuscle = {
// Genou
"Ischiojambiers": ["McCall 90°","Isométrie 30°","Nordic","Nordic Hold","Razor Curl","Single Leg Bridge","Autre"],
"Quadriceps": ["Isométrie 60°","Leg Extension","Single Leg Squat","Autre"],

// Hanche — on utilise maintenant le mouvement pour sauter le sous-choix “groupe”
"Fléchisseurs hanche": ["Isométrique 45°","Straight Leg Raise (force)","Autre"],
"Abducteurs hanche": ["Side-lying isométrique","Standing belt test","Autre"],
"Adducteurs hanche": ["Squeeze test (5s)","Copenhagen","Autre"],

// Cheville
"Gastrocnémien": ["Heel Raise – genou tendu (1RM)","Heel Raise – max reps","Isométrie 90°","Autre"],
"Soléaire": ["Heel Raise – genou fléchi (1RM)","Max reps","Isométrie 90°","Autre"],
"Inverseurs/Éverseurs": ["Dynamométrie manuelle","Dynamométrie fixe","Autre"],
"Intrinsèques du pied": ["Toe Curl test","Short Foot test","Dynamométrie","Plateforme de pressions","Autre"]
};

// ===== Zones → création/suppression
zonesBox.querySelectorAll("input[type='checkbox']").forEach(cb=>{
cb.addEventListener("change", ()=>{
if (cb.checked) createZoneSection(cb.value);
else removeZoneSection(cb.value);
toggleGlobalBlocks();
});
});

function zoneSectionId(z){ return `section-${slug(z)}`; }

function createZoneSection(zoneName){
if (document.getElementById(zoneSectionId(zoneName))) return;

const sec = document.createElement("div");
sec.className = "subcard fade-in";
sec.id = zoneSectionId(zoneName);
sec.innerHTML = `
<h3>${zoneName}</h3>

<label>À quel moment testez-vous cette zone ?</label>
<div class="checkbox-group moment">
<label><input type="checkbox" value="Pré-saison"> Pré-saison</label>
<label><input type="checkbox" value="Retour au jeu"> Retour au jeu</label>
<label><input type="checkbox" value="Autre fréquence" class="autre-freq"> Autre fréquence</label>
</div>
<div class="slide freq-autre-wrap"></div>

<label>Quels types de tests sont réalisés ?</label>
<div class="checkbox-group types">
<label><input type="checkbox" value="Force"> Force</label>
<label><input type="checkbox" value="Mobilité"> Mobilité</label>
<label><input type="checkbox" value="Proprioception / Équilibre"> Proprioception / Équilibre</label>
<label><input type="checkbox" value="Questionnaires"> Questionnaires</label>
<label><input type="checkbox" value="Test de cognition" ${zoneName===headNeck?'':'data-hide'}> Test de cognition</label>
<label><input type="checkbox" value="Autres données"> Autres données</label>
</div>

<div class="subquestions"></div>
`;
// masque “Test de cognition” si zone ≠ tête/rachis
sec.querySelectorAll('[data-hide]').forEach(el=>el.parentElement.style.display="none");

zoneQuestions.appendChild(sec);

// “Autre fréquence”
const autreFreq = sec.querySelector(".autre-freq");
const freqWrap = sec.querySelector(".freq-autre-wrap");
autreFreq.addEventListener("change", ()=>{
addOtherField(freqWrap, autreFreq, "Fréquence (précisez)");
});

const types = sec.querySelectorAll(".types input[type='checkbox']");
const container = sec.querySelector(".subquestions");

types.forEach((t,i)=>{
t.addEventListener("change", ()=>{
const id = `sub-${slug(zoneName)}-${slug(t.value)}`;
const existing = container.querySelector("#"+id);
if (t.checked){
let block = null;
if (t.value==="Force") block = createForceBlock(zoneName, id, i);
if (t.value==="Mobilité") block = createMobilityBlock(zoneName, id, i);
if (t.value==="Proprioception / Équilibre") block = createProprioBlock(zoneName, id, i);
if (t.value==="Questionnaires") block = createQuestionnaireBlock(zoneName, id, i);
if (t.value==="Autres données") block = createOtherDataBlock(zoneName, id, i);
if (t.value==="Test de cognition" && zoneName===headNeck) block = createCognitionBlock(id, i);

if (block){
container.appendChild(block);
makeOtherReactive(block);
attachIsokineticHandlers(block);
sec.classList.add("active");
setTimeout(()=>block.classList.add("show"),20);
}
} else if (existing){
existing.classList.remove("show");
setTimeout(()=>existing.remove(),300);
if (!sec.querySelector(".types input:checked")) sec.classList.remove("active");
}
});
});

// Tests globaux MI/MS placés sous chaque zone (mais affichage unique via global area)
toggleGlobalBlocks();
}

function removeZoneSection(zoneName){
const el = document.getElementById(zoneSectionId(zoneName));
if (el) el.remove();
}

// ====== Sous-blocs
function createCognitionBlock(id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";
div.innerHTML = `
<h4>Test de cognition</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Test oculaire"> Test oculaire</label>
<label><input type="checkbox" value="Test vestibulaire"> Test vestibulaire</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(div, "Précisez le test");
return div;
}

function createOtherDataBlock(zoneName, id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";
div.innerHTML = `
<h4>Autres données – ${zoneName}</h4>
<div class="other-wrap slide show">
<input type="text" class="other-input" placeholder="Précisez la donnée collectée" required
style="width:100%;padding:8px;border:1px solid #d9dee7;border-radius:8px">
</div>
`;
return div;
}

function createQuestionnaireBlock(zoneName, id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";
const list = questionnairesByZone[zoneName] || ["Autre"];
div.innerHTML = `
<h4>Questionnaires – ${zoneName}</h4>
<div class="checkbox-group">
${list.map(q=>`<label><input type="checkbox" value="${q}"> ${q}</label>`).join("")}
</div>
`;
makeOtherReactive(div, "Nom du questionnaire");
return div;
}

function createProprioBlock(zoneName, id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";
const list = proprioByZone[zoneName] || ["Autre"];
div.innerHTML = `
<h4>Proprioception / Équilibre – ${zoneName}</h4>
<label>Quels tests utilisez-vous ?</label>
<div class="checkbox-group proprio-tests">
${list.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne du groupe"> Moyenne du groupe</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(div, "Précisez");
return div;
}

function createForceBlock(zoneName, id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";

// Mouvements
const moves = ["Flexion/Extension"];
if (!["Genou","Cheville / Pied","Coude","Poignet / Main"].includes(zoneName)) moves.push("Rotations");
if (["Épaule","Hanche"].includes(zoneName)) moves.push("Adduction/Abduction");
if (zoneName==="Cheville / Pied") { moves.push("Éversion/Inversion"); moves.push("Intrinsèques du pied"); }
if (zoneName==="Rachis lombaire") moves.push("Inclinaisons");
if (zoneName===headNeck) moves.push("Inclinaisons"); // cervical
if (zoneName==="Épaule") moves.push("ASH Test");

div.innerHTML = `
<h4>Force – ${zoneName}</h4>
<label>Quels mouvements évaluez-vous en force ?</label>
<div class="checkbox-group force-moves">
${moves.map(m=>`<label><input type="checkbox" value="${m}"> ${m}</label>`).join("")}
</div>
<div class="force-moves-details"></div>
`;

const details = div.querySelector(".force-moves-details");
div.querySelectorAll(".force-moves input").forEach((mb, i)=>{
mb.addEventListener("change", ()=>{
const mid = `${id}-move-${slug(mb.value)}`;
const existing = details.querySelector("#"+mid);
if (mb.checked && !existing){
const block = document.createElement("div");
block.id = mid;
block.className = "slide show";
block.style.transitionDelay = (i*0.05)+"s";

// cas spécifiques
if (zoneName==="Genou" && mb.value==="Flexion/Extension"){
block.innerHTML = `
<h5>${mb.value}</h5>
<label>Groupe musculaire</label>
<div class="checkbox-group knee-muscles">
<label><input type="checkbox" value="Ischiojambiers"> Ischiojambiers</label>
<label><input type="checkbox" value="Quadriceps"> Quadriceps</label>
</div>
<div class="knee-muscles-details"></div>
`;
const dWrap = block.querySelector(".knee-muscles-details");
block.querySelectorAll(".knee-muscles input").forEach((mcb,j)=>{
mcb.addEventListener("change", ()=>{
const gid = `${mid}-${slug(mcb.value)}`;
const ex = dWrap.querySelector("#"+gid);
if (mcb.checked && !ex){
dWrap.appendChild(createMuscleDetailBlock(zoneName, mcb.value, gid, i+j));
} else if (!mcb.checked && ex){
ex.classList.remove("show"); setTimeout(()=>ex.remove(),300);
}
});
});

} else if (zoneName==="Hanche" && (mb.value==="Adduction/Abduction" || mb.value==="Flexion/Extension")){
// Correction V20 : pas de “groupe musculaire” intermédiaire
const musclesForMove = (mb.value==="Adduction/Abduction")
? ["Adducteurs hanche","Abducteurs hanche"]
: ["Fléchisseurs hanche"]; // Extension gérée dans critères/params via outils communs
block.innerHTML = `<h5>${mb.value}</h5><div class="hip-direct-details"></div>`;
const dWrap = block.querySelector(".hip-direct-details");
musclesForMove.forEach((ml,k)=>{
dWrap.appendChild(createMuscleDetailBlock(zoneName, ml, `${mid}-${slug(ml)}`, i+k));
});

} else if (zoneName==="Cheville / Pied" && mb.value.includes("Flexion/Extension")){
block.innerHTML = `
<h5>${mb.value}</h5>
<label>Groupe musculaire</label>
<div class="checkbox-group ankle-muscles">
<label><input type="checkbox" value="Gastrocnémien"> Gastrocnémien</label>
<label><input type="checkbox" value="Soléaire"> Soléaire</label>
</div>
<div class="ankle-muscles-details"></div>
`;
const dWrap = block.querySelector(".ankle-muscles-details");
block.querySelectorAll(".ankle-muscles input").forEach((mcb,j)=>{
mcb.addEventListener("change", ()=>{
const gid = `${mid}-${slug(mcb.value)}`;
const ex = dWrap.querySelector("#"+gid);
if (mcb.checked && !ex){
dWrap.appendChild(createMuscleDetailBlock(zoneName, mcb.value, gid, i+j));
} else if (!mcb.checked && ex){
ex.classList.remove("show"); setTimeout(()=>ex.remove(),300);
}
});
});

} else if (zoneName==="Cheville / Pied" && mb.value.includes("Intrinsèques")){
const gid = `${mid}-intrinseques`;
block.innerHTML = `<h5>Intrinsèques du pied</h5><div class="foot-intr-details"></div>`;
block.querySelector(".foot-intr-details")
.appendChild(createMuscleDetailBlock(zoneName, "Intrinsèques du pied", gid, i));

} else if (zoneName==="Cheville / Pied" && mb.value.includes("Éversion/Inversion")){
const gid = `${mid}-inv-ev`;
block.innerHTML = `<h5>${mb.value}</h5><div class="inv-ev-details"></div>`;
block.querySelector(".inv-ev-details")
.appendChild(createMuscleDetailBlock(zoneName, "Inverseurs/Éverseurs", gid, i));

} else if (zoneName==="Épaule" && mb.value==="ASH Test"){
block.innerHTML = `
<h5>ASH Test</h5>
<label>Position(s)</label>
<div class="checkbox-group">
<label><input type="checkbox" value="I (180°)"> I (180°)</label>
<label><input type="checkbox" value="Y (135°)"> Y (135°)</label>
<label><input type="checkbox" value="T (90°)"> T (90°)</label>
<label><input type="checkbox" value="I (0°)"> I (0°)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${toolsForceGeneric.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group">
${paramsForceWithUnits.map(p=>`<label><input type="checkbox" value="${p}"> ${p}</label>`).join("")}
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
${criteriaForce.map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
</div>
`;
makeOtherReactive(block, "Précisez");
attachIsokineticHandlers(block);

} else {
// Mouvement “simple” : Outils → Paramètres → Critères
block.innerHTML = `
<h5>${mb.value}</h5>
<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${toolsForceGeneric.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group">
${paramsForceWithUnits.map(p=>`<label><input type="checkbox" value="${p}"> ${p}</label>`).join("")}
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
${criteriaForce.map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
</div>
`;
// Ajouts spécifiques lombaire
if (zoneName==="Rachis lombaire" && mb.value==="Flexion/Extension"){
const tools = block.querySelector(".tools-group");
// Eviter doublons “Autre”: déjà unique via array
const extra = document.createElement("div");
extra.className = "checkbox-group";
extra.innerHTML = `
<label><input type="checkbox" value="Test de Shirado"> Test de Shirado</label>
<label><input type="checkbox" value="Test de Sorensen"> Test de Sorensen</label>
`;
tools.insertAdjacentElement("afterend", extra);
}
makeOtherReactive(block, "Précisez");
attachIsokineticHandlers(block);
}

details.appendChild(block);
} else if (existing){
existing.classList.remove("show");
setTimeout(()=>existing.remove(),300);
}
});
});

return div;
}

function createMuscleDetailBlock(zoneName, muscleLabel, gid, delay){
const wrap = document.createElement("div");
wrap.id = gid;
wrap.className = "slide show";
wrap.style.transitionDelay = (delay*0.05)+"s";

// Liste des tests sans redoubler l’isocinétisme ici
const testList = testsByMuscle[muscleLabel] || ["Autre"];

wrap.innerHTML = `
<h5 style="margin-top:8px">${muscleLabel}</h5>

<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${toolsForceGeneric.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>

<label>Tests spécifiques</label>
<div class="checkbox-group muscle-tests">
${testList.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>

<label>Paramètres étudiés</label>
<div class="checkbox-group">
${paramsForceWithUnits.map(p=>`<label><input type="checkbox" value="${p}"> ${p}</label>`).join("")}
</div>

<label>Critères d’évaluation</label>
<div class="checkbox-group">
${criteriaForce.map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
</div>
`;
makeOtherReactive(wrap,"Précisez");
attachIsokineticHandlers(wrap);
return wrap;
}

function createMobilityBlock(zoneName, id, delay){
const div = document.createElement("div");
div.id = id;
div.className = "slide";
div.style.transitionDelay = (delay*0.05)+"s";

const moves = ["Flexion/Extension"];
if (!["Genou","Cheville / Pied","Coude","Poignet / Main"].includes(zoneName)) moves.push("Rotations");
if (["Épaule","Hanche"].includes(zoneName)) moves.push("Adduction/Abduction");
if (zoneName==="Cheville / Pied") moves.push("Éversion/Inversion");
if (zoneName==="Rachis lombaire" || zoneName===headNeck) moves.push("Inclinaisons");
if (zoneName==="Poignet / Main") moves.push("Inclinaisons"); // explicit demandé

div.innerHTML = `
<h4>Mobilité – ${zoneName}</h4>
<label>Quels mouvements évaluez-vous en mobilité ?</label>
<div class="checkbox-group mob-moves">
${moves.map(m=>`<label><input type="checkbox" value="${m}"> ${m}</label>`).join("")}
</div>
<div class="mob-moves-details"></div>
`;

const details = div.querySelector(".mob-moves-details");
div.querySelectorAll(".mob-moves input").forEach((mb, i)=>{
mb.addEventListener("change", ()=>{
const mid = `${id}-move-${slug(mb.value)}`;
const existing = details.querySelector("#"+mid);
if (mb.checked && !existing){
const block = document.createElement("div");
block.id = mid;
block.className = "slide show";
block.style.transitionDelay = (i*0.05)+"s";

// Outils
let tools = [...toolsMobilityGeneric];
if ((zoneName==="Genou" && mb.value==="Flexion/Extension") || zoneName==="Rachis lombaire"){
tools = [...tools, "Sit-and-reach"];
}
if (zoneName==="Cheville / Pied" && mb.value.toLowerCase().includes("flexion")){
tools = [...tools, "Knee-to-wall (KTW)"];
}
// Exigence : enlever “Test spécifique” → on ne l’a pas inclus.

const crits = (zoneName==="Rachis lombaire")
? criteriaMobilityLumbar
: criteriaMobilityGeneric;

block.innerHTML = `
<h5 style="margin-top:10px">${mb.value}</h5>
<label>Outils utilisés</label>
<div class="checkbox-group">
${tools.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Critères d’évaluation</label>
<div class="checkbox-group">
${crits.map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
details.appendChild(block);
makeOtherReactive(block,"Précisez");
} else if (existing){
existing.classList.remove("show");
setTimeout(()=>existing.remove(),300);
}
});
});

return div;
}

// ===== Blocs globaux : Fonctionnels MI/MS, Sauts, Course, Combat
function toggleGlobalBlocks(){
const selected = [...zonesBox.querySelectorAll("input:checked")].map(i=>i.value);
const hasLower = selected.some(v=>lowerBody.includes(v));
const hasUpper = selected.some(v=>upperBody.includes(v));
const hasHead = selected.includes(headNeck);

// Fonctionnels MI (unique) + Q Oui/Non
if (hasLower){
if (!globalFunctionalMI.dataset.ready){
globalFunctionalMI.dataset.ready="1";
globalFunctionalMI.className="subcard active fade-in";
globalFunctionalMI.innerHTML = `
<h3>Tests fonctionnels globaux – Membre inférieur</h3>
<div class="checkbox-group">
<label><input type="radio" name="mi-func-yn" value="Oui"> Oui</label>
<label><input type="radio" name="mi-func-yn" value="Non"> Non</label>
</div>
<div id="mi-func-wrap" class="slide"></div>
`;
const yn = globalFunctionalMI.querySelectorAll("input[name='mi-func-yn']");
const wrap = document.getElementById("mi-func-wrap");
yn.forEach(r=>r.addEventListener("change", ()=>{
if (r.value==="Oui"){
wrap.innerHTML = `
<label>Quels tests ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Squat"> Squat</label>
<label><input type="checkbox" value="Montée de banc"> Montée de banc</label>
<label><input type="checkbox" value="Soulevé de terre"> Soulevé de terre</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Outils</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
<label><input type="checkbox" value="Encodeur linéaire"> Encodeur linéaire</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Répétition maximale (RM)"> Répétition maximale (RM)</label>
<label><input type="checkbox" value="Isométrie"> Isométrie</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne par poste"> Moyenne par poste</label>
<label><input type="checkbox" value="Ratio poids du corps"> Ratio poids du corps</label>
<label><input type="checkbox" value="Ratio droite/gauche"> Ratio droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(wrap,"Précisez");
wrap.classList.add("show");
} else {
wrap.classList.remove("show");
setTimeout(()=>wrap.innerHTML="",300);
}
}));
}
} else {
globalFunctionalMI.removeAttribute("data-ready");
globalFunctionalMI.innerHTML="";
globalFunctionalMI.className="";
}

// Fonctionnels MS
if (hasUpper){
if (!globalFunctionalMS.dataset.ready){
globalFunctionalMS.dataset.ready="1";
globalFunctionalMS.className="subcard active fade-in";
globalFunctionalMS.innerHTML = `
<h3>Tests fonctionnels globaux – Membre supérieur</h3>
<div class="checkbox-group">
<label><input type="radio" name="ms-func-yn" value="Oui"> Oui</label>
<label><input type="radio" name="ms-func-yn" value="Non"> Non</label>
</div>
<div id="ms-func-wrap" class="slide"></div>
`;
const yn = globalFunctionalMS.querySelectorAll("input[name='ms-func-yn']");
const wrap = document.getElementById("ms-func-wrap");
yn.forEach(r=>r.addEventListener("change", ()=>{
if (r.value==="Oui"){
wrap.innerHTML = `
<label>Quels tests ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Traction"> Traction</label>
<label><input type="checkbox" value="Développé couché"> Développé couché</label>
<label><input type="checkbox" value="Tirage"> Tirage</label>
<label><input type="checkbox" value="Force grip (handgrip)"> Force grip (handgrip)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Outils</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
<label><input type="checkbox" value="Encodeur linéaire"> Encodeur linéaire</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Répétition maximale (RM)"> Répétition maximale (RM)</label>
<label><input type="checkbox" value="Isométrie"> Isométrie</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne par poste"> Moyenne par poste</label>
<label><input type="checkbox" value="Ratio poids du corps"> Ratio poids du corps</label>
<label><input type="checkbox" value="Ratio droite/gauche"> Ratio droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(wrap,"Précisez");
wrap.classList.add("show");
} else {
wrap.classList.remove("show");
setTimeout(()=>wrap.innerHTML="",300);
}
}));
}
} else {
globalFunctionalMS.removeAttribute("data-ready");
globalFunctionalMS.innerHTML="";
globalFunctionalMS.className="";
}

// Sauts (MI) – Oui/Non avant d’afficher la section
if (hasLower){
if (!globalJumps.dataset.ready){
globalJumps.dataset.ready="1";
globalJumps.className="subcard active fade-in";
globalJumps.innerHTML = `
<h3>Tests de sauts</h3>
<div class="checkbox-group">
<label><input type="radio" name="jumps-yn" value="Oui"> Oui</label>
<label><input type="radio" name="jumps-yn" value="Non"> Non</label>
</div>
<div id="jumps-wrap" class="slide"></div>
`;
const yn = globalJumps.querySelectorAll("input[name='jumps-yn']");
const wrap = document.getElementById("jumps-wrap");
yn.forEach(r=>r.addEventListener("change", ()=>{
if (r.value==="Oui"){
wrap.innerHTML = `
<label>Quels tests de sauts utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="CMJ (Countermovement jump)"> CMJ (Countermovement jump)</label>
<label><input type="checkbox" value="Squat Jump"> Squat Jump</label>
<label><input type="checkbox" value="Drop Jump"> Drop Jump</label>
<label><input type="checkbox" value="Broad Jump"> Broad Jump</label>
<label><input type="checkbox" value="Single Hop"> Single Hop</label>
<label><input type="checkbox" value="Triple Hop"> Triple Hop</label>
<label><input type="checkbox" value="Side Hop"> Side Hop</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Paramètres étudiés</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Force max (N)"> Force max (N)</label>
<label><input type="checkbox" value="Hauteur (cm)"> Hauteur (cm)</label>
<label><input type="checkbox" value="Temps de vol (ms)"> Temps de vol (ms)</label>
<label><input type="checkbox" value="Temps de contact (ms)"> Temps de contact (ms)</label>
<label><input type="checkbox" value="Pic de puissance (W)"> Pic de puissance (W)</label>
<label><input type="checkbox" value="Puissance relative (W/kg)"> Puissance relative (W/kg)</label>
<label><input type="checkbox" value="RFD (N/s)"> RFD (N/s)</label>
<label><input type="checkbox" value="RSI (—)"> RSI (—)</label>
<label><input type="checkbox" value="Distance (m)"> Distance (m)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Outils</label>
<div class="checkbox-group jump-tools">
<label><input type="checkbox" value="Plateforme de force"> Plateforme de force</label>
<label><input type="checkbox" value="Centimétrie"> Centimétrie</label>
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Comparaison droite/gauche"> Comparaison droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(wrap,"Précisez");
wrap.classList.add("show");
} else {
wrap.classList.remove("show");
setTimeout(()=>wrap.innerHTML="",300);
}
}));
}
} else {
globalJumps.removeAttribute("data-ready");
globalJumps.innerHTML="";
globalJumps.className="";
}

// Course (MI ou Tête/Rachis) – Oui/Non + catégories
if (hasLower || hasHead){
if (!globalCourse.dataset.ready){
globalCourse.dataset.ready="1";
globalCourse.className="subcard active fade-in";
globalCourse.innerHTML = `
<h3>Tests de course</h3>
<div class="checkbox-group">
<label><input type="radio" name="course-yn" value="Oui"> Oui</label>
<label><input type="radio" name="course-yn" value="Non"> Non</label>
</div>
<div id="course-wrap" class="slide"></div>
`;
const yn = globalCourse.querySelectorAll("input[name='course-yn']");
const wrap = document.getElementById("course-wrap");
yn.forEach(r=>r.addEventListener("change", ()=>{
if (r.value==="Oui"){
wrap.innerHTML = `
<h4>Énergétique</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Yoyo IR test 1"> Yoyo IR test 1</label>
<label><input type="checkbox" value="Bronco"> Bronco</label>
<label><input type="checkbox" value="Broken Bronco"> Broken Bronco</label>
<label><input type="checkbox" value="Luc Léger"> Luc Léger</label>
<label><input type="checkbox" value="VAMEVAL"> VAMEVAL</label>
<label><input type="checkbox" value="RSA (Repeated Sprint Ability)"> RSA (Repeated Sprint Ability)</label>
<label><input type="checkbox" value="Autre (énergétique)"> Autre</label>
</div>

<h4>Changement de direction (COD)</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="505"> 505</label>
<label><input type="checkbox" value="T-Test"> T-Test</label>
<label><input type="checkbox" value="Illinois"> Illinois</label>
<label><input type="checkbox" value="ZigZag"> ZigZag</label>
<label><input type="checkbox" value="Autre (COD)"> Autre</label>
</div>

<h4>Vitesse</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Sprint 10m"> Sprint 10m</label>
<label><input type="checkbox" value="Sprint 20m"> Sprint 20m</label>
<label><input type="checkbox" value="Sprint 30m"> Sprint 30m</label>
<label><input type="checkbox" value="Vmax"> Vmax</label>
<label><input type="checkbox" value="Autre (vitesse)"> Autre</label>
</div>

<label>Outils</label>
<div class="checkbox-group course-tools">
<label><input type="checkbox" value="Chronomètre"> Chronomètre</label>
<label><input type="checkbox" value="Cellules"> Cellules</label>
<label><input type="checkbox" value="GPS"> GPS</label>
<label><input type="checkbox" value="1080 Sprint"> 1080 Sprint</label>
<label><input type="checkbox" value="Autres"> Autres</label>
</div>

<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne par poste"> Moyenne par poste</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
`;
makeOtherReactive(wrap,"Précisez");
wrap.classList.add("show");
} else {
wrap.classList.remove("show");
setTimeout(()=>wrap.innerHTML="",300);
}
}));
}
} else {
globalCourse.removeAttribute("data-ready");
globalCourse.innerHTML="";
globalCourse.className="";
}

// Tests de combat – affichés s’il existe au moins une section avec "Retour au jeu" cochée
const anyReturnToPlay = Array.from(document.querySelectorAll(".moment input[value='Retour au jeu']:checked")).length>0;
if (anyReturnToPlay && (hasLower || hasUpper || hasHead)){
if (!globalCombat.dataset.ready){
globalCombat.dataset.ready="1";
globalCombat.className="subcard active fade-in";
globalCombat.innerHTML = `
<h3>Tests spécifiques de combat</h3>
<div class="checkbox-group">
<label><input type="radio" name="combat-yn" value="Oui"> Oui</label>
<label><input type="radio" name="combat-yn" value="Non"> Non</label>
</div>
`;
}
} else {
globalCombat.removeAttribute("data-ready");
globalCombat.innerHTML="";
globalCombat.className="";
}
}

// Observer “Retour au jeu” pour le bloc Combat
const observer = new MutationObserver(()=>toggleGlobalBlocks());
observer.observe(zoneQuestions, {subtree:true, childList:true});
zoneQuestions.addEventListener("change", (e)=>{
if (e.target && e.target.closest(".moment")) toggleGlobalBlocks();
});

// ===== Validation & envoi Google Form
function validateForm(){
// 1) Nom/Prénom
if (!document.getElementById("nom").value.trim() || !document.getElementById("prenom").value.trim()){
return "Merci de renseigner Nom et Prénom.";
}
// 2) Rôle + “Autre” précisé si coché
const roleChecked = form.querySelector("input[name='role']:checked");
if (!roleChecked) return "Merci d’indiquer votre rôle.";
if (roleChecked.value==="Autre"){
const t = roleAutreWrap.querySelector(".other-input");
if (!t || !t.value.trim()) return "Merci de préciser votre rôle.";
}
// 3) Structure + “Autre” précisé
const structChecked = form.querySelector("input[name='structure']:checked");
if (!structChecked) return "Merci d’indiquer l’équipe auprès de laquelle vous intervenez.";
if (structChecked.value==="Autre"){
const t = structAutreWrap.querySelector(".other-input");
if (!t || !t.value.trim()) return "Merci de préciser l’équipe.";
}
// 4) Au moins une zone
const zones = [...zonesBox.querySelectorAll("input:checked")].map(i=>i.value);
if (zones.length===0) return "Sélectionnez au moins une zone anatomique.";

// 5) “Autre” partout → champ renseigné
const allScope = document.querySelector("main");
if (hasUncheckedOther(allScope)) return "Merci de préciser tous les champs 'Autre' cochés.";

return null;
}

async function submitToGoogle(){
// On sérialise en JSON (clé unique Google : entry.1237244370)
const payload = collectAllAnswers();
const body = new URLSearchParams();
body.append(ENTRY, JSON.stringify(payload));

const res = await fetch(ENDPOINT, { method:"POST", body });
if (!res.ok) throw new Error("Échec d’envoi Google Form");
}

function collectAllAnswers(){
// Construire un objet lisible avec toutes les réponses
const out = {};
// Infos participant
out.nom = document.getElementById("nom").value.trim();
out.prenom = document.getElementById("prenom").value.trim();

const role = form.querySelector("input[name='role']:checked")?.value || "";
out.role = role;
if (role==="Autre") out.role_autre = roleAutreWrap.querySelector(".other-input")?.value.trim() || "";

const struct = form.querySelector("input[name='structure']:checked")?.value || "";
out.equipe = struct;
if (struct==="Autre") out.equipe_autre = structAutreWrap.querySelector(".other-input")?.value.trim() || "";

// Zones + détails (on stocke le HTML textuel des sélections pour simplifier)
out.zones = [...zonesBox.querySelectorAll("input:checked")].map(i=>i.value);

// Sauts/Course/Func/Combat
const jyn = document.querySelector("input[name='jumps-yn']:checked")?.value || "";
if (jyn==="Oui"){
out.sauts = dumpBlock(document.getElementById("jumps-wrap"));
}

const cyn = document.querySelector("input[name='course-yn']:checked")?.value || "";
if (cyn==="Oui"){
out.course = dumpBlock(document.getElementById("course-wrap"));
}

const miyn = document.querySelector("input[name='mi-func-yn']:checked")?.value || "";
if (miyn==="Oui"){
out.fonctionnels_mi = dumpBlock(document.getElementById("mi-func-wrap"));
}

const msyn = document.querySelector("input[name='ms-func-yn']:checked")?.value || "";
if (msyn==="Oui"){
out.fonctionnels_ms = dumpBlock(document.getElementById("ms-func-wrap"));
}

const combyn = document.querySelector("input[name='combat-yn']:checked")?.value || "";
if (combyn) out.tests_combat = combyn;

// Par zone : on concat les libellés cochés + champs “autre”
out.zones_details = {};
document.querySelectorAll("[id^='section-']").forEach(sec=>{
const zname = sec.querySelector("h3")?.textContent.trim() || "Zone";
out.zones_details[zname] = dumpBlock(sec);
});

// Communes
out.barrieres = dumpGroupWithOthers(document.getElementById("q-barrieres"), commBarAutreWrap);
out.raisons = dumpGroupWithOthers(document.getElementById("q-raisons"), commRaisAutreWrap);

return out;
}

function dumpBlock(scope){
if (!scope) return null;
const sel = [];
scope.querySelectorAll("input:checked").forEach(i=>{
sel.push(i.value);
const grp = i.closest(".checkbox-group");
const ot = grp && grp.querySelector(".other-input");
if (ot && ot.value.trim()) sel.push(`Autre: ${ot.value.trim()}`);
});
// autre fréquence
scope.querySelectorAll(".freq-autre-wrap .other-input").forEach(t=>{
if (t.value.trim()) sel.push(`Autre fréquence: ${t.value.trim()}`);
});
return sel;
}
function dumpGroupWithOthers(groupEl, otherWrap){
const vals = [...groupEl.querySelectorAll("input:checked")].map(i=>i.value);
const ot = otherWrap?.querySelector(".other-input");
if (vals.includes("Autre") && ot && ot.value.trim()){
vals.push(`Autre: ${ot.value.trim()}`);
}
return vals;
}

// Validation + envoi
btnSubmit.addEventListener("click", async (e)=>{
e.preventDefault();
msg.textContent="";

// Validation simple
const err = validateForm();
if (err){
msg.style.color = "#d7263d";
msg.textContent = "⚠️ " + err;
window.scrollTo({top:0,behavior:"smooth"});
return;
}

// Vérification champs “Autre” partout
if (hasUncheckedOther(document.querySelector("main"))){
msg.style.color = "#d7263d";
msg.textContent = "⚠️ Merci de préciser tous les champs 'Autre' cochés.";
window.scrollTo({top:0,behavior:"smooth"});
return;
}

// Envoi
try{
await submitToGoogle();
// Reset + message
form.reset();
// vider blocs dynamiques
zoneQuestions.innerHTML="";
globalFunctionalMI.innerHTML=""; globalFunctionalMI.removeAttribute("data-ready"); globalFunctionalMI.className="";
globalFunctionalMS.innerHTML=""; globalFunctionalMS.removeAttribute("data-ready"); globalFunctionalMS.className="";
globalJumps.innerHTML=""; globalJumps.removeAttribute("data-ready"); globalJumps.className="";
globalCourse.innerHTML=""; globalCourse.removeAttribute("data-ready"); globalCourse.className="";
globalCombat.innerHTML=""; globalCombat.removeAttribute("data-ready"); globalCombat.className="";
// clear autres wraps
roleAutreWrap.innerHTML=""; structAutreWrap.innerHTML="";
commBarAutreWrap.innerHTML=""; commRaisAutreWrap.innerHTML="";

msg.style.color = "#0074d9";
msg.textContent = "✅ Merci ! Vos réponses ont été enregistrées.";
updateProgress();
window.scrollTo({top:0,behavior:"smooth"});
} catch(ex){
msg.style.color = "#d7263d";
msg.textContent = "❌ Échec d’envoi. Vérifiez votre connexion puis réessayez.";
}
});

// init progression
updateProgress();
});
