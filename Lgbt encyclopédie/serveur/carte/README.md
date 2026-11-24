# Carte du monde et données ILGA (page Voyager)

Ces scripts refont les deux fichiers que lit la page Voyager :

- `site/pays.json` : un objet par pays (code ISO, nom français, niveau 1 à 4, faits ILGA traduits, attitudes, sécurité) ;
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

## Ce que contient chaque fiche pays

| Partie de la fiche | Source | Données |
| --- | --- | --- |
| Niveau, cadre légal | ILGA World | criminalisation, couples, liberté d'expression |
| Attitudes et société | Williams Institute (UCLA), *Global Acceptance Index* | score sur 10 et rang sur 175 pays, moyenne des sondages 2017-2020 |
| Sécurité au quotidien | ILGA World | application de la loi (pays qui criminalisent), obstacles aux associations, lois sur les crimes de haine |
| Conseil de Prisme | Prisme | un conseil général par niveau (tableau `CONSEILS` dans `generer-pays.mjs`) : ce n'est pas une donnée ILGA |
| Lien « fiche complète » | ILGA World | `https://database.ilga.org/<pays>-lgbti` |

### Le tableau du Williams Institute

`sources/acceptation-williams-2017-2020.csv` recopie le tableau A.2 (« Ranking countries and locations by their average
LGBTI Acceptance Index score in 2017-2020 », pages 33-34) du rapport
[*Social Acceptance of LGBTI People in 175 Countries and Locations, 1981 to 2020*](https://williamsinstitute.law.ucla.edu/publications/global-acceptance-index-lgbt/)
(A. R. Flores, novembre 2021). Colonnes : rang, nom anglais, code ISO, score.
Trois territoires n'ont pas de code ISO (Chypre du Nord, Haut-Karabakh, Somaliland) et ne sont pas affichés.

Si une nouvelle édition paraît, remplace ce fichier par le nouveau tableau (mêmes colonnes) et lance `npm run pays`.
La phrase de la fiche (« sondages 2017-2020 ») est dans la fonction `attitudes` de `generer-pays.mjs`.

## Les règles des couleurs (dans `generer-pays.mjs`, fonction `niveau`)

| Niveau | Couleur | Règle |
| --- | --- | --- |
| 4 · zone à risque | rouge | relations entre personnes de même sexe criminalisées (loi ou faits, ou dans une partie du territoire) |
| 3 · vigilance renforcée | orange | pas criminalisées, mais obstacles légaux à la liberté d'expression (explicites ou non) |
| 1 · accueil favorable | vert | mariage ouvert aux couples de même sexe |
| 2 · vigilance normale | jaune | tous les autres |

## Les zones (boutons au-dessus de la carte)

Comme les cartes « Conseils aux voyageurs » : Afrique, Afrique du Nord et Moyen-Orient, Amériques, Asie et Océanie, Europe.

- **Zone de chaque pays** (`zone` dans `pays.json`) : d'après les régions d'ILGA, dans `generer-pays.mjs`.
  La région « SWANA » d'ILGA devient « Afrique du Nord et Moyen-Orient », sauf la Mauritanie, le Soudan,
  Djibouti et l'Érythrée, rangés avec l'Afrique (tableau `ZONES_AJUSTEES`). La Turquie, la Russie et le Caucase sont en Europe.
- **Cadrage de chaque zone** : tableau `ZONES` dans `generer-carte.mjs` (longitudes et latitudes ouest, sud, est, nord).
  Il est enregistré dans la carte : `<svg data-vue-europe="398 50 245 126" …>`, que `app.js` utilise pour zoomer.

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
| `extraire-ilga.mjs` | ouvre cinq pages d'ILGA dans Chromium et enregistre leurs données (le site ILGA ne s'affiche qu'avec JavaScript) |
| `generer-pays.mjs` | fabrique `site/pays.json` à partir de `donnees-ilga/` |
| `generer-carte.mjs` | fabrique `site/images/carte-monde.svg` |
| `noms.mjs` | noms français des pays, partagés par les deux générateurs |
| `sources/acceptation-williams-2017-2020.csv` | scores d'acceptation du Williams Institute (voir plus haut) |

`node_modules/` et `donnees-ilga/` ne sont pas dans le dépôt (voir `.gitignore`) : ils se refont avec les commandes ci-dessus.
