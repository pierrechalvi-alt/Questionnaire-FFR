# Questionnaire FFR

Application web statique pour collecter les pratiques d'évaluation pré-saison / retour au jeu.

## Arborescence recommandée

```text
.
├── index.html
├── style.css
├── script.js
├── assets/
│   └── logo-ffr.png
└── google-apps-script/
    ├── Code.gs
    └── README.md
```

## Vérifications rapides

- Vérifier la syntaxe JavaScript : `node --check script.js`
- Ouvrir `index.html` dans un navigateur pour un test manuel.

## Flux de données

1. L'utilisateur remplit le questionnaire dans `index.html`.
2. `script.js` construit et valide le payload.
3. Soumission vers Google Forms (`formResponse`).
4. Le script Apps Script (`google-apps-script/Code.gs`) structure les réponses dans Google Sheets.
