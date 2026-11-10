# Prisme — encyclopédie LGBTQIA+ (projet ICT 291)

Calendrier du mois des fiertés, prints, dico, manifs et conseils voyage.

```
Lgbt encyclopédie/
├── site/                  Le site en ligne (racine MAMP / hébergement)
│   ├── index.html         L'accueil (point d'entrée du site)
│   ├── pages/             Les autres pages : manifs, preparer-manif, dico, prints,
│   │                      print, voyager, ressources, mon-espace, confirmer
│   ├── data.json          Les 30 fiches de manifs (s10), lues par fetch (s11)
│   ├── etiquettes.md      Étiquettes de data.json (s10)
│   ├── mes-cartes.md      Carte HTML ↔ étiquettes (s11)
│   ├── css/style.css      Styles (piste D, polices Nunito)
│   ├── js/app.js          Le seul fichier JS : comptes, cartes depuis data.json…
│   ├── images/            Illustrations (prints/ = une par jour de juin, JPEG
│   │                      d'origine en pleine qualité, à ne pas compresser)
│   └── api/               Serveur PHP des comptes (seul compte.php est public)
├── serveur/               Mise en place MySQL : GUIDE.md + schema.sql
├── design/
│   ├── wireframes/        Wireframes (.dc.html + support.js, à garder ensemble)
│   ├── propositions/      Les 4 pistes graphiques (images + maquettes HTML)
│   ├── critique.md        Critique des 4 pistes
│   └── audits/            Daltonisme, eCH-0059, WCAG avancé
└── documents/
    ├── consignes/         Fiches du cours (PDF)
    └── idees/             Idée de départ, croquis, notes manuscrites
```

`data.json`, `etiquettes.md` et `mes-cartes.md` restent à côté de `index.html` : c'est ce que demandent les fiches s10 et s11.

Dans `js/app.js`, les chemins passent par `adresse("…")`, qui part de la racine du site :
le même code marche depuis `index.html` et depuis `pages/`.
