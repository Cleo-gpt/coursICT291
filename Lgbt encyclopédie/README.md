# Prisme — encyclopédie LGBTQIA+ (projet ICT 291)

Calendrier du mois des fiertés, prints, dico, manifs et conseils voyage.

```
Lgbt encyclopédie/
├── site/                  Le site en ligne (racine MAMP / hébergement)
│   ├── index.html         L'accueil (point d'entrée du site)
│   ├── pages/             Les autres pages : manifs, preparer-manif, dico, prints,
│   │                      print, voyager, ressources, mon-espace, confirmer
│   ├── data.json          Les 30 fiches de manifs (s10), lues par fetch (s11)
│   ├── pays.json          Les pays de Voyager et leur niveau (ILGA World, voir serveur/carte/)
│   ├── etiquettes.md      Étiquettes de data.json (s10)
│   ├── mes-cartes.md      Carte HTML ↔ étiquettes (s11)
│   ├── css/style.css      Styles (piste D, polices Nunito)
│   ├── app.js             Le seul fichier JS (à la racine, fiche s11) : comptes, cartes depuis data.json…
│   ├── images/            Illustrations (prints/ = une par jour de juin, JPEG
│   │                      d'origine en pleine qualité, à ne pas compresser)
│   └── api/               Serveur PHP des comptes (seul compte.php est public)
├── serveur/               Mise en place MySQL : GUIDE.md + schema.sql
│   └── carte/             Scripts qui refont pays.json (ILGA World) et la carte de Voyager
├── design/
│   ├── wireframes/        Wireframes (.dc.html + support.js, à garder ensemble)
│   │                      + 01-accueil-mobile.png, 02-recherche-filtre.png,
│   │                      03-detail-mobile.png (export e2-4, version grise)
│   ├── tests-utilisateurs.md  Fiche du test utilisateur (e2-7), à remplir pendant le test
│   ├── propositions/      Les 4 pistes graphiques (images + maquettes HTML)
│   ├── critique.md        Critique des 4 pistes
│   └── audits/            Daltonisme, eCH-0059, WCAG avancé
└── documents/
    ├── consignes/         Fiches du cours (PDF)
    └── idees/             Idée de départ, croquis, notes manuscrites
```

`data.json`, `etiquettes.md` et `mes-cartes.md` restent à côté de `index.html` : c'est ce que demandent les fiches s10 et s11.

Dans `app.js`, les chemins passent par `adresse("…")`, qui part de la racine du site :
le même code marche depuis `index.html` et depuis `pages/`.

## Recherche, filtre et formulaire (s12)

- **Accueil** : la recherche porte sur les étiquettes `titre` et `ville`, avec ou sans accents. Un mot absent affiche un message.
- **Manifs** : les boutons de région filtrent sur l'étiquette `region` (« Toutes » par défaut).
- **Proposer une manif** (page Manifs) : nom, ville et date. Le formulaire vide affiche ses erreurs dans `#erreurs`, sans `alert`.

Les fiches ajoutées par le formulaire restent affichées jusqu'au rechargement de la page : il n'y a pas de serveur pour les enregistrer.

## Suggestions au clavier (s13)

Sous la recherche de l'accueil, jusqu'à 5 titres ou villes sont proposés. ↓ et ↑ pour les parcourir, Entrée pour choisir, Échap pour fermer. La recherche attend 200 ms après la dernière lettre.

## Micro-interactions

- Les boutons changent de couleur en douceur au survol et au clic, avec un halo lavande. Ils disent : « ceci se clique, je t'ai entendu·e ».
- Les cartes des manifs apparaissent en fondu, au chargement, à chaque recherche et à chaque filtre. Elles disent : « la liste a changé ».
- Les erreurs du formulaire « Proposer une manif » apparaissent en fondu. Elles disent : « regarde ici : il y a quelque chose à corriger ».

Les trois sont coupés quand l'appareil demande moins d'animations (`prefers-reduced-motion: reduce`, à la fin de `css/style.css`).
