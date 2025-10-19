// ------------------------------
// script.js
// Logique du questionnaire interactif
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
const zonesCheckboxes = document.querySelectorAll("#zones input[type='checkbox']");
const zoneQuestionsContainer = document.getElementById("zoneQuestions");
const submitBtn = document.getElementById("submitBtn");
const resultMessage = document.getElementById("resultMessage");

const lowerBodyZones = ["Hanche", "Genou", "Cheville / Pied"];
const upperBodyZones = ["Tête", "Rachis cervical", "Épaule", "Coude", "Poignet / Main", "Rachis lombaire"];

// Stockage des réponses
let responses = {};

// Lorsqu'une zone est cochée
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

// Crée la section dynamique d'une zone
function createZoneSection(zoneName) {
const section = document.createElement("div");
section.classList.add("subcard");
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
<label><input type="checkbox" value="Force"> Force</label>
<label><input type="checkbox" value="Mobilité"> Mobilité</label>
${lowerBodyZones.includes(zoneName) ? `
<label><input type="checkbox" value="Sauts"> Sauts</label>
<label><input type="checkbox" value="Course"> Course</label>` : ""}
<label><input type="checkbox" value="Force Max"> Force Max</label>
<label><input type="checkbox" value="Proprioception / Équilibre"> Proprioception / Équilibre</label>
<label><input type="checkbox" value="Questionnaires"> Questionnaires</label>
<label><input type="checkbox" value="Autres données"> Autres données</label>
</div>

<div class="subquestions" id="sub-${zoneName.replace(/\s+/g, "-")}"></div>
`;
zoneQuestionsContainer.appendChild(section);

// Gérer les sous-questions selon les choix
const typeCheckboxes = section.querySelectorAll(".types input[type='checkbox']");
const subQContainer = section.querySelector(".subquestions");

typeCheckboxes.forEach(cb => {
cb.addEventListener("change", () => {
if (cb.checked) {
const subSection = createSubQuestion(zoneName, cb.value);
subQContainer.appendChild(subSection);
} else {
const existing = subQContainer.querySelector(`#sub-${zoneName}-${cb.value}`);
if (existing) subQContainer.removeChild(existing);
}
});
});
}

// Supprimer une section
function removeZoneSection(zoneName) {
const section = document.getElementById(`section-${zoneName.replace(/\s+/g, "-")}`);
if (section) section.remove();
}

// Créer un sous-menu en fonction du type de test
function createSubQuestion(zoneName, type) {
const div = document.createElement("div");
div.classList.add("nested");
div.id = `sub-${zoneName}-${type}`;
let content = "";

switch (type) {
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
`;
break;

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
`;
break;

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
</div>
`;
break;

case "Course":
content = `
<h4>Course – ${zoneName}</h4>
<label>Quels tests de course utilisez-vous ?</label>
<div class="checkbox-group">
<label><input type="checkbox" value="Sprint 10m"> Sprint 10m</label>
<label><input type="checkbox" value="Sprint 20m"> Sprint 20m</label>
<label><input type="checkbox" value="Vmax"> Vmax</label>
<label><input type="checkbox" value="Yoyo"> Yoyo</label>
<label><input type="checkbox" value="Bronco"> Bronco</label>
</div>
`;
break;

default:
content = `<p>Aucune sous-question spécifique pour ${type}.</p>`;
}

div.innerHTML = content;
return div;
}

// Soumission du questionnaire
submitBtn.addEventListener("click", () => {
resultMessage.textContent = "✅ Merci ! Vos réponses ont bien été enregistrées.";
resultMessage.style.color = "#0074d9";
window.scrollTo({ top: 0, behavior: "smooth" });
});
});
// ------------------------------
// BARRE DE PROGRESSION
// ------------------------------
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const formSections = document.querySelectorAll(".card");

function updateProgress() {
const filled = [...formSections].filter(sec => sec.querySelector("input:checked")).length;
const total = formSections.length;
const percent = Math.min(100, Math.round((filled / total) * 100));
progressBar.style.width = percent + "%";
progressText.textContent = `Progression : ${percent}%`;
}

// Met à jour à chaque clic
document.addEventListener("change", updateProgress);
