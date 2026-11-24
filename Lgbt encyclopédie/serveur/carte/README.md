# Carte du monde et données ILGA (page Voyager)

Ces scripts refont les deux fichiers que lit la page Voyager :

- `site/pays.json` : un objet par pays (code ISO, nom français, niveau 1 à 4, et trois faits ILGA traduits) ;
- `site/images/carte-monde.svg` : la carte, avec un `<path id="pays-CA" data-nom="Canada">` par pays.

Ils ne sont **pas** nécessaires pour faire tourner le site : seulement pour mettre à jour la carte ou les données.

## Mettre à jour les données ILGA

ILGA World met sa base à jour plusieurs fois par an (date « Updated as of » sur chaque page).

```
cd "Lgbt encyclopédie/serveur/carte"
npm install                       # la première fois
npx playwright install chromium   # la première fois
npm run ilga                      # télécharge les données dans donnees-ilga/
npm run pays                      # refait site/pays.json
```

Puis, sur la page Voyager, change la date dans la fiche
(`Source : ILGA World Database · données de juin 2026`) et sous la légende (« Comment les couleurs sont choisies »).

Si `npm run pays` signale une **catégorie ILGA sans traduction**, ajoute-la dans les tables
`CRIMINALISATION`, `COUPLES` ou `EXPRESSION` de `generer-pays.mjs`.

## Les règles des couleurs (dans `generer-pays.mjs`, fonction `niveau`)

| Niveau | Couleur | Règle |
| --- | --- | --- |
| 4 · zone à risque | rouge | relations entre personnes de même sexe criminalisées (loi ou faits, ou dans une partie du territoire) |
| 3 · vigilance renforcée | orange | pas criminalisées, mais obstacles légaux à la liberté d'expression (explicites ou non) |
| 1 · accueil favorable | vert | mariage ouvert aux couples de même sexe |
| 2 · vigilance normale | jaune | tous les autres |

## Refaire la carte

```
npm run carte
```

Frontières : Natural Earth 1:110m (domaine public), paquet `world-atlas`.
La carte est centrée à 11° Est pour que la Russie ne soit pas coupée en deux.
La **Crimée** est rattachée à l'Ukraine (frontière reconnue par l'ONU et la Suisse) : Natural Earth la dessine
avec la Russie, qui l'occupe depuis 2014. Les fiches de l'Ukraine et de la Russie le précisent
(tableau `NOTES` dans `generer-pays.mjs`).
Les noms français viennent du paquet `i18n-iso-countries` ; les noms raccourcis sont dans `noms.mjs`.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `extraire-ilga.mjs` | ouvre trois pages d'ILGA dans Chromium et enregistre leurs données (le site ILGA ne s'affiche qu'avec JavaScript) |
| `generer-pays.mjs` | fabrique `site/pays.json` à partir de `donnees-ilga/` |
| `generer-carte.mjs` | fabrique `site/images/carte-monde.svg` |
| `noms.mjs` | noms français des pays, partagés par les deux générateurs |

`node_modules/` et `donnees-ilga/` ne sont pas dans le dépôt (voir `.gitignore`) : ils se refont avec les commandes ci-dessus.
