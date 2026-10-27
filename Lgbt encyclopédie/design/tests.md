# Tests utilisateurs — Prisme (e2-7)

> ✏️ Ce fichier se remplit **pendant le test avec un·e camarade**. Remplace les `[ ]`.
> Règle d'or : pendant le test, tu te tais. Tu n'aides pas, tu n'expliques pas. C'est le site qu'on teste, pas la personne.

## Infos

- **App testée :** Prisme, piste D (`design/propositions/html/piste-d/index.html`)
- **Testeur·euse :** [prénom du/de la camarade]
- **Observateur·trice :** [ton prénom]
- **Persona :** Emilie, 23 ans, étudiante, engagée, cherche les manifs proches de chez elle.

## Scénario (1 phrase à lire au testeur)

> « Tu habites à Lausanne. Trouve la prochaine manif près de chez toi et ajoute-la à ton agenda. »

Chrono : 5 minutes maximum.

---

## 1. Test 5 secondes

Montre la page d'accueil 5 secondes, cache-la, puis demande : « C'est une appli pour quoi ? »

- **Réponse du testeur :** « C'est une appli pour [ ] »
- **Écart avec ce qu'on voulait :** [ex. : aucun / il pense que c'est juste un calendrier d'images]

## 2. Test de localisation

Consigne : « Montre-moi où tu cliquerais pour **voir les manifs**. »

- **Le doigt est allé au bon endroit :** [oui / non / à côté]
- **Hésitation :** [ex. : 3 secondes, regarde d'abord le calendrier]
- **Dit à voix haute :** « [ ] »
- **J'ai aidé :** [oui / non]

## 3. Déroulé de la tâche complète

| | Ce que j'ai noté |
|---|---|
| Temps total | [ ] secondes |
| Tâche réussie ? | [oui / non / avec aide] |
| Hésitations (regard perdu, mauvais clics) | [ ] |
| Phrases dites à voix haute | « [ ] » |

> 💡 À surveiller : quand on clique sur « Ajouter à l'agenda », le site **n'affiche aucune confirmation** (vérifié dans le code de `manifs.html`). Note si le testeur se demande si ça a marché.

## 4. Contraste du bouton principal

| Bouton | Texte | Fond | Ratio | Minimum | OK ? |
|---|---|---|---|---|---|
| « Ouvrir le print » | `#ffffff` | `#6b3fd4` | **6.39:1** | 4.5:1 | ✅ |

## 5. Deux corrections prioritaires

> Remplis-les **à partir de ce que tu as vu pendant le test**.

1. **Avant :** [ce qui a posé problème] → **Après :** [ce que je change]
2. **Avant :** [ ] → **Après :** [ ]

> 💡 Exemple si le testeur a douté au moment d'ajouter la manif :
> **Avant :** rien ne se passe au clic sur « Ajouter à l'agenda ». **Après :** le bouton devient « ✓ Ajouté » avec un message de confirmation.
