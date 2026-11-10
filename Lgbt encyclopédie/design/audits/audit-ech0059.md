# Auto-audit eCH-0059 / WCAG AA — Prisme, piste D (s08-av2)

**Pourquoi :** en Suisse, les sites publics doivent respecter la norme **eCH-0059** (alignée sur WCAG 2.1 AA).
**Ce qui est audité :** les 8 pages de `design/propositions/html/piste-d/` (code HTML + CSS).

## Grille des 5 critères

| Critère | Ce qu'on vérifie | État | Preuve |
|---|---|---|---|
| **1.1.1** Contenus non textuels | Les images ont un texte alternatif | ✅ Conforme | Pas de `<img>`. Les zones d'image ont `role="img"` + `aria-label` (« Print du jour », « Carte du monde par niveau de vigilance »). Les décorations (logo, bande arc-en-ciel) ont `aria-hidden="true"`. |
| **1.4.3** Contraste minimal 4.5:1 | Le texte se lit bien | ✅ Conforme | Texte 14.4:1 · bouton 6.39:1 · menu 7.53:1 · petit texte gris 5.33:1 · liens 7.2:1. |
| **2.1.1** Clavier | Tout marche sans souris | ✅ Conforme | Liens, boutons et champs sont de vrais éléments HTML (`<a>`, `<button>`, `<input>`). Lien « Aller au contenu » au début de chaque page. |
| **2.4.7** Focus visible | On voit où on est avec Tab | ⚠️ Non conforme en partie | Contour violet de 3px : bien visible sur la page (5.75:1), mais **presque invisible dans le bandeau violet foncé du menu (2.07:1, minimum 3:1)**. |
| **3.3.1** Identification des erreurs | Les erreurs de formulaire sont expliquées | ➖ Non applicable | Il n'y a pas encore de formulaire avec une validation (seulement des recherches et des choix de pronoms). |

## Correctifs

| Problème | Correctif | Résultat attendu |
|---|---|---|
| Focus invisible dans le menu (2.07:1) | Dans le bandeau, le contour de focus devient jaune : `.site-header :focus-visible { outline-color: #f5d90a; }` | **9.33:1** ✅ |
| (pour plus tard) 3.3.1 | Quand il y aura un formulaire : message d'erreur en texte + icône, relié au champ avec `aria-describedby` | Conforme |

> Le correctif est **proposé**, pas encore appliqué dans le code. Quand tu l'appliques, change ⚠️ en ✅ dans la grille.

## Vérification

- [ ] Test clavier fait sur 2 pages (Tab de haut en bas) : [ ]
- [ ] Lighthouse lancé sur `index.html`, score accessibilité : [ ] / 100
