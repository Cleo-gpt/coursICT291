// Phare : affichage des cartes, déjà fait, comme en semaine 11.
// Exercice 3 de la semaine 13 : vous écrivez à la fin de ce fichier.
// Les 30 fiches sont dans lieux.js, dans la variable tousLesLieux.

const conteneur = document.getElementById("liste-cartes");

// Montre une carte par fiche de la liste qu'on lui donne.
// Elle efface d'abord les cartes déjà affichées.
function afficherLieux(liste) {
  conteneur.textContent = "";

  for (const lieu of liste) {
    const carte = document.createElement("article");
    carte.className = "carte";

    const titre = document.createElement("h2");
    titre.textContent = lieu.nom;

    const quartier = document.createElement("p");
    quartier.className = "quartier";
    quartier.textContent = lieu.quartier;

    const etat = document.createElement("p");
    if (lieu.ouvert) {
      etat.className = "etat ouvert";
      etat.textContent = "Ouvert";
    } else {
      etat.className = "etat ferme";
      etat.textContent = "Fermé";
    }

    const bruit = document.createElement("p");
    bruit.textContent = "Bruit : " + lieu.bruit + " sur 5";

    carte.append(titre, quartier, etat, bruit);
    conteneur.append(carte);
  }
}

afficherLieux(tousLesLieux);

// Recherche et bouton « Ouvert maintenant » : faits en semaine 12, exercice 1.
const champRecherche = document.getElementById("recherche");
const boutonOuvert = document.getElementById("filtre-ouvert");
let seulementOuverts = false;

boutonOuvert.addEventListener("click", function () {
  seulementOuverts = !seulementOuverts;
  boutonOuvert.setAttribute("aria-pressed", seulementOuverts);
  appliquerFiltres();
});

function appliquerFiltres() {

  const texte = champRecherche.value.trim().toLowerCase();

  const resultats = tousLesLieux.filter(function (lieu) {
    const texteOk = lieu.nom.toLowerCase().includes(texte)
      || lieu.quartier.toLowerCase().includes(texte);
    const ouvertOk = seulementOuverts === false || lieu.ouvert === true;
    return texteOk && ouvertOk;
  });

  afficherLieux(resultats);
  document.getElementById("aucun-resultat").hidden = resultats.length > 0;
}

let minuteur;

champRecherche.addEventListener("input", function () {
  clearTimeout(minuteur);
 minuteur = setTimeout(function () {
  appliquerFiltres();
  afficherSuggestions();
}, 200);

});

const listeSuggestions = document.getElementById("suggestions");
let indexActif = -1;

function afficherSuggestions() {
  const texte = champRecherche.value.trim().toLowerCase();
  listeSuggestions.textContent = "";
  indexActif = -1;
  champRecherche.removeAttribute("aria-activedescendant");

  if (texte === "") {
    fermerSuggestions();
    return;
  }

  const trouves = tousLesLieux.filter(function (lieu) {
    return lieu.nom.toLowerCase().includes(texte);
  }).slice(0, 5);

  for (const lieu of trouves) {
    const option = document.createElement("li");
    option.id = "suggestion-" + lieu.id;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.textContent = lieu.nom;
    listeSuggestions.append(option);
  }

  const ouverte = trouves.length > 0;
  listeSuggestions.hidden = !ouverte;
  champRecherche.setAttribute("aria-expanded", ouverte);
}

function fermerSuggestions() {
  listeSuggestions.hidden = true;
  champRecherche.setAttribute("aria-expanded", "false");
  champRecherche.removeAttribute("aria-activedescendant");
  indexActif = -1;
}

function marquerActive() {
  const options = listeSuggestions.querySelectorAll("li");
  for (const option of options) {
    option.setAttribute("aria-selected", "false");
  }
  const active = options[indexActif];
  active.setAttribute("aria-selected", "true");
  champRecherche.setAttribute("aria-activedescendant", active.id);
}

function choisir(nom) {
  champRecherche.value = nom;
  appliquerFiltres();
  fermerSuggestions();
}

champRecherche.addEventListener("keydown", function (event) {
  if (listeSuggestions.hidden) {
    return;
  }
  const nombre = listeSuggestions.children.length;

  if (event.key === "Enter" && indexActif >= 0) {
  event.preventDefault();
  choisir(listeSuggestions.children[indexActif].textContent);
  }

  if (event.key === "Escape") {
  event.preventDefault();
  fermerSuggestions();
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    indexActif = Math.min(indexActif + 1, nombre - 1);
    marquerActive();
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    indexActif = Math.max(indexActif - 1, 0);
    marquerActive();
  }
});

listeSuggestions.addEventListener("click", function (event) {
  const option = event.target.closest("li");
  if (option) {
    choisir(option.textContent);
  }
});

