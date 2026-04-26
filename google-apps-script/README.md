# Google Apps Script – Collecte complète + Google Sheets exploitable

## Objectif
Créer une collecte **complète** des réponses et produire automatiquement des onglets lisibles:
- `RAW_Submissions` : payload JSON complet
- `Fiches_Equipes` : 1 ligne par équipe / soumission
- `Details_Tests` : détail de tous les tests par zone
- `Stats_Zones` : pourcentages par zone/type
- `Dashboard` : indicateurs globaux

## Installation
1. Ouvrir un Google Sheet vide.
2. Extensions → Apps Script.
3. Coller le contenu de `Code.gs` dans l'éditeur Apps Script.
4. Déployer → Nouveau déploiement → **Application Web**.
   - Exécuter en tant que: **Moi**
   - Qui a accès: **Toute personne ayant le lien**
5. Copier l'URL `/exec`.

## Côté front (`script.js`)
Renseigner:
```js
const APPS_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/XXX/exec";
```

## Résultat attendu
À chaque envoi du formulaire:
- Création d'une fiche équipe
- Détails par zone et type de tests
- Mise à jour automatique des stats par zone (% sur total zone)
- Dashboard de synthèse
