/* =========================================================
QUESTIONNAIRE – Version intégrale (tout périmètre)
Aligné avec la logique fournie par l'utilisateur.
- Index et CSS : conformes à ceux fournis
- Ce script remplace intégralement votre script.js
- Focus sur robustesse, suppression des doublons "Outils utilisés" dans les sous-blocs,
isocinétisme propre (vitesses + modes), champs "Autre" uniques, blocs transversaux.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
// --- Helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const slug = s => (s||"").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-');
const esc = s => s.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g,'\\$1');
const byId = id => document.getElementById(id);
const requiredIfVisible = el => el && el.offsetParent !== null;

/* ---------------------------------------------
* PROGRESSION
* ------------------------------------------- */
const progressBar = byId("progress-bar");
const progressContainer = byId("progress-container");
const form = byId("questionnaireForm");
const formCards = $$(".card");

const updateProgress = () => {
  const filled = formCards.filter(sec =>
    sec.querySelector("input:checked") ||
    sec.querySelector("input[type='text'][value]")
  ).length;

  const total = formCards.length;
  const pct = Math.min(100, Math.round((filled / total) * 100));

  // Mise à jour de la largeur de la barre
  progressBar.style.width = pct + "%";

  // Affichage du pourcentage au centre de la barre
  progressContainer.setAttribute("data-progress", pct);
};

// Déclenchement à chaque changement
document.addEventListener("change", updateProgress);

/* ---------------------------------------------
* Rôle / Équipe : champs "Autre"
* ------------------------------------------- */
const toggleOther = (name, inputId) => {
$(`input[name='${name}'][value='Autre']`)?.addEventListener("change", e => {
byId(inputId).style.display = e.target.checked ? "block" : "none";
});
$$(`input[name='${name}']`).forEach(r => r.addEventListener("change", e => {
if (e.target.value !== "Autre") byId(inputId).style.display = "none";
}));
};
toggleOther("role", "role-autre");
toggleOther("equipe", "equipe-autre");

/* ---------------------------------------------
* Constantes & libellés (conformes au déroulé)
* ------------------------------------------- */
const headNeck = ["Tête","Rachis cervical"];
const headNeckTitle = "Tête / Rachis cervical";
const lowerBody = ["Hanche","Genou","Cheville / Pied"];

// Outils – Force (générique)
const toolsForce = ["Dynamomètre manuel","Dynamomètre fixe","Isocinétisme","Plateforme de force","Sans outil","Autre"];

// Outils – Mobilité
const toolsMobBase = ["Goniomètre","Inclinomètre","Autre"];

// Paramètres + critères – Force
const paramsForce = ["Force max (N)","Force moyenne (N)","Force relative (N/kg)","Puissance (W/kg)","RFD (Rate of Force Development)","Angle du pic de force (°)","Endurance (s)"];
const criteriaGeneric = ["Ratio agoniste/antagoniste","Comparaison droite/gauche","Valeur de référence individuelle","Autre"];

// Proprio / questionnaires
const proprioByZone = {
"Cheville / Pied":["Y-Balance Test","Star Excursion","Single Leg Balance Test","Autre"],
"Genou":["Y-Balance Test","Star Excursion","FMS (Lower)","Autre"],
"Hanche":["Y-Balance Test","Star Excursion","FMS (Lower)","Autre"],
"Épaule":["Y-Balance Test (épaule)","FMS (Upper)","Autre"],
[headNeckTitle]:["Test proprio cervical (laser)","Autre"],
"Rachis lombaire":["FMS (Core)","Autre"],
"Poignet / Main":[],
"Coude":[]
};
const questionnairesByZone = {
"Genou":["KOOS","IKDC","Lysholm","Tegner","ACL-RSI","KOS-ADLS","LEFS","Autre"],
"Hanche":["HAGOS","iHOT-12","HOOS","HOS","Autre"],
"Épaule":["QuickDASH","DASH","SIRSI","ASES","SPADI","Oxford Shoulder Score","Autre"],
"Coude":["Oxford Elbow Score","MEPS","DASH","QuickDASH","Autre"],
"Poignet / Main":["PRWE","DASH","QuickDASH","Boston Carpal Tunnel","Autre"],
"Cheville / Pied":["CAIT","FAAM-ADL","FAAM-Sport","FAOS","FFI","Autre"],
"Rachis lombaire":["ODI (Oswestry)","Roland-Morris","Quebec Back Pain","FABQ","Autre"],
[headNeckTitle]:["SCAT6","Neck Disability Index (NDI)","Copenhagen Neck Functional Scale","Autre"]
};

// Tests musculaires + spécifiques
const testsByMuscle = {
"Ischiojambiers":["McCall 90°","Isométrie 30°","Nordic","Nordic Hold","Razor Curl","Single Leg Bridge","Autre"],
"Quadriceps":["Isométrie 60°","Leg Extension","Single Leg Squat","Autre"],
"Gastrocnémien":["Heel Raise – genou tendu (1RM)","Heel Raise – max reps","Isométrie 90°","Autre"],
"Soléaire":["Isométrie 90°","Autre"],
"Inverseurs/Éverseurs":["Dynamométrie manuelle","Dynamométrie fixe","Autre"],
"Intrinsèques du pied":["Toe Curl test","Short Foot test","Dynamométrie","Plateforme de pressions","Autre"]
};

// Isocinétisme
const isokineticSpeeds = ["30°/s","60°/s","120°/s","180°/s","Autre"];
const isokineticModes = ["Concentrique","Excentrique"];

/* ---------------------------------------------
* Zones & conteneurs
* ------------------------------------------- */
const zoneContainer = byId("zoneQuestions");
const zonesCbs = $$("#zones input[type='checkbox']");

/* ---------------------------------------------
* Utilitaires d’UI
* ------------------------------------------- */
const ensureOtherText = (groupEl) => {
// Limiter à un seul "Autre"
const others = groupEl ? [...groupEl.querySelectorAll("input[type='checkbox'][value='Autre']")] : [];
if (others.length > 1) {
for (let i=1;i<others.length;i++) {
const lab = others[i].closest("label");
if (lab) lab.remove();
}
}
const other = groupEl?.querySelector("input[type='checkbox'][value='Autre']");
if (!other) return;
const ensure = () => {
let wrap = groupEl.querySelector(".other-wrap");
if (other.checked) {
if (!wrap) {
wrap = document.createElement("div");
wrap.className = "other-wrap";
wrap.innerHTML = `<input type="text" class="other-input small" placeholder="Précisez" required>`;
groupEl.appendChild(wrap);
}
} else if (wrap) {
wrap.remove();
}
};
other.addEventListener("change", ensure);
ensure();
};

