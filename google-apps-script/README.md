# Google Apps Script – Collecte complète + rendu équipe

## Objectif
Créer une collecte **complète** des réponses et produire automatiquement des onglets lisibles:
- `RAW_Submissions` : payload JSON complet
- `Fiches_Equipes` : 1 ligne par équipe / soumission
- `Details_Tests` : détail de tous les tests par zone
- `Stats_Zones` : pourcentages par zone/type
- `Dashboard` : indicateurs globaux
- `Rendu_Equipes` : sommaire des fiches générées
- `Equipe - <club>` : un onglet individuel par équipe, avec la fiche visuelle détaillée proche de la maquette Canva

Le script accepte aussi les réponses Google Forms déjà liées au Sheet lorsque l'onglet contient:
- `Horodateur`
- `Répondant` avec le JSON complet du questionnaire

## Installation web app
1. Ouvrir un Google Sheet vide ou le Sheet lié au formulaire.
2. Extensions → Apps Script.
3. Coller le contenu de `Code.gs` dans l'éditeur Apps Script.
   - Si tu veux récupérer uniquement la version complète dédiée au rendu visuel, le même code est aussi fourni dans `Code-rendu-equipes.gs`.
   - Important: merger le fichier sur GitHub ne met pas automatiquement à jour le projet Apps Script attaché au Sheet. Il faut aussi copier/coller ou pousser ce code dans l'éditeur Apps Script, puis enregistrer.
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

> Si un e-mail indique `Script function not found: doGet`, cela signifie généralement que le projet Apps Script réellement attaché au Sheet n'a pas encore reçu la dernière version du code, ou qu'un ancien déclencheur `open` pointe vers `doGet`. Le fichier fournit maintenant une fonction `doGet` neutre pour éviter cette erreur, mais le rendu doit être lancé via `genererRenduEquipes` ou le menu `Rendu équipes`. Dans Apps Script > Déclencheurs, supprimer tout déclencheur `open` associé à `doGet`; le menu est géré par `onOpen` automatiquement.


## Dépannage: onglet `Rendu_Equipes` tout bleu
Si l'onglet `Rendu_Equipes` apparaît mais reste vide ou entièrement bleu, cela veut dire que le script s'est lancé mais n'a trouvé aucune réponse exploitable.

À vérifier dans cet ordre:
1. L'onglet de réponses contient au moins une ligne sous les en-têtes.
2. Une colonne s'appelle `Répondant` et contient le JSON complet du questionnaire.
3. Le JSON commence par `{` et contient au minimum des clés comme `club`, `niveau`, `zones_details`.
4. Si l'onglet de réponses ne s'appelle pas `Form_Responses`, le script essaie maintenant de le détecter automatiquement grâce à la colonne `Répondant`.

Quand aucune réponse exploitable n'est trouvée, `Rendu_Equipes` affiche désormais un bloc d'aide au lieu de rester bleu vide.

## Rendu généré
Le rendu génère:
- un onglet individuel `Equipe - <club>` par équipe;
- un bloc structure: club, niveau, kinésithérapeute, préparateur physique;
- chaque zone anatomique cochée;
- les sous-parties dynamiques selon les réponses: force, mobilité, proprioception/équilibre, questionnaires, cognition, oculaire, vestibulaire, autres données;
- les détails des champs `Autre` / autres précisions quand ils sont renseignés;
- les évaluations transversales: saut, course, global MI, global MS, combat;
- les questions communes: limites/barrières et éléments qui guident les choix.

Le rendu est dynamique: si une équipe coche plus ou moins d'items, le tableau ajoute ou ignore automatiquement les lignes, colonnes et blocs vides pour éviter les cases inutiles.
