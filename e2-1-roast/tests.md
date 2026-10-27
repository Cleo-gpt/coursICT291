# Tests utilisateurs — Prisme (e2-7)

> ✏️ Ce fichier se remplit **pendant le test avec un·e camarade**. Remplace les `[ ]`.
> Règle d'or : pendant le test, tu te tais. Tu n'aides pas, tu n'expliques pas. C'est le site qu'on teste, pas la personne.

> ⚠️ **Exemple fictif** : les réponses ci-dessous sont imaginées à partir des maquettes de la piste D. Remplace-les par ce que Zackarie dit et fait vraiment pendant le test.

## Infos

- **App testée :** Prisme, piste D (`design/propositions/html/piste-d/index.html`)
- **Testeur·euse :** Zackarie
- **Observateur·trice :** [ton prénom]
- **Persona :** Emilie, 23 ans, étudiante, engagée, cherche les manifs proches de chez elle.

## Scénario (1 phrase à lire au testeur)

> « Tu habites à Lausanne. Trouve la prochaine manif près de chez toi et ajoute-la à ton agenda. »

Chrono : 5 minutes maximum.

---

## 1. Test 5 secondes

Montre la page d'accueil 5 secondes, cache-la, puis demande : « C'est une appli pour quoi ? »

- **Réponse du testeur :** « C'est une appli pour suivre le mois des fiertés, avec un calendrier et une image par jour. »
- **Écart avec ce qu'on voulait :** il a bien compris que c'est un site LGBTQIA+ (bande arc-en-ciel, « Mois des fiertés »), mais il le voit surtout comme un calendrier d'illustrations. Il n'a pas remarqué le bloc « À venir près de toi » ni le Dico.

## 2. Test de localisation

Consigne : « Montre-moi où tu cliquerais pour **voir les manifs**. »

- **Le doigt est allé au bon endroit :** à côté, puis oui
- **Hésitation :** environ 4 secondes. Il a d'abord cliqué sur le 13 du calendrier, qui ouvre le print du jour et pas la manif. Ensuite, il a trouvé « Manifs » dans le menu du haut.
- **Dit à voix haute :** « Je pensais que les dates du calendrier montraient les événements. Ah, c'est “Manifs” en haut. »
- **J'ai aidé :** non

> 📱 Remarque : sur mobile, la barre du bas (Calendrier, Prints, Dico, Voyager, Moi) **n'a pas d'onglet Manifs**. Sur téléphone, Zackarie n'aurait pu passer que par le bloc « À venir près de toi ».

## 3. Déroulé de la tâche complète

| | Ce que j'ai noté |
|---|---|
| Temps total | 95 secondes |
| Tâche réussie ? | oui, mais avec un doute à la fin |
| Hésitations (regard perdu, mauvais clics) | clic sur le 13 du calendrier au lieu de « Manifs » ; sur la page Manifs, il s'est arrêté sur la carte « 17 mai, Genève », placée entre le 13 et le 20 juin parce que la liste n'est pas triée par date ; il a cliqué deux fois sur « Ajouter à l'agenda » |
| Phrases dites à voix haute | « Le filtre Suisse romande est activé mais je vois quand même Zurich ? » · « Le 17 mai, c'est avant ou après ? » · « J'ai cliqué… c'est ajouté ou pas ? » |

> 💡 À surveiller : quand on clique sur « Ajouter à l'agenda », le site **n'affiche aucune confirmation** (vérifié dans le code de `manifs.html`). Note si le testeur se demande si ça a marché.
>
> ➡️ Oui : Zackarie a recliqué parce que rien n'a changé à l'écran. Autre point vérifié dans `js/app.js` : les boutons de région changent d'état mais **ne filtrent pas la liste**, ce qui explique pourquoi Zurich restait affiché.

## 4. Contraste du bouton principal

| Bouton | Texte | Fond | Ratio | Minimum | OK ? |
|---|---|---|---|---|---|
| « Ouvrir le print » | `#ffffff` | `#6b3fd4` | **6.39:1** | 4.5:1 | ✅ |

## 5. Deux corrections prioritaires

> Remplis-les **à partir de ce que tu as vu pendant le test**.

1. **Avant :** rien ne se passe au clic sur « Ajouter à l'agenda », et Zackarie a cliqué deux fois. **Après :** le bouton devient « ✓ Ajouté » avec un message de confirmation.
2. **Avant :** sur la page Manifs, la liste n'est pas triée par date et le filtre « Suisse romande » ne cache pas Zurich. **Après :** les manifs sont triées de la plus proche à la plus lointaine, le filtre cache vraiment les autres régions, et un onglet « Manifs » est ajouté dans la barre mobile.

---

## 6. Témoignage du testeur

**Zackarie, testeur · scénario « manif à Lausanne »**

> « En arrivant, j'ai tout de suite vu que c'était un site LGBTQIA+, avec la bande arc-en-ciel et le “Mois des fiertés”. Mais pour moi, c'était surtout un calendrier avec une image par jour.
>
> Pour trouver la manif, j'ai d'abord cliqué sur le 13 juin dans le calendrier, parce que je pensais que les dates montraient les événements. Ça m'a ouvert une illustration. Ensuite, j'ai vu “Manifs” dans le menu du haut.
>
> Sur la page Manifs, la marche de Lausanne était en premier, donc c'était facile. Par contre, la liste n'est pas dans l'ordre : il y a un 17 mai entre deux dates de juin. Et le bouton “Suisse romande” était activé, mais je voyais quand même Zurich.
>
> Au moment d'ajouter la manif à l'agenda, rien ne s'est passé à l'écran. J'ai recliqué une deuxième fois parce que je ne savais pas si ça avait marché.
>
> Ce que j'ai aimé : les couleurs, le bloc “Y aller en sécurité” et le bouton “Sortie rapide”. Je ne me suis jamais senti perdu. »

- **Ce qui a plu :** l'identité visuelle, le bouton principal bien lisible, les conseils de sécurité, la sortie rapide.
- **Ce qui a bloqué :** les dates du calendrier ne mènent pas aux manifs, la liste n'est pas triée, le filtre ne filtre pas, et il n'y a aucune confirmation après « Ajouter à l'agenda ».
