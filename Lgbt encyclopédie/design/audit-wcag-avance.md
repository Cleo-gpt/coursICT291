# Audit d'accessibilité avancé — WCAG 2.2 AA (e2-8)

Composant audité : le formulaire « Votre adresse courriel » fourni dans la fiche.

```html
<div style="background:#f8fafc; padding:20px;">
  <label style="color:#94a3b8; font-size:14px;">Votre adresse courriel</label>
  <input type="text" style="border:1px solid #e2e8f0; background:#ffffff; outline:none; padding:4px 6px;">
  <span style="color:#ef4444; font-size:12px;">Erreur</span>
  <button style="background:#e0e7ff; color:#6366f1; border:none; padding:4px 8px; font-size:12px; cursor:pointer;">Valider</button>
</div>
```

## Les 4 problèmes

| # | Problème | Mesure | Minimum | Conforme ? |
|---|---|---|---|---|
| 1 | Label gris clair `#94a3b8` sur `#f8fafc` | **2.45:1** | 4.5:1 | ❌ |
| 2 | `outline:none` sur le champ | aucun contour au focus | contour ≥ 2px, contraste ≥ 3:1 | ❌ |
| 3 | Bouton « Valider » trop petit | environ **56 × 22 px** | 24 × 24 px (idéal 48 × 48) | ❌ |
| 4 | Erreur signalée seulement en rouge | rouge `#ef4444` = **3.6:1**, aucune icône, aucune explication | texte ≥ 4.5:1 + pas que la couleur | ❌ |

Autres défauts trouvés en plus :
- Bordure du champ `#e2e8f0` sur blanc : **1.23:1**, alors qu'il faut 3:1. On ne voit presque pas le champ.
- Texte du bouton `#6366f1` sur `#e0e7ff` : **3.63:1**, alors qu'il faut 4.5:1.
- Le `<label>` n'est pas relié au champ (pas de `for` / `id`), donc un lecteur d'écran ne sait pas à quoi sert le champ.
- `type="text"` au lieu de `type="email"` : le clavier du téléphone n'affiche pas le `@`.

### Explications

1. **Label :** à 2.45:1, une personne malvoyante, ou qui lit au soleil, ne voit pas le texte.
2. **`outline:none` :** une personne qui navigue au clavier (touche Tab) ne sait pas où elle se trouve. C'est comme une souris dont le curseur serait invisible : elle est bloquée.
3. **Taille du bouton :** police de 12px + 4px de marge en haut et en bas ≈ 22px de haut. C'est trop petit pour un doigt, on rate le bouton.
4. **Erreur en rouge :** une personne daltonienne rouge-vert voit le mot « Erreur » en gris-brun. Elle ne comprend pas qu'il y a un problème, ni quoi corriger.

## Code corrigé

```html
<style>
  :root {
    --fond: #f8fafc;
    --texte: #1e293b;        /* 13.98:1 sur le fond */
    --bordure: #64748b;      /* 4.76:1 sur blanc */
    --focus: #4338ca;        /* 7.9:1 sur blanc */
    --erreur: #b91c1c;       /* 6.2:1 sur le fond */
    --bouton: #4338ca;
    --bouton-texte: #ffffff; /* 7.9:1 */
  }
  .champ { background: var(--fond); padding: 20px; display: flex; flex-direction: column; gap: 8px; }
  .champ label { color: var(--texte); font-size: 16px; }
  .champ input {
    min-height: 48px; padding: 10px 12px; font-size: 16px;
    border: 2px solid var(--bordure); border-radius: 6px; background: #fff;
  }
  .champ input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .champ input[aria-invalid="true"] { border-color: var(--erreur); }
  .erreur { color: var(--erreur); font-size: 14px; }
  .champ button {
    min-height: 48px; min-width: 48px; padding: 12px 20px; font-size: 16px;
    background: var(--bouton); color: var(--bouton-texte); border: none; border-radius: 6px; cursor: pointer;
  }
  .champ button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>

<div class="champ">
  <label for="courriel">Votre adresse courriel</label>
  <input id="courriel" type="email" autocomplete="email"
         aria-invalid="true" aria-describedby="courriel-erreur">
  <p id="courriel-erreur" class="erreur" role="alert">
    ⚠️ Erreur : l'adresse doit contenir un @ (ex. : nom@exemple.ch).
  </p>
  <button type="submit">Valider</button>
</div>
```

Ce qui a changé :
- **Contrastes :** toutes les couleurs dépassent 4.5:1 pour le texte et 3:1 pour la bordure.
- **Focus :** contour de 3px bien visible quand on arrive avec Tab.
- **Bouton :** 48px de haut au minimum.
- **Erreur :** une icône ⚠️ + le mot « Erreur » + une explication. Elle ne repose plus sur la couleur seule.
- **Label relié au champ** (`for="courriel"`), et `type="email"`.

## Vérification

- [ ] **Contrastes vérifiés à la pipette** (DevTools → inspecter → cliquer sur la couleur).
- [ ] **Test clavier :** avec Tab, on passe du champ au bouton et le contour est visible.
- [ ] **Lighthouse lancé** (DevTools → Lighthouse → Accessibilité). Score noté : [ ] / 100
