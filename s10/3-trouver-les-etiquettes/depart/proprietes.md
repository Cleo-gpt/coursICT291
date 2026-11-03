# Les étiquettes de la location d'instruments

Une ligne par information. La première ligne est un exemple pour une bibliothèque : ne la recopiez pas.

| Étiquette | Écran | Sert à | Sorte de valeur | Unique ? | Exemple |
| nom | liste | afficher | texte | non | "Violon 3/4" |
| famille | liste | afficher, filtrer | texte | non | "cordes","vents", "percussions" |
| prixMois | liste | afficher | nombre | non | 25 |
| taille | detail | afficher | texte | non | "enfant", "adultes" |
| description | detail | afficher | texte | non | "Avec étui et archet" |
| disponible | (aucun) | filtrer | vrai/faux | non | true |
| id | (aucun) | (aucunm il sert à distinguer les fichiers) | vrai/faux | oui | 1 |

Ce qu'on peut écrire :

- **Écran** : Liste ou Détail
- **Sert à** : afficher, filtrer ou trier
- **Sorte de valeur** : texte, nombre ou vrai/faux
- **Unique ?** : oui ou non

Pourquoi le nom de l'instrument ne suffit pas à distinguer les fiches (une phrase) :

Il y a deux "Violon 3/4" qui ont le même nom et tout ensemble.. Seul l'id, 1 et 2, permet de les distinguer. » La fiche exige que la phrase cite les deux « Violon 3/4 ».

Suggestion de l'IA que j'ai refusée, et pourquoi :

Suggestion de l'IA refusée : par exemple marque, numeroSerie, dateRetour ou nomEleve. On les refuse parce qu'aucune ne s'affiche, ne filtre ou ne trie dans le brief. nomEleve serait en plus une donnée personnelle.