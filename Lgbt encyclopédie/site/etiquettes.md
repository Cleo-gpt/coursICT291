# Mes étiquettes

Projet : Prisme — les manifestations (écran Manifs, `manifs.html`)

Une ligne par étiquette. Chaque étiquette, sauf `id`, doit servir à afficher, filtrer ou trier sur au moins un écran de votre brief (méthode en 6 questions, exercice 3).

| Étiquette | Écran du brief qui l'affiche | Sert à (afficher, filtrer, trier) | Sorte de valeur (texte, nombre, vrai/faux) | Unique ? | Exemple |
| --- | --- | --- | --- | --- | --- |
| `id` | aucun | distinguer les fiches | nombre | oui | 1 |
| `titre` | Manifs (carte) | afficher | texte | non | "Marche des fiertés" |
| `date` | Manifs (carte, bloc date) | afficher, trier | texte | non | "2026-06-13" |
| `heure` | Manifs (carte) | afficher | texte | non | "14:00" |
| `lieu` | Manifs (carte) | afficher | texte | non | "Place de la Riponne" |
| `ville` | Manifs (carte) | afficher | texte | non | "Lausanne" |
| `region` | Manifs (boutons de filtre) | filtrer | texte | non | "Suisse romande" |
| `type` | Manifs (étiquette de la carte) | afficher | texte | non | "marche" |
| `accesPmr` | Manifs (étiquette « accès PMR ») | afficher | vrai/faux | non | true |

Valeurs autorisées, écrites toujours de la même façon (sinon le filtre casse en semaine 12) :

- `region` : "Suisse romande", "Suisse alémanique" ou "Tessin"
- `type` : "marche" ou "rassemblement"
- `date` : année-mois-jour, pour que le tri par date marche
- `heure` : heures:minutes sur 24 h

Étiquettes refusées : `latitude`/`longitude` (la carte n'est encore qu'une image d'attente), `organisateur` et `contact` (pas affichés, et ce pourraient être des données personnelles).
