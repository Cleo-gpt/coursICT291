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
const formulaire = document.getElementById("proposer");

formulaire.addEventListener("submit", function (event) {
  event.preventDefault();
  const donnees = new FormData(formulaire);
  const nom = donnees.get("nom").trim();
  const quartier = donnees.get("quartier").trim();

  const erreurs = [];
  if (nom.length < 2) {
    erreurs.push("Le nom doit avoir au moins 2 caractères.");
  }
  if (quartier === "") {
    erreurs.push("Indiquez le quartier.");
  }

  const zoneErreurs = document.getElementById("erreurs");
  if (erreurs.length > 0) {
    zoneErreurs.textContent = "Erreur : " + erreurs.join(" ");
    return;
  }
  zoneErreurs.textContent = "";

  tousLesLieux.unshift({
    id: tousLesLieux.length + 1,
    nom: nom,
    quartier: quartier,
    ouvert: true,
    bruit: 3,
    resume: "Proposé par un visiteur, à vérifier.",
    horaire: "À confirmer"
  });
  afficherLieux(tousLesLieux);
  formulaire.reset();
});