// ---- Isocinétisme: sous-questions standardisées
const attachIsokineticHandlers = (scope) => {
const groups = scope.querySelectorAll(".tools-group");
groups.forEach(g => {
const iso = g.querySelector("input[type='checkbox'][value='Isocinétisme']");
if (!iso) return;
const ensure = () => {
let sub = g.parentElement.querySelector(".isokinetic-sub");
if (iso.checked) {
if (!sub) {
sub = document.createElement("div");
sub.className = "slide show isokinetic-sub";
sub.innerHTML = `
<label>Vitesse (isocinétisme)</label>
<div class="checkbox-group iso-speed">${isokineticSpeeds.map(v=>`<label><input type="checkbox" value="${v}"> ${v}</label>`).join("")}</div>
<label>Mode de contraction (isocinétisme)</label>
<div class="checkbox-group iso-mode">${isokineticModes.map(m=>`<label><input type="checkbox" value="${m}"> ${m}</label>`).join("")}</div>`;
g.insertAdjacentElement("afterend", sub);
ensureOtherText(sub.querySelector(".iso-speed"));
}
} else if (sub) {
sub.remove();
}
};
iso.addEventListener("change", ensure);
ensure();
});
};

/* ---------------------------------------------
* Crée un bloc OPC (Outils/Paramètres/Critères)
* ------------------------------------------- */
const createOPC = (extraToolsHtml="", {excludeIsokinetic=false, criteriaOverride=null}={}) => {
const div = document.createElement("div");
// Outils
const toolsList = excludeIsokinetic ? toolsForce.filter(t=>t!=="Isocinétisme") : toolsForce.slice();
div.innerHTML = `
<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${toolsList.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
${extraToolsHtml}
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group params-group">${paramsForce.map(p=>`<label><input type="checkbox" value="${p}"> ${p}</label>`).join("")}</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group crit-group">
${(criteriaOverride||criteriaGeneric).map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
</div>
`;
ensureOtherText(div.querySelector(".tools-group"));
if (!excludeIsokinetic) attachIsokineticHandlers(div);
ensureOtherText(div.querySelector(".crit-group"));
return div;
};

/* ---------------------------------------------
* SECTION PAR ZONE
* ------------------------------------------- */
const createZoneSection = (zoneName) => {
if (byId(`section-${slug(zoneName)}`)) return;
const sec = document.createElement("div");
sec.className = "subcard fade-in";
sec.id = `section-${slug(zoneName)}`;

// --- Types dynamiques (selon dispo)
const hasProprio = (proprioByZone[zoneName]||[]).length>0;
const hasQuestionnaires = (questionnairesByZone[zoneName]||[]).length>0;

sec.innerHTML = `
<h3>${zoneName}</h3>
<label>À quel moment testez-vous cette zone ?</label>
<div class="checkbox-group moment">
<label><input type="checkbox" value="Pré-saison"> Pré-saison</label>
<label><input type="checkbox" value="Retour au jeu"> Retour au jeu</label>
<label><input type="checkbox" value="Autre fréquence"> Autre fréquence</label>
</div>

<label>Quels types de tests sont réalisés ?</label>
<div class="checkbox-group types">
${zoneName===headNeckTitle?`<label><input type="checkbox" value="Force"> Force</label>
<label><input type="checkbox" value="Mobilité"> Mobilité</label>
<label><input type="checkbox" value="Test de cognition"> Test de cognition</label>`
:`<label><input type="checkbox" value="Force"> Force</label>
<label><input type="checkbox" value="Mobilité"> Mobilité</label>`}
${hasProprio?`<label><input type="checkbox" value="Proprioception / Équilibre"> Proprioception / Équilibre</label>`:""}
${hasQuestionnaires?`<label><input type="checkbox" value="Questionnaires"> Questionnaires</label>`:""}
<label><input type="checkbox" value="Autres données"> Autres données</label>
</div>
<div class="subquestions"></div>
`;
zoneContainer.appendChild(sec);

// "Autre fréquence" -> préciser
const freqGroup = sec.querySelector(".moment");
const autreFreq = freqGroup.querySelector("input[value='Autre fréquence']");
const ensureFreq = () => {
let wrap = freqGroup.querySelector(".other-wrap");
if (autreFreq.checked) {
if (!wrap) {
wrap = document.createElement("div");
wrap.className = "other-wrap";
wrap.innerHTML = `<input type="text" class="other-input small" placeholder="Fréquence (précisez)" required>`;
freqGroup.appendChild(wrap);
}
} else if (wrap) wrap.remove();
toggleCombatBlock();
toggleGlobalsBlock();
};
autreFreq.addEventListener("change", ensureFreq);
// déclenche COMBAT si moment change
sec.querySelectorAll(".moment input").forEach(inp => {
inp.addEventListener("change", () => {
toggleCombatBlock();
});
});

const typesCbs = sec.querySelectorAll(".types input[type='checkbox']");
const subQ = sec.querySelector(".subquestions");

typesCbs.forEach((cb) => {
cb.addEventListener("change", () => {
const id = `sub-${slug(zoneName)}-${slug(cb.value)}`;
const exists = subQ.querySelector("#"+esc(id));
if (cb.checked) {
let block = null;

if (cb.value==="Force") block = createForceBlock(zoneName, id);
if (cb.value==="Mobilité") block = createMobilityBlock(zoneName, id);
if (cb.value==="Proprioception / Équilibre") block = createProprioBlock(zoneName, id);
if (cb.value==="Questionnaires") block = createQuestionnaireBlock(zoneName, id);
if (cb.value==="Test de cognition") block = createCognitionBlock(zoneName, id);
if (cb.value==="Autres données") block = createOtherDataBlock(zoneName, id);

if (block){
block.classList.add("slide","show");
subQ.appendChild(block);
}
} else if (exists) {
exists.classList.remove("show");
setTimeout(()=>exists.remove(),300);
}
});
});
};

const removeZoneSection = (zoneName) => {
const el = byId(`section-${slug(zoneName)}`);
if (el) el.remove();
toggleGlobalsBlock();
};

