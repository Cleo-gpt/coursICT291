# Mes cartes

Une ligne par texte écrit à la main dans **une** carte de votre `index.html` (semaine 9). Prenez les étiquettes dans `etiquettes.md` (semaine 10).

Page de Prisme qui montre les cartes : `manifs.html` (écran Manifs).

## La carte

Élément et classe de la carte entière (par exemple `article.carte`, ou `li` puis `a.carte`) :

`li` puis `article.carte-bloc.manif`

## Ce qu'elle montre

| Texte écrit à la main | Étiquette de `data.json` qui le remplace | Élément et classe |
| --- | --- | --- |
| 13 | `date` (le jour : "2026-06-13" → 13) | `p.bloc-date` > `strong` |
| juin | `date` (le mois : "2026-06-13" → juin) | `p.bloc-date` > `span` |
| Marche des fiertés | `titre` | `div.manif-corps` > `h2` |
| 14h00 | `heure` ("14:00" → 14h00) | `p.petite-info` |
| Place de la Riponne | `lieu` | `p.petite-info` (même ligne, après « · ») |
| Lausanne | `ville` | `p.petite-info` (même ligne, après la virgule) |
| marche | `type` | `ul.etiquettes` > `li` (le premier) |
| 2026-06-13-lausanne (dans `data-agenda`) | `date` + `ville` sans accent ni majuscule | `button.btn-secondaire.btn-petit` |

Le bouton « Ajouter à l'agenda » reste le même texte pour toutes les cartes ; il devient « Dans mon agenda ✓ » quand la manif est dans l'agenda de la personne connectée.

## Les étiquettes vrai ou faux

Pour chaque étiquette qui vaut `true` ou `false` : le texte et la classe à montrer dans chaque cas.

| Étiquette | Si `true` : texte, classe | Si `false` : texte, classe |
| --- | --- | --- |
| `accesPmr` | « accès PMR », un `li` de plus dans `ul.etiquettes` (pas de classe) | rien : pas de `li` |

## Le conteneur

L'élément qui contient toutes les cartes, et l'`id` que vous lui donnez :

`ul.liste-manifs`, avec `id="liste-cartes"`. Juste au-dessus : `<p id="etat" role="status"></p>`.

## La carte copiée (étape 3)

```html
<li>
  <article class="carte-bloc manif">
    <p class="bloc-date"><strong>13</strong><span>juin</span></p>
    <div class="manif-corps">
      <h2>Marche des fiertés</h2>
      <p class="petite-info">14h00 · Place de la Riponne, Lausanne</p>
      <ul class="etiquettes"><li>marche</li><li>accès PMR</li></ul>
    </div>
    <button type="button" class="btn-secondaire btn-petit" data-agenda="2026-06-13-lausanne" aria-pressed="false" disabled>Ajouter à l'agenda</button>
  </article>
</li>
```
