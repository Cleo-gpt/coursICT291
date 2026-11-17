// Phare : affichage des cartes, déjà fait, comme en semaine 11.
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

// ----- Votre code de la semaine 12 commence ici -----
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

const champRecherche = document.getElementById("recherche");
const boutonOuvert = document.getElementById("filtre-ouvert");
let seulementOuverts = false;

boutonOuvert.addEventListener("click", function () {
  seulementOuverts = !seulementOuverts;
  boutonOuvert.setAttribute("aria-pressed", seulementOuverts);
  appliquerFiltres();
});

champRecherche.addEventListener("input", function () {
  appliquerFiltres();
});