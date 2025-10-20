// ------------------------------
// script.js – Version complète et corrigée
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {

const zonesCheckboxes = document.querySelectorAll("#zones input[type='checkbox']");
const zoneQuestionsContainer = document.getElementById("zoneQuestions");
const submitBtn = document.getElementById("submitBtn");
const resultMessage = document.getElementById("resultMessage");

const lowerBodyZones = ["Hanche", "Genou", "Cheville / Pied"];
const upperBodyZones = ["Tête", "Rachis cervical", "Épaule", "Coude", "Poignet / Main", "Rachis lombaire"];

let responses = {};

// ---------------------------------------------------------
// Création des sections dynamiques quand une zone est cochée
// ---------------------------------------------------------
zonesCheckboxes.forEach(zone => {
zone.addEventListener("change", () => {
const zoneName = zone.value;
if (zone.checked) {
createZoneSection(zoneName);
} else {
removeZoneSection(zoneName);
delete responses[zoneName];
}
});
});

function createZoneSection(zoneName) {
const section = document.createElement("div");
section.classList.add("subcard", "fade-in");
section.id = `section-${zoneName.replace(/\s+/g, "-")}`;
section.innerHTML = `
<h3>${zoneName}</h3>

<label>À quel moment testez-vous cette zone ?</label>
<div class="checkbox-group moment">
<label><input type="checkbox" value="Pré-saison"> Pré-saison</label>
<label><input type="checkbox" value="Retour au jeu"> Retour au jeu</label>
<label><input type="checkbox" value="Autre fréquence"> Autre fréquence</label>
</div>

<label>Quels types de tests sont réalisés ?</label>
<div class="checkbox-group types">
${zoneName === "Tête" ? `
<label><input type="checkbox" value="Questionnaires"> Questionnaires</label>
<label><input type="checkbox" value="Autres données"> Autres données</label>
` : `
<label><input type="checkbox" value="Force"> Force</label>
<label><input type="checkbox" value="Mobilité"> Mobilité</label>
${lowerBodyZones.includes(zoneName) ? `
<label><input type="checkbox" value="Sauts"> Sauts</label>
<label><input type="checkbox" value="Course"> Course</label>` : ""}
<label><input type="checkbox" value="Proprioception / Équilibre"> Proprioception / Équilibre</label>
<label><input type="checkbox" value="Questionnaires"> Questionnaires</label>
<label><input type="checkbox" value="Autres données"> Autres données</label>
`}
</div>

<div class="subquestions" id="sub-${zoneName.replace(/\s+/g, "-")}"></div>
`;
zoneQuestionsContainer.appendChild(section);

const typeCheckboxes = section.querySelectorAll(".types input[type='checkbox']");
const subQContainer = section.querySelector(".subquestions");

// Gestion dynamique avec effet slide + décalage + surbrillance
typeCheckboxes.forEach((cb, i) => {
cb.addEventListener("change", () => {
const id = `sub-${zoneName}-${cb.value}`;
const existing = subQContainer.querySelector(`#${id}`);

if (cb.checked) {
let subSection;

// Cas particulier pour la Tête → sous-question spécifique “Autres données”
if (zoneName === "Tête" && cb.value === "Autres données") {
subSection = document.createElement("div");
subSection.id = id;
subSection.classList.add("slide", "stagger");
subSection.style.animationDelay = `${i * 0.1}s`;
subSection.innerHTML = `
<h4>Autres données (Tête)</h4>
<div class="checkbox-group">
<label><input type="checkbox" value="Antécédents médicaux"> Antécédents médicaux</label>
<label><input type="checkbox" value="Test de cognition"> Test de cognition</label>
</div>
`;
} else {
// Cas normal → génère les sous-sections standards
subSection = createSubQuestion(zoneName, cb.value);
subSection.classList.add("slide");
subSection.style.animationDelay = `${i * 0.1}s`;
}

subQContainer.appendChild(subSection);
section.classList.add("active");

setTimeout(() => {
subSection.classList.add("show", "stagger");
}, 10);
} else if (existing) {
existing.classList.remove("show");
setTimeout(() => {
existing.remove();

// Si plus de test sélectionné, on retire la surbrillance
const stillChecked = section.querySelectorAll(".types input:checked").length > 0;
if (!stillChecked) section.classList.remove("active");

}, 400);
}
});
});
}

function removeZoneSection(zoneName) {
const section = document.getElementById(`section-${zoneName.replace(/\s+/g, "-")}`);
if (section) section.remove();
}

// ---------------------------------------------------------
// Génération des sous-menus selon le type de test
// ---------------------------------------------------------
function createSubQuestion(zoneName, type) {
const div = document.createElement("div");
div.classList.add("nested", "fade-in");
div.id = `sub-${zoneName}-${type}`;
let content = "";

switch (type) {

// ----------------------------- FORCE -----------------------------
case "Force":
content = `
<h4>Force – ${zoneName}</h4>

<label>Quels mouvements évaluez-vous en force ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Flexion/Extension"> Flexion / Extension</label>
${["Rachis cervical", "Poignet / Main", "Rachis lombaire"].includes(zoneName) ? `<label><input type="checkbox" value="Inclinaisons"> Inclinaisons</label>` : ""}
${!["Genou", "Cheville / Pied", "Coude", "Poignet / Main"].includes(zoneName) ? `<label><input type="checkbox" value="Rotations"> Rotations</label>` : ""}
${["Épaule", "Hanche"].includes(zoneName) ? `<label><input type="checkbox" value="Adduction/Abduction"> Adduction / Abduction</label>` : ""}
${["Cheville / Pied"].includes(zoneName) ? `<label><input type="checkbox" value="Éversion/Inversion"> Éversion / Inversion</label>` : ""}
</div>

<label>Quels outils utilisez-vous pour évaluer la force ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Dynamomètre manuel"> Dynamomètre manuel</label>
<label><input type="checkbox" value="Dynamomètre fixe"> Dynamomètre fixe</label>
<label><input type="checkbox" value="Isocinétisme"> Isocinétisme</label>
<label><input type="checkbox" value="Plateforme de force"> Plateforme de force</label>
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
</div>

<label>Quels critères ou indicateurs sont suivis ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Ratio agoniste/antagoniste"> Ratio agoniste/antagoniste</label>
<label><input type="checkbox" value="Ratio droite/gauche"> Ratio droite/gauche</label>
<label><input type="checkbox" value="Valeur seuil"> Valeur seuil</label>
</div>
`;
break;

// ----------------------------- MOBILITÉ -----------------------------
case "Mobilité":
content = `
<h4>Mobilité – ${zoneName}</h4>

<label>Quels mouvements évaluez-vous en mobilité ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Flexion/Extension"> Flexion / Extension</label>
${["Rachis cervical", "Poignet / Main", "Rachis lombaire"].includes(zoneName) ? `<label><input type="checkbox" value="Inclinaisons"> Inclinaisons</label>` : ""}
${!["Genou", "Cheville / Pied", "Coude", "Poignet / Main"].includes(zoneName) ? `<label><input type="checkbox" value="Rotations"> Rotations</label>` : ""}
${["Épaule", "Hanche"].includes(zoneName) ? `<label><input type="checkbox" value="Adduction/Abduction"> Adduction / Abduction</label>` : ""}
${["Cheville / Pied"].includes(zoneName) ? `<label><input type="checkbox" value="Éversion/Inversion"> Éversion / Inversion</label>` : ""}
</div>

<label>Quels outils utilisez-vous pour évaluer la mobilité ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Goniomètre"> Goniomètre</label>
<label><input type="checkbox" value="Inclinomètre"> Inclinomètre</label>
<label><input type="checkbox" value="Test spécifique"> Test spécifique</label>
<label><input type="checkbox" value="Autre"> Autre</label>
</div>

<label>Quels critères de suivi utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Comparaison droite/gauche"> Comparaison droite/gauche</label>
<label><input type="checkbox" value="Valeur seuil"> Valeur seuil</label>
</div>
`;
break;

// ----------------------------- SAUTS -----------------------------
case "Sauts":
content = `
<h4>Sauts – ${zoneName}</h4>
<label>Quels tests de sauts utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="CMJ"> CMJ</label>
<label><input type="checkbox" value="Squat Jump"> Squat Jump</label>
<label><input type="checkbox" value="Drop Jump"> Drop Jump</label>
<label><input type="checkbox" value="Broad Jump"> Broad Jump</label>
<label><input type="checkbox" value="Single Hop"> Single Hop</label>
<label><input type="checkbox" value="Triple Hop"> Triple Hop</label>
<label><input type="checkbox" value="Side Hop"> Side Hop</label>
</div>

<label>Quels outils utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Plateforme de force"> Plateforme de force</label>
<label><input type="checkbox" value="Centimétrie"> Centimétrie</label>
<label><input type="checkbox" value="Sans outil"> Sans outil</label>
</div>

<label>Quels critères ou indicateurs sont suivis ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Comparaison droite/gauche"> Comparaison droite/gauche</label>
<label><input type="checkbox" value="Valeur seuil"> Valeur seuil</label>
</div>
`;
break;

// ----------------------------- COURSE -----------------------------
case "Course":
content = `
<h4>Course – ${zoneName}</h4>
<label>Quels tests de course utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Sprint 10m"> Sprint 10m</label>
<label><input type="checkbox" value="Sprint 20m"> Sprint 20m</label>
<label><input type="checkbox" value="Sprint 30m"> Sprint 30m</label>
<label><input type="checkbox" value="Yoyo"> Yoyo</label>
<label><input type="checkbox" value="Bronco"> Bronco</label>
</div>

<label>Quels outils utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Chronomètre"> Chronomètre</label>
<label><input type="checkbox" value="Cellules"> Cellules</label>
<label><input type="checkbox" value="GPS"> GPS</label>
</div>

<label>Quels critères ou indicateurs sont suivis ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Moyenne par poste"> Moyenne par poste</label>
<label><input type="checkbox" value="Valeur seuil"> Valeur seuil</label>
</div>
`;
break;

default:
content = `<p>Aucune sous-question spécifique pour ${type}.</p>`;
}

div.innerHTML = content;
return div;
}

// ---------------------------------------------------------
// Validation avant envoi
// ---------------------------------------------------------
submitBtn.addEventListener("click", (e) => {
e.preventDefault();

const selectedZones = [...zonesCheckboxes].filter(z => z.checked);
if (selectedZones.length === 0) {
resultMessage.textContent = "⚠️ Merci de sélectionner au moins une zone anatomique.";
resultMessage.style.color = "red";
return;
}

const incomplete = selectedZones.some(z => {
const section = document.getElementById(`section-${z.value.replace(/\s+/g, "-")}`);
return section && !section.querySelector("input:checked");
});

if (incomplete) {
resultMessage.textContent = "⚠️ Merci de compléter toutes les sous-sections avant d’envoyer.";
resultMessage.style.color = "red";
return;
}

resultMessage.textContent = "✅ Merci ! Vos réponses ont bien été enregistrées.";
resultMessage.style.color = "#0074d9";
window.scrollTo({ top: 0, behavior: "smooth" });
});
});
// --- Envoi des réponses vers Google Form ---
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdapFr_E-reVlW6HIdRynqwSd5Fc8eebgO5QX2t5EXjpCRYdw/viewform?usp=pp_url&entry.1252291742=test";
const GOOGLE_FIELD_ENTRY = "entry.1252291742"; // à remplacer par ton ID de champ

function sendToGoogleForm(responses) {
const formData = new FormData();
formData.append(GOOGLE_FIELD_ENTRY, JSON.stringify(responses));

fetch(GOOGLE_FORM_URL, {
method: "POST",
mode: "no-cors",
body: formData
})
.then(() => {
alert("
￼
 Vos réponses ont été envoyées avec succès !");
localStorage.removeItem("responses");
})
.catch(() => {
alert("
￼
 Erreur lors de l’envoi. Vérifiez votre connexion internet.");
});
}document.getElementById("submit-btn").addEventListener("click", () => {
const isValid = validateBeforeSubmit(); // ta fonction de vérif des champs
if (isValid) {
const savedResponses = JSON.parse(localStorage.getItem("responses") || "{}");
sendToGoogleForm(savedResponses);
} else {
alert("❌ Merci de compléter tous les champs obligatoires avant d’envoyer.");
}
});