/* ---------------------------------------------
* FORCE – par zone / mouvement
* ------------------------------------------- */
const createForceBlock = (zoneName, id) => {
const div = document.createElement("div");
div.id = id;

// Mouvements disponibles par zone
const moves = [];
if (zoneName==="Genou") {
moves.push("Flexion/Extension");
} else if (zoneName==="Cheville / Pied") {
moves.push("Flexion/Extension","Éversion/Inversion","Intrinsèques du pied");
} else if (zoneName==="Épaule") {
moves.push("Flexion/Extension","Rotations","Adduction/Abduction","ASH Test");
} else if (zoneName==="Poignet / Main") {
moves.push("Flexion/Extension","Inclinaison");
} else if (zoneName==="Hanche") {
moves.push("Flexion/Extension","Rotations","Adduction/Abduction");
} else if (zoneName==="Coude") {
moves.push("Flexion/Extension");
} else if (zoneName==="Rachis lombaire" || zoneName===headNeckTitle) {
moves.push("Flexion/Extension","Rotations","Inclinaisons");
} else {
moves.push("Flexion/Extension");
}

div.innerHTML = `
<h4>Force – ${zoneName}</h4>
<label>Quels mouvements évaluez-vous en force ?</label>
<div class="checkbox-group force-moves">
${moves.map(m=>`<label><input type="checkbox" value="${m}"> ${m}</label>`).join("")}
</div>
<div class="force-details"></div>
`;

const details = div.querySelector(".force-details");
div.querySelectorAll(".force-moves input").forEach(mb => {
mb.addEventListener("change", () => {
const mid = `${id}-move-${slug(mb.value)}`;
const exist = details.querySelector("#"+esc(mid));
if (mb.checked) {
const block = document.createElement("div");
block.id = mid;
block.className = "slide show";

// GENOU: Flex/Ext -> Ischio/Quads
if (zoneName==="Genou" && mb.value==="Flexion/Extension") {
block.innerHTML = `<h5>${mb.value}</h5>
<div class="knee-muscles"></div>`;
const kWrap = block.querySelector(".knee-muscles");
["Ischiojambiers","Quadriceps"].forEach(musc => {
const g = document.createElement("div");
g.className = "subcard";
g.innerHTML = `<h6>${musc}</h6>`;
// Outils
const tools = document.createElement("div");
tools.innerHTML = `<label>Outils utilisés</label>
<div class="checkbox-group tools-group">${toolsForce.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(tools);
ensureOtherText(tools.querySelector(".tools-group"));
attachIsokineticHandlers(g);
// Tests spécifiques
const tests = testsByMuscle[musc]||["Autre"];
const testsEl = document.createElement("div");
testsEl.innerHTML = `<label>Tests spécifiques</label>
<div class="checkbox-group tests-group">${tests.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(testsEl);
ensureOtherText(testsEl.querySelector(".tests-group"));
// Param + Crit (sans re-outils)
const opc = createOPC("",{});
// retirer groupe d'outils du OPC (et le label)
const toolsGroupInOpc = opc.querySelector(".tools-group");
if (toolsGroupInOpc) {
const lbl = toolsGroupInOpc.previousElementSibling;
if (lbl && lbl.tagName === "LABEL") lbl.remove();
toolsGroupInOpc.remove();
}
g.appendChild(opc);
kWrap.appendChild(g);
});

// HANCHE (Flex/Ext, Add/Abd) : OPC direct (avec isocinétisme)
} else if (zoneName==="Hanche" && (mb.value==="Adduction/Abduction" || mb.value==="Flexion/Extension" || mb.value==="Rotations")) {
block.innerHTML = `<h5>${mb.value}</h5>`;
const opc = createOPC("",{});
block.appendChild(opc);

// CHEVILLE : muscles + intrinseques
} else if (zoneName==="Cheville / Pied" && mb.value==="Flexion/Extension") {
block.innerHTML = `<h5>${mb.value}</h5>
<div class="ankle-muscles"></div>`;
const aWrap = block.querySelector(".ankle-muscles");
["Gastrocnémien","Soléaire"].forEach(musc => {
const g = document.createElement("div");
g.className = "subcard";
g.innerHTML = `<h6>${musc}</h6>`;
// Outils (uniquement ici)
const tools = document.createElement("div");
tools.innerHTML = `<label>Outils utilisés</label>
<div class="checkbox-group tools-group">${toolsForce.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(tools);
ensureOtherText(tools.querySelector(".tools-group"));
attachIsokineticHandlers(g);
// Tests spécifiques
let tests = testsByMuscle[musc]||["Autre"];
if(musc==="Soléaire"){ tests = ["Isométrie 90°","Autre"]; }
const testsEl = document.createElement("div");
testsEl.innerHTML = `<label>Tests spécifiques</label>
<div class="checkbox-group tests-group">${tests.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(testsEl);
ensureOtherText(testsEl.querySelector(".tests-group"));
// Param + Crit (sans re-outils)
const opc = createOPC("",{});
const toolsGroupInOpc = opc.querySelector(".tools-group");
if (toolsGroupInOpc) {
const lbl = toolsGroupInOpc.previousElementSibling;
if (lbl && lbl.tagName === "LABEL") lbl.remove();
toolsGroupInOpc.remove();
}
g.appendChild(opc);
aWrap.appendChild(g);
});

} else if (zoneName==="Cheville / Pied" && mb.value==="Éversion/Inversion") {
block.innerHTML = `<h5>${mb.value}</h5>`;
const g = document.createElement("div");
g.className = "subcard";
g.innerHTML = `<h6>Inverseurs/Éverseurs</h6>`;
// Outils
const tools = document.createElement("div");
tools.innerHTML = `<label>Outils utilisés</label>
<div class="checkbox-group tools-group">${toolsForce.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(tools);
ensureOtherText(tools.querySelector(".tools-group"));
attachIsokineticHandlers(g);
// Tests spécifiques
const tests = testsByMuscle["Inverseurs/Éverseurs"]||["Autre"];
const testsEl = document.createElement("div");
ensureOtherText(testsEl.querySelector(".tests-group"));
// Param + Crit (sans re-outils)
const opc = createOPC("",{});
const toolsGroupInOpc = opc.querySelector(".tools-group");
if (toolsGroupInOpc) {
const lbl = toolsGroupInOpc.previousElementSibling;
if (lbl && lbl.tagName === "LABEL") lbl.remove();
toolsGroupInOpc.remove();
}
g.appendChild(opc);
block.appendChild(g);

} else if (zoneName==="Cheville / Pied" && mb.value==="Intrinsèques du pied") {
block.innerHTML = `<h5>${mb.value}</h5>`;
const g = document.createElement("div");
g.className = "subcard";
g.innerHTML = `<h6>Intrinsèques du pied</h6>`;
// Outils
const tools = document.createElement("div");
tools.innerHTML = `<label>Outils utilisés</label>
<div class="checkbox-group tools-group">${toolsForce.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(tools);
ensureOtherText(tools.querySelector(".tools-group"));
attachIsokineticHandlers(g);
// Tests spécifiques
const tests = testsByMuscle["Intrinsèques du pied"]||["Autre"];
const testsEl = document.createElement("div");
testsEl.innerHTML = `<label>Tests spécifiques</label>
<div class="checkbox-group tests-group">${tests.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>`;
g.appendChild(testsEl);
ensureOtherText(testsEl.querySelector(".tests-group"));
// Param + Crit (sans re-outils)
const opc = createOPC("",{});
const toolsGroupInOpc = opc.querySelector(".tools-group");
if (toolsGroupInOpc) {
const lbl = toolsGroupInOpc.previousElementSibling;
if (lbl && lbl.tagName === "LABEL") lbl.remove();
toolsGroupInOpc.remove();
}
g.appendChild(opc);
block.appendChild(g);

} else if (zoneName==="Épaule" && mb.value==="ASH Test") {
// ASH Test – positions + OPC SANS isocinétisme
block.innerHTML = `<h5>ASH Test</h5>
<label>Positions</label>
<div class="checkbox-group">
<label><input type="checkbox" value="I (180°)"> I (180°)</label>
<label><input type="checkbox" value="Y (135°)"> Y (135°)</label>
<label><input type="checkbox" value="T (90°)"> T (90°)</label>
<label><input type="checkbox" value="I (0°)"> I (0°)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>`;
ensureOtherText(block.querySelector(".checkbox-group"));
const toolsAsh = ["Dynamomètre manuel","Dynamomètre fixe","Plateforme de force","Sans outil","Autre"];
const opc = document.createElement("div");
opc.innerHTML = `
<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${toolsAsh.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>
<label>Paramètres étudiés</label>
<div class="checkbox-group">
${["Force max (N)","Force moyenne (N)","Force relative (N/kg)","Puissance (W/kg)","RFD (Rate of Force Development)","Endurance (s)"].map(p=>`<label><input type="checkbox" value="${p}"> ${p}</label>`).join("")}
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
${["Comparaison droite/gauche","Valeur de référence individuelle","Autre"].map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join("")}
</div>`;
ensureOtherText(opc.querySelector(".tools-group"));
ensureOtherText(opc.querySelectorAll(".checkbox-group")[2]);
block.appendChild(opc);

} else {
// Mouvement simple: outils/params/crit, cas spé
block.innerHTML = `<h5>${mb.value}</h5>`;

// EXTRA TOOLS cas spé
let extraTools = "";
// Lombaire Flex/Ext : Shirado/Sorensen
if (zoneName==="Rachis lombaire" && mb.value==="Flexion/Extension"){
extraTools += `<label><input type="checkbox" value="Test de Shirado"> Test de Shirado</label>
<label><input type="checkbox" value="Test de Sorensen"> Test de Sorensen</label>`;
}
// Tête/Rachis cervical Flex/Ext : CCFT
if (zoneName===headNeckTitle && mb.value==="Flexion/Extension"){
extraTools += `<label><input type="checkbox" value="Craniocervical Flexion Test (CCFT)"> Craniocervical Flexion Test (CCFT)</label>`;
}

// Critères override pour Tête/Rachis Flex/Ext (pas de DG)
let criteriaOverride = null;
if (zoneName===headNeckTitle && mb.value==="Flexion/Extension") {
criteriaOverride = ["Ratio agoniste/antagoniste","Valeur de référence individuelle","Autre"];
}

const opc = createOPC(extraTools,{excludeIsokinetic:false,criteriaOverride});
block.appendChild(opc);
}

details.appendChild(block);
} else if (exist) {
exist.classList.remove("show");
setTimeout(()=>exist.remove(),300);
}
});
});

return div;
};

/* ---------------------------------------------
* MOBILITÉ – restrictions d’outils
* ------------------------------------------- */
const createMobilityBlock = (zoneName, id) => {
const div = document.createElement("div");
div.id = id;

const moves = [];
moves.push("Flexion/Extension");
if (!["Genou","Cheville / Pied","Coude","Poignet / Main"].includes(zoneName)) moves.push("Rotations");
if (["Épaule","Hanche"].includes(zoneName)) moves.push("Adduction/Abduction");
if (zoneName==="Cheville / Pied") moves.push("Éversion/Inversion");
if (zoneName==="Rachis lombaire" || zoneName===headNeckTitle) moves.push("Inclinaisons");
if (zoneName==="Poignet / Main") moves.push("Inclinaison");

div.innerHTML = `
<h4>Mobilité – ${zoneName}</h4>
<label>Quels mouvements évaluez-vous en mobilité ?</label>
<div class="checkbox-group mob-moves">
${moves.map(m=>`<label><input type="checkbox" value="${m}"> ${m}</label>`).join("")}
</div>
<div class="mob-details"></div>
`;
const details = div.querySelector(".mob-details");

// Fonction utilitaire: outils mobilité autorisés par zone/mouvement
const mobilityToolsFor = (zone, move) => {
const base = [...toolsMobBase];
if (zone==="Cheville / Pied") {
base.splice(base.length-1,0,"Knee-to-wall (KTW)");
}
if (zone==="Rachis lombaire") {
base.splice(base.length-1,0,"Sit-and-reach");
if (move==="Flexion/Extension" || move==="Inclinaisons") {
base.splice(base.length-1,0,"Distance doigt-sol");
}
}
if (zone==="Genou" && move==="Flexion/Extension") {
base.splice(base.length-1,0,"Distance talon-fesses");
}
return base;
};

div.querySelectorAll(".mob-moves input").forEach(mb => {
mb.addEventListener("change", () => {
const mid = `${id}-move-${slug(mb.value)}`;
const exist = details.querySelector("#"+esc(mid));
if (mb.checked) {
const block = document.createElement("div");
block.id = mid;
block.className = "slide show";

const tools = mobilityToolsFor(zoneName, mb.value);
block.innerHTML = `
<h5>${mb.value}</h5>
<label>Outils utilisés</label>
<div class="checkbox-group tools-group">
${tools.map(t=>`<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
${ (zoneName==="Rachis lombaire" && mb.value==="Flexion/Extension") ? "" : `<label><input type="checkbox" value="Comparaison droite/gauche"> Comparaison droite/gauche</label>` }
<label><input type="checkbox" value="Autre"> Autre</label>
</div>`;
details.appendChild(block);
ensureOtherText(block.querySelector(".tools-group"));
ensureOtherText(block.querySelectorAll(".checkbox-group")[1]);
} else if (exist) {
exist.classList.remove("show");
setTimeout(()=>exist.remove(),300);
}
});
});
return div;
};

/* ---------------------------------------------
* PROPRIO
* ------------------------------------------- */
const createProprioBlock = (zoneName, id) => {
const list = proprioByZone[zoneName]||[];
if (!list.length) return document.createElement("div");
const div = document.createElement("div");
div.id = id;
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
</div>`;
ensureOtherText(div.querySelector(".proprio-tests"));
ensureOtherText(div.querySelectorAll(".checkbox-group")[1]);
return div;
};

/* ---------------------------------------------
* QUESTIONNAIRES
* ------------------------------------------- */
const createQuestionnaireBlock = (zoneName, id) => {
const list = questionnairesByZone[zoneName]||[];
if (!list.length) return document.createElement("div");
const div = document.createElement("div");
div.id = id;
div.innerHTML = `
<h4>Questionnaires – ${zoneName}</h4>
<div class="checkbox-group q-list">
${list.map(q=>`<label><input type="checkbox" value="${q}"> ${q}</label>`).join("")}
</div>`;
ensureOtherText(div.querySelector(".q-list"));
return div;
};

/* ---------------------------------------------
* COGNITION (Head/Neck)
* ------------------------------------------- */
const createCognitionBlock = (zoneName, id) => {
const div = document.createElement("div");
div.id = id;
div.innerHTML = `
<h4>Test de cognition</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Test oculaire"> Test oculaire</label>
<label><input type="checkbox" value="Test vestibulaire"> Test vestibulaire</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>`;
ensureOtherText(div.querySelector(".checkbox-group"));
return div;
};

/* ---------------------------------------------
* AUTRES DONNÉES
* ------------------------------------------- */
const createOtherDataBlock = (zoneName, id) => {
const div = document.createElement("div");
div.id = id;
div.innerHTML = `
<h4>Autres données – ${zoneName}</h4>
<input type="text" class="other-input small" placeholder="Précisez la donnée collectée" required>`;
return div;
};

/* ---------------------------------------------
* Zones: logique de sélection + fusion Tête/Rachis
* ------------------------------------------- */
const selectedZones = () => zonesCbs.filter(z=>z.checked).map(z=>z.value);
const getLogicalZones = () => {
const sel = selectedZones();
const set = new Set(sel);
if (sel.some(z=>headNeck.includes(z))) set.add(headNeckTitle);
headNeck.forEach(z=>set.delete(z));
return [...set];
};

zonesCbs.forEach(cb => {
cb.addEventListener("change", () => {
if (headNeck.includes(cb.value)) {
const anyHN = zonesCbs.some(z=>headNeck.includes(z.value) && z.checked);
if (anyHN) createZoneSection(headNeckTitle); else removeZoneSection(headNeckTitle);
} else {
if (cb.checked) createZoneSection(cb.value); else removeZoneSection(cb.value);
}
toggleGlobalsBlock();
});
});

/* ---------------------------------------------
* BLOCS TRANSVERSAUX
* ------------------------------------------- */
const globalsSection = byId("globalsSection");
const globalBlocks = byId("globalBlocks");
let jumpsBlock, courseBlock, globalMIBlock, globalMSBlock, combatBlock;

const buildJumpsBlock = () => {
const d = document.createElement("div");
d.className = "subcard";
d.id = "global-jumps";
d.innerHTML = `
<h3>Tests de sauts</h3>
<label>Effectuez-vous des tests de sauts ?</label>
<div class="checkbox-group yn">
<label><input type="radio" name="jumps-yn" value="Oui"> Oui</label>
<label><input type="radio" name="jumps-yn" value="Non"> Non</label>
</div>
<div class="slide" id="jumps-detail">
<label>Quels tests de sauts utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="CMJ (Countermovement Jump)"> CMJ (Countermovement Jump)</label>
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
<label><input type="checkbox" value="RFD (Rate of Force Development)"> RFD (Rate of Force Development)</label>
<label><input type="checkbox" value="RSI (Reactive Strength Index)"> RSI (Reactive Strength Index)</label>
<label><input type="checkbox" value="Distance (cm)"> Distance (cm)</label>
</div>
<label>Outils</label>
<div class="checkbox-group jump-tools">
<label><input type="checkbox" value="Plateforme de force"> Plateforme de force</label>
<label><input type="checkbox" value="Centimétrie"> Centimétrie</label>
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
<label><input type="checkbox" value="Encodeur linéaire"> Encodeur linéaire</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Comparaison droite/gauche"> Comparaison droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
</div>
`;
const yn = d.querySelectorAll("input[name='jumps-yn']");
const det = d.querySelector("#jumps-detail");
yn.forEach(r=>r.addEventListener("change",()=>{
det.classList.toggle("show", r.value==="Oui" && r.checked);
}));
d.querySelectorAll(".checkbox-group").forEach(g=>ensureOtherText(g));
return d;
};

const buildCourseBlock = () => {
const d = document.createElement("div");
d.className = "subcard";
d.id = "global-course";
d.innerHTML = `
<h3>Tests de course</h3>
<label>Effectuez-vous des tests de course ?</label>
<div class="checkbox-group yn">
<label><input type="radio" name="course-yn" value="Oui"> Oui</label>
<label><input type="radio" name="course-yn" value="Non"> Non</label>
</div>
<div class="slide" id="course-detail">
<label>Quels tests de course utilisez-vous ?</label>

<h4 class="subtle">Énergétiques</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Yoyo IR test 1"> Yoyo IR test 1</label>
<label><input type="checkbox" value="Bronco"> Bronco</label>
<label><input type="checkbox" value="Broken Bronco"> Broken Bronco</label>
<label><input type="checkbox" value="Luc Léger"> Luc Léger</label>
<label><input type="checkbox" value="VAMEVAL"> VAMEVAL</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<h4 class="subtle">Vitesse</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Sprint 10m"> Sprint 10m</label>
<label><input type="checkbox" value="Sprint 20m"> Sprint 20m</label>
<label><input type="checkbox" value="Sprint 30m"> Sprint 30m</label>
<label><input type="checkbox" value="Vmax"> Vmax</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<h4 class="subtle">Changement de direction (COD)</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="505"> 505</label>
<label><input type="checkbox" value="T-Test"> T-Test</label>
<label><input type="checkbox" value="Illinois"> Illinois</label>
<label><input type="checkbox" value="ZigZag test"> ZigZag test</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<h4 class="subtle">Décélération</h4>
<div class="checkbox-group yn" id="decel-yn">
<label><input type="radio" name="decel-yn" value="Oui"> Oui</label>
<label><input type="radio" name="decel-yn" value="Non"> Non</label>
</div>
<div class="slide" id="decel-detail">
<input type="text" class="other-input small" placeholder="Précisez (type de test, distance, protocole…)" />
</div>

<label>Outils</label>
<div class="checkbox-group course-tools">
<label><input type="checkbox" value="Chronomètre"> Chronomètre</label>
<label><input type="checkbox" value="Cellules"> Cellules</label>
<label><input type="checkbox" value="GPS"> GPS</label>
<label><input type="checkbox" value="1080 Sprint"> 1080 Sprint</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne par poste"> Moyenne par poste</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
</div>
`;
const yn = d.querySelectorAll("input[name='course-yn']");
const det = d.querySelector("#course-detail");
yn.forEach(r=>r.addEventListener("change",()=>{
det.classList.toggle("show", r.value==="Oui" && r.checked);
toggleCombatBlock();
}));

// Décélération toggle
const dYN = d.querySelectorAll("input[name='decel-yn']");
const dDet = d.querySelector("#decel-detail");
dYN.forEach(r=>r.addEventListener("change",()=>{
dDet.classList.toggle("show", r.value==="Oui" && r.checked);
}));

d.querySelectorAll(".checkbox-group").forEach(g=>ensureOtherText(g));
return d;
};

const buildGlobalMIBlock = () => {
const d = document.createElement("div");
d.className = "subcard";
d.id = "global-mi";
d.innerHTML = `
<h3>Tests fonctionnels globaux – Membre inférieur</h3>
<label>Effectuez-vous des tests fonctionnels globaux du membre inférieur ?</label>
<div class="checkbox-group yn">
<label><input type="radio" name="mi-yn" value="Oui"> Oui</label>
<label><input type="radio" name="mi-yn" value="Non"> Non</label>
</div>
<div class="slide" id="mi-detail">
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
<label><input type="checkbox" value="Isométrie"> Isométrie</label>
<label><input type="checkbox" value="Répétition maximale (RM)"> Répétition maximale (RM)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne du groupe"> Moyenne du groupe</label>
<label><input type="checkbox" value="Ratio / poids du corps"> Ratio / poids du corps</label>
<label><input type="checkbox" value="Ratio droite/gauche"> Ratio droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
</div>
`;
const yn = d.querySelectorAll("input[name='mi-yn']");
const det = d.querySelector("#mi-detail");
yn.forEach(r=>r.addEventListener("change",()=>{
det.classList.toggle("show", r.value==="Oui" && r.checked);
}));
d.querySelectorAll(".checkbox-group").forEach(g=>ensureOtherText(g));
return d;
};

const buildGlobalMSBlock = () => {
const d = document.createElement("div");
d.className = "subcard";
d.id = "global-ms";
d.innerHTML = `
<h3>Tests fonctionnels globaux – Membre supérieur</h3>
<label>Effectuez-vous des tests fonctionnels globaux du membre supérieur ?</label>
<div class="checkbox-group yn">
<label><input type="radio" name="ms-yn" value="Oui"> Oui</label>
<label><input type="radio" name="ms-yn" value="Non"> Non</label>
</div>
<div class="slide" id="ms-detail">
<label>Quels tests ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Développé couché"> Développé couché</label>
<label><input type="checkbox" value="Traction"> Traction</label>
<label><input type="checkbox" value="Tirage"> Tirage</label>
<label><input type="checkbox" value="Force grip"> Force grip</label>
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
<label><input type="checkbox" value="Isométrie"> Isométrie</label>
<label><input type="checkbox" value="Répétition maximale (RM)"> Répétition maximale (RM)</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
<label>Critères d’évaluation</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne du groupe"> Moyenne du groupe</label>
<label><input type="checkbox" value="Ratio / poids du corps"> Ratio / poids du corps</label>
<label><input type="checkbox" value="Ratio droite/gauche"> Ratio droite/gauche</label>
<label><input type="checkbox" value="Valeur de référence individuelle"> Valeur de référence individuelle</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>
</div>
`;
const yn = d.querySelectorAll("input[name='ms-yn']");
const det = d.querySelector("#ms-detail");
yn.forEach(r=>r.addEventListener("change",()=>{
det.classList.toggle("show", r.value==="Oui" && r.checked);
}));
d.querySelectorAll(".checkbox-group").forEach(g=>ensureOtherText(g));
return d;
};

const buildCombatBlock = () => {
const d = document.createElement("div");
d.className = "subcard";
d.id = "global-combat";
d.innerHTML = `
<h3>Tests spécifiques de combat</h3>
<label>Effectuez-vous des tests spécifiques de combat ?</label>
<div class="checkbox-group yn">
<label><input type="radio" name="combat-yn" value="Oui"> Oui</label>
<label><input type="radio" name="combat-yn" value="Non"> Non</label>
</div>
`;
return d;
};

const toggleCombatBlock = () => {
const anyReturn = !!document.querySelector(".moment input[value='Retour au jeu']:checked");
if (anyReturn) {
if (!combatBlock) {
combatBlock = buildCombatBlock();
globalBlocks.appendChild(combatBlock);
}
} else {
if (combatBlock) { combatBlock.remove(); combatBlock=null; }
}
};

const toggleGlobalsBlock = () => {
const zones = selectedZones();
const hasLower = zones.some(z=>lowerBody.includes(z));
const hasHead = zones.some(z=>headNeck.includes(z));
const logical = getLogicalZones();
const any = logical.length>0;
globalsSection.style.display = any ? "" : "none";
if (!any) {
globalBlocks.innerHTML = "";
jumpsBlock = courseBlock = globalMIBlock = globalMSBlock = combatBlock = null;
return;
}
// Sauts: si MI cochée
if (hasLower) {
if (!jumpsBlock) { jumpsBlock = buildJumpsBlock(); globalBlocks.appendChild(jumpsBlock); }
} else if (jumpsBlock) { jumpsBlock.remove(); jumpsBlock=null; }
// Course: si MI ou tête/rachis cochés
if (hasLower || hasHead) {
if (!courseBlock) { courseBlock = buildCourseBlock(); globalBlocks.appendChild(courseBlock); }
} else if (courseBlock) { courseBlock.remove(); courseBlock=null; }
// Globaux MI: si MI cochée
if (hasLower) {
if (!globalMIBlock) { globalMIBlock = buildGlobalMIBlock(); globalBlocks.appendChild(globalMIBlock); }
} else if (globalMIBlock) { globalMIBlock.remove(); globalMIBlock=null; }
// Globaux MS: si MS cochée
const hasUpper = zones.some(z=>["Épaule","Coude","Poignet / Main"].includes(z));
if (hasUpper) {
if (!globalMSBlock) { globalMSBlock = buildGlobalMSBlock(); globalBlocks.appendChild(globalMSBlock); }
} else if (globalMSBlock) { globalMSBlock.remove(); globalMSBlock=null; }
// Combat
toggleCombatBlock();
};

// Créer/supprimer sections au clic (fusion Tête/Rachis)
zonesCbs.forEach(cb => {
cb.addEventListener("change", () => {
if (headNeck.includes(cb.value)) {
const any = zonesCbs.some(z=>headNeck.includes(z.value) && z.checked);
if (any) createZoneSection(headNeckTitle); else removeZoneSection(headNeckTitle);
} else {
if (cb.checked) createZoneSection(cb.value); else removeZoneSection(cb.value);
}
toggleGlobalsBlock();
});
});

/* ---------------------------------------------
* VALIDATION + ENVOI GOOGLE FORM
* ------------------------------------------- */
const resultMsg = byId("resultMessage");
const submitBtn = byId("submitBtn");
const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSeNok3wNrafUFIM2VnAo4NKQpdZDaDyFDeVS8dZbXFyt_ySyA/formResponse";
const GOOGLE_ENTRY_KEY = "entry.1237244370";

const gatherChecked = scope => [...scope.querySelectorAll("input[type='checkbox']:checked")].map(i=>i.value);
const gatherRadio = scope => (scope.querySelector("input[type='radio']:checked")||{}).value || "";

const buildPayload = () => {
  const listVals = (nodeList) => [...nodeList].map(i => i.value);

  const payload = {};

  // --- Infos principales
  payload.nom = byId("nom").value.trim();
  payload.prenom = byId("prenom").value.trim();
  payload.role = (document.querySelector("input[name='role']:checked") || {}).value || "";
  payload.role_autre = byId("role-autre").style.display !== "none" ? byId("role-autre").value.trim() : "";
  payload.equipe = (document.querySelector("input[name='equipe']:checked") || {}).value || "";
  payload.equipe_autre = byId("equipe-autre").style.display !== "none" ? byId("equipe-autre").value.trim() : "";

  // --- Zones sélectionnées
  payload.zones = selectedZones();

  // --- Détails par zone
  const logical = getLogicalZones();
  payload.zones_details = [];

  logical.forEach(zone => {
    const sec = byId(`section-${slug(zone)}`);
    if (!sec) return;

    const zoneData = {
      zone,
      moments: gatherChecked(sec.querySelector(".moment")),
      types: gatherChecked(sec.querySelector(".types")),
      force: [],
      mobilite: [],
      proprio: [],
      questionnaires: [],
      cognition: [],
      autres_donnees: []
    };

    // ----- FORCE -----
    const force = sec.querySelector(`#sub-${slug(zone)}-force`);
    if (force) {
      const moves = [...force.querySelectorAll(".force-moves input:checked")].map(i => i.value);
      moves.forEach(mv => {
        const moveBlock = force.querySelector(`#sub-${slug(zone)}-force-move-${slug(mv)}`);
        if (!moveBlock) return;

        const data = {
          mouvement: mv,
          outils: listVals(moveBlock.querySelectorAll(".tools-group input:checked")),
          tests: listVals(moveBlock.querySelectorAll(".tests-group input:checked")),
          params: listVals(moveBlock.querySelectorAll(".params-group input:checked")),
          criteres: listVals(moveBlock.querySelectorAll(".crit-group input:checked")),
          isoVitesses: listVals(moveBlock.querySelectorAll(".iso-speed input:checked")),
          isoModes: listVals(moveBlock.querySelectorAll(".iso-mode input:checked"))
        };

        // --- Champs "Autre" dans la section Force
        const otherInputs = moveBlock.querySelectorAll("input.other-input");
        otherInputs.forEach(inp => {
          const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
          const val = inp.value.trim();
          if (val) data[label] = val;
        });

        zoneData.force.push(data);
      });
    }

    // ----- MOBILITÉ -----
    const mob = sec.querySelector(`#sub-${slug(zone)}-mobilite`);
    if (mob) {
      const moves = [...mob.querySelectorAll(".mob-moves input:checked")].map(i => i.value);
      moves.forEach(mv => {
        const moveBlock = mob.querySelector(`#sub-${slug(zone)}-mobilite-move-${slug(mv)}`);
        if (!moveBlock) return;

        const data = {
          mouvement: mv,
          outils: listVals(moveBlock.querySelectorAll(".tools-group input:checked")),
          criteres: listVals((moveBlock.querySelectorAll(".checkbox-group")[1] || moveBlock).querySelectorAll("input:checked"))
        };

        // --- Champs "Autre" dans la section Mobilité
        const otherInputs = moveBlock.querySelectorAll("input.other-input");
        otherInputs.forEach(inp => {
          const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
          const val = inp.value.trim();
          if (val) data[label] = val;
        });

        zoneData.mobilite.push(data);
      });
    }

    // ----- PROPRIO -----
    const proprio = sec.querySelector(`#sub-${slug(zone)}-proprioception-equilibre`);
    if (proprio) {
      zoneData.proprio = listVals(proprio.querySelectorAll("input:checked"));
      const otherInputs = proprio.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) zoneData.proprio.push(`Autre: ${val}`);
      });
    }

    // ----- QUESTIONNAIRES -----
    const quest = sec.querySelector(`#sub-${slug(zone)}-questionnaires`);
    if (quest) {
      zoneData.questionnaires = listVals(quest.querySelectorAll("input:checked"));
      const otherInputs = quest.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) zoneData.questionnaires.push(`Autre: ${val}`);
      });
    }

    // ----- COGNITION -----
    const cog = sec.querySelector(`#sub-${slug(zone)}-test-de-cognition`);
    if (cog) {
      zoneData.cognition = listVals(cog.querySelectorAll("input:checked"));
      const otherInputs = cog.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) zoneData.cognition.push(`Autre: ${val}`);
      });
    }

    // ----- AUTRES DONNÉES -----
    const od = sec.querySelector(`#sub-${slug(zone)}-autres-donnees`);
    if (od) {
      const t = od.querySelector("input")?.value.trim();
      if (t) zoneData.autres_donnees.push(t);
    }

    payload.zones_details.push(zoneData);
  });

  // --- BLOCS GLOBAUX ---
  const gb = {};
  const jumps = byId("global-jumps");
  if (jumps) {
    gb.sauts = { fait: gatherRadio(jumps) };
    if (gb.sauts.fait === "Oui") {
      const groups = jumps.querySelectorAll("#jumps-detail .checkbox-group");
      gb.sauts.tests = listVals(groups[0].querySelectorAll("input:checked"));
      gb.sauts.params = listVals(groups[1].querySelectorAll("input:checked"));
      gb.sauts.outils = listVals(groups[2].querySelectorAll("input:checked"));
      gb.sauts.criteres = listVals(groups[3].querySelectorAll("input:checked"));

      // Champs "Autre" sauts
      const otherInputs = jumps.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
        const val = inp.value.trim();
        if (val) gb.sauts[label] = val;
      });
    }
  }

  const course = byId("global-course");
  if (course) {
    gb.course = { fait: gatherRadio(course) };
    if (gb.course.fait === "Oui") {
      const groups = course.querySelectorAll("#course-detail .checkbox-group");
      gb.course.tests_ener = listVals(groups[0].querySelectorAll("input:checked"));
      gb.course.tests_vit = listVals(groups[1].querySelectorAll("input:checked"));
      gb.course.tests_cod = listVals(groups[2].querySelectorAll("input:checked"));
      const dYN = course.querySelector("input[name='decel-yn']:checked")?.value || "";
      const dText = course.querySelector("#decel-detail .other-input")?.value?.trim() || "";
      gb.course.deceleration = { fait: dYN, details: (dYN === "Oui") ? dText : "" };
      gb.course.outils = listVals(groups[4].querySelectorAll("input:checked"));
      gb.course.criteres = listVals(groups[5].querySelectorAll("input:checked"));

      // Champs "Autre" course
      const otherInputs = course.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
        const val = inp.value.trim();
        if (val) gb.course[label] = val;
      });
    }
  }

  const mi = byId("global-mi");
  if (mi) {
    gb.mi = { fait: gatherRadio(mi) };
    if (gb.mi.fait === "Oui") {
      const groups = mi.querySelectorAll("#mi-detail .checkbox-group");
      gb.mi.tests = listVals(groups[0].querySelectorAll("input:checked"));
      gb.mi.outils = listVals(groups[1].querySelectorAll("input:checked"));
      gb.mi.params = listVals(groups[2].querySelectorAll("input:checked"));
      gb.mi.criteres = listVals(groups[3].querySelectorAll("input:checked"));

      // Champs "Autre" MI
      const otherInputs = mi.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
        const val = inp.value.trim();
        if (val) gb.mi[label] = val;
      });
    }
  }

  const ms = byId("global-ms");
  if (ms) {
    gb.ms = { fait: gatherRadio(ms) };
    if (gb.ms.fait === "Oui") {
      const groups = ms.querySelectorAll("#ms-detail .checkbox-group");
      gb.ms.tests = listVals(groups[0].querySelectorAll("input:checked"));
      gb.ms.outils = listVals(groups[1].querySelectorAll("input:checked"));
      gb.ms.params = listVals(groups[2].querySelectorAll("input:checked"));
      gb.ms.criteres = listVals(groups[3].querySelectorAll("input:checked"));

      // Champs "Autre" MS
      const otherInputs = ms.querySelectorAll("input.other-input");
      otherInputs.forEach(inp => {
        const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
        const val = inp.value.trim();
        if (val) gb.ms[label] = val;
      });
    }
  }

  const combat = byId("global-combat");
  if (combat) {
    gb.combat = { fait: gatherRadio(combat) };

    // Champs "Autre" combat
    const otherInputs = combat.querySelectorAll("input.other-input");
    otherInputs.forEach(inp => {
      const label = inp.closest(".other-wrap")?.querySelector("label")?.innerText || "Autre";
      const val = inp.value.trim();
      if (val) gb.combat[label] = val;
    });
  }

  payload.globaux = gb;

  // --- Questions communes
  const bar = byId("barrieres");
  payload.barrieres = listVals(bar.querySelectorAll("input[type='checkbox']:checked"));
  if (bar.querySelector("input[value='Autre']")?.checked)
    payload.barrieres_autre = byId("barrieres-autre").value.trim();

  const rai = byId("raisons");
  payload.raisons = listVals(rai.querySelectorAll("input[type='checkbox']:checked"));
  if (rai.querySelector("input[value='Autre']")?.checked)
    payload.raisons_autre = byId("raisons-autre").value.trim();

  return payload;
};

