# Google Apps Script – Collecte complète + rendu équipe

## Objectif
Créer une collecte **complète** des réponses et produire automatiquement des onglets lisibles:
- `RAW_Submissions` : payload JSON complet
- `Fiches_Equipes` : 1 ligne par équipe / soumission
- `Details_Tests` : détail de tous les tests par zone
- `Stats_Zones` : pourcentages par zone/type
- `Dashboard` : indicateurs globaux
- `Rendu_Equipes` : fiche visuelle détaillée par équipe, proche de la maquette Canva

Le script accepte aussi les réponses Google Forms déjà liées au Sheet lorsque l'onglet contient:
- `Horodateur`
- `Répondant` avec le JSON complet du questionnaire

## Installation web app
1. Ouvrir un Google Sheet vide ou le Sheet lié au formulaire.
2. Extensions → Apps Script.
3. Coller le contenu de `Code.gs` dans l'éditeur Apps Script.
   - Si tu veux récupérer uniquement la version complète dédiée au rendu visuel, le même code est aussi fourni dans `Code-rendu-equipes.gs`.
4. Déployer → Nouveau déploiement → **Application Web**.
   - Exécuter en tant que: **Moi**
   - Qui a accès: **Toute personne ayant le lien**
5. Copier l'URL `/exec`.

## Côté front (`script.js`)
Renseigner:
```js
const APPS_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/XXX/exec";
```

## Utilisation avec Google Forms
Si les réponses arrivent dans l'onglet `Form_Responses` avec le JSON dans la colonne `Répondant`:

1. Coller `Code.gs` dans Apps Script.
2. Vérifier les constantes si besoin:
   ```js
   SHEETS.formResponses = 'Form_Responses';
   FORM_RESPONSE_CONFIG.timestampHeader = 'Horodateur';
   FORM_RESPONSE_CONFIG.payloadHeader = 'Répondant';
   ```
3. Enregistrer le projet Apps Script puis recharger le Google Sheet.
4. Générer le rendu une première fois avec l'une des deux méthodes suivantes:
   - méthode recommandée: dans le Google Sheet, ouvrir le menu `Rendu équipes` puis cliquer sur `Générer / reconstruire le rendu`;
   - méthode alternative: dans Apps Script, choisir la fonction courte `genererRenduEquipes` dans la liste déroulante puis cliquer sur `Exécuter`.
5. Optionnel: créer un déclencheur installable sur `onFormSubmit` pour ajouter automatiquement une fiche à chaque nouvelle réponse.

> Si un e-mail indique `Script function not found: doGet`, cela signifie généralement qu'un ancien déclencheur ou un déploiement essaie d'appeler `doGet`. Le fichier fournit maintenant une fonction `doGet` neutre pour éviter cette erreur, mais le rendu doit être lancé via `genererRenduEquipes` ou le menu `Rendu équipes`.

## Rendu généré
Pour chaque équipe, `Rendu_Equipes` génère:
- un bloc structure: club, niveau, kinésithérapeute, préparateur physique;
- chaque zone anatomique cochée;
- les sous-parties dynamiques selon les réponses: force, mobilité, proprioception/équilibre, questionnaires, cognition, oculaire, vestibulaire, autres données;
- les évaluations transversales: saut, course, global MI, global MS, combat;
- les questions communes: limites/barrières et éléments qui guident les choix.

Le rendu est dynamique: si une équipe coche plus ou moins d'items, le tableau ajoute ou ignore automatiquement les lignes/blocs correspondants.
