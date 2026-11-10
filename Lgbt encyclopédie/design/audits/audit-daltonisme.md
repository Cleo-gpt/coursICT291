# Audit daltonisme — Prisme, piste D (s08-av1)

**Pourquoi :** environ 8 % des hommes et 0,5 % des femmes sont daltoniens. Une information donnée **seulement par une couleur** leur devient invisible.

**Comment tester :** ouvrir `design/propositions/html/piste-d/` dans Chrome → DevTools (F12) → menu ⋮ → *More tools* → **Rendering** → *Emulate vision deficiencies* → essayer les 3 profils.

> Les résultats ci-dessous viennent d'une simulation des couleurs du code (`css/themes.css`). Vérifie-les dans DevTools et coche la dernière colonne.

## Résultats

| Élément | Info donnée par la couleur ? | Deutéranopie (vert) | Protanopie (rouge) | Tritanopie (bleu) | Vérifié DevTools |
|---|---|---|---|---|---|
| **Niveaux de vigilance** (page Voyager : vert / jaune / orange / rouge) | Oui, mais le **texte** est écrit à côté (« accueil favorable », « zone à risque »…) | ⚠️ vert et rouge deviennent deux bruns presque pareils (ratio 1.21) | ⚠️ difficiles à distinguer (2.19) | ⚠️ difficiles à distinguer (1.48) | [ ] |
| **Point « manif »** dans le calendrier | Non : c'est une **forme** (un point), pas une couleur | ✅ visible | ✅ visible | ✅ visible | [ ] |
| **Couleurs des cases** du calendrier | Non, c'est seulement décoratif | ✅ | ✅ | ✅ | [ ] |
| **Barres de couleur** à côté des manifs | Non, décoratif | ✅ | ✅ | ✅ | [ ] |
| **Page active du menu** | Non : elle est **soulignée** | ✅ | ✅ | ✅ | [ ] |
| **Interrupteurs** (Mon espace) | Oui : violet = activé, lavande pâle = désactivé | ⚠️ « désactivé » est presque invisible sur blanc (1.46:1) | ⚠️ idem | ⚠️ idem | [ ] |

## Bilan

- ✅ **Bonne nouvelle :** les niveaux de vigilance ont toujours leur nom écrit en texte, donc l'information n'est pas perdue.
- ⚠️ **À améliorer :** sur la carte du monde (pas encore dessinée), il n'y aura **que** des couleurs. Une personne daltonienne ne pourra pas savoir si un pays est sûr.
- ⚠️ **À améliorer :** les interrupteurs n'indiquent « oui / non » que par la couleur.

## Corrections

1. **Carte et légende de Voyager :** ajouter une icône à chaque niveau, en plus de la couleur.
   - ✓ accueil favorable · ● vigilance normale · ▲ vigilance renforcée · ⛔ zone à risque
2. **Interrupteurs :** écrire « Activé » / « Désactivé » à côté, et donner une bordure foncée à l'état éteint (contraste ≥ 3:1).
3. **Règle pour la suite :** toute couleur qui veut dire quelque chose doit être accompagnée d'un texte, d'une icône ou d'une forme.


Les couleurs changent mais le site reste assez similaire.