const validate = () => {
if (!byId("nom").value.trim() || !byId("prenom").value.trim()) return "Merci de renseigner Nom et Prénom.";
const role = document.querySelector("input[name='role']:checked");
if (!role) return "Merci d’indiquer votre rôle.";
if (role.value==="Autre" && byId("role-autre").style.display!=="none" && !byId("role-autre").value.trim()) return "Merci de préciser votre rôle.";
const eq = document.querySelector("input[name='equipe']:checked");
if (!eq) return "Merci d’indiquer l’équipe.";
if (eq.value==="Autre" && byId("equipe-autre").style.display!=="none" && !byId("equipe-autre").value.trim()) return "Merci de préciser l’équipe.";

if (selectedZones().length===0) return "Merci de sélectionner au moins une zone anatomique.";

// champs "Autre" visibles
const others = $$(".other-wrap input.other-input");
for (const t of others) {
if (requiredIfVisible(t) && !t.value.trim()) return "Merci de préciser les champs 'Autre' sélectionnés.";
}
// Communes
const barAutreCb = byId("barrieres")?.querySelector("input[value='Autre']");
if (barAutreCb && barAutreCb.checked && !byId("barrieres-autre").value.trim()) return "Merci de préciser les champs 'Autre' sélectionnés.";
const raiAutreCb = byId("raisons")?.querySelector("input[value='Autre']");
if (raiAutreCb && raiAutreCb.checked && !byId("raisons-autre").value.trim()) return "Merci de préciser les champs 'Autre' sélectionnés.";

return "";
};

