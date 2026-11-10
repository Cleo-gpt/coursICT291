# Les quatre états de Phare

Remplissez une ligne par test, avec ce que vous **voyez**, pas ce que vous attendiez. Recopiez les messages de la console tels quels, même en anglais.

| Test | Ce que montre la page | Ce que dit la console | Onglet Réseau : fichier et code |
| --- | --- | --- | --- |
| 1. `data.json`, réseau lent (3G) | « Chargement des lieux... » pendant quelques secondes, puis les 30 cartes, sans message | Rien (aucune ligne rouge) | `data.json` : 200 |
| 2. `data-absent.json`, sans `.catch` | « Chargement des lieux... » reste affiché, aucune carte | `Failed to load resource: the server responded with a status of 404 (Not Found)` puis `Unhandled Promise Rejection: SyntaxError: The string did not match the expected pattern.` | `data-absent.json` : 404 |
| 3. `data-absent.json`, avec `.catch` | « Impossible de charger les lieux. Rechargez la page dans un moment. » | `Failed to load resource: the server responded with a status of 404 (Not Found)` puis `SyntaxError: The string did not match the expected pattern.` (app.js:48) | `data-absent.json` : 404 |
| 4. `data-absent.json`, avec le contrôle `reponse.ok` | « Impossible de charger les lieux. Rechargez la page dans un moment. » | `Failed to load resource: the server responded with a status of 404 (Not Found)` puis `Error: Fichier introuvable : code 404` (app.js:49) | `data-absent.json` : 404 |
| 5. `casse.json` | « Impossible de charger les lieux. Rechargez la page dans un moment. » | `SyntaxError: JSON Parse error: Property name must be a string literal` | `casse.json` : 200 |
| 6. `vide.json`, avant le contrôle de la liste vide | Page vide sous le titre : ni carte, ni message | Rien (aucune ligne rouge) | `vide.json` : 200 |

## Deux questions

1. Dans quel test l'onglet Réseau dit-il `200` alors que la page échoue ? Pourquoi ?

   Réponse : Au test 5, avec `casse.json`. Le fichier existe, donc le serveur l'envoie et répond 200 : le contrôle `reponse.ok` le laisse passer. Mais son contenu n'est pas du JSON valide (une virgule en trop après `"horaire"`, ligne 27, juste avant `}`), donc `reponse.json()` échoue et c'est le `.catch` qui s'affiche. Le 200 dit seulement que le fichier est arrivé, pas qu'il est correct.

2. Au test 2, que devient le message « Chargement des lieux… » ? Qu'est-ce que la personne qui attend en conclut ?

   Réponse : Il reste affiché pour toujours, puisque rien ne vient le remplacer quand l'erreur arrive. La personne croit que la page charge encore et attend, ou pense que sa connexion est lente. Rien ne lui dit qu'il y a un problème ni qu'elle peut recharger la page.