submitBtn.addEventListener("click", async (e)=>{
e.preventDefault();
resultMsg.textContent="";
const err = validate();
if (err){
resultMsg.style.color = "#d11c1c";
resultMsg.textContent = "⚠️ " + err;
window.scrollTo({top:0,behavior:"smooth"});
return;
}

const payload = buildPayload();
const fd = new FormData();
fd.append(GOOGLE_ENTRY_KEY, JSON.stringify(payload));

try{
await fetch(GOOGLE_FORM_URL, {method:"POST",mode:"no-cors",body:fd});
resultMsg.style.color = "#0a7f2e";
resultMsg.textContent = "✅ Merci, vos réponses ont été enregistrées.";
form.reset();
byId("zoneQuestions").innerHTML = "";
byId("globalsSection").style.display="none";
byId("globalBlocks").innerHTML = "";
jumpsBlock = courseBlock = globalMIBlock = globalMSBlock = combatBlock = null;
updateProgress();
window.scrollTo({top:0,behavior:"smooth"});
}catch(err){
resultMsg.style.color = "#d11c1c";
resultMsg.textContent = "⚠️ Erreur d’envoi. Vérifiez votre connexion et réessayez.";
}
});

/* ---------------------------------------------
* INIT : "Autre" commun + progression
* ------------------------------------------- */
const setupCommonAutre = (groupId, inputId) => {
const group = byId(groupId);
if(!group) return;
const cb = group.querySelector("input[value='Autre']");
const input = byId(inputId);
if(!cb || !input) return;
const toggle = () => {
input.style.display = cb.checked ? "block" : "none";
input.required = cb.checked;
if(!cb.checked) input.value="";
};
cb.addEventListener("change", toggle);
toggle();
};
setupCommonAutre("barrieres","barrieres-autre");
setupCommonAutre("raisons","raisons-autre");

updateProgress();
});
