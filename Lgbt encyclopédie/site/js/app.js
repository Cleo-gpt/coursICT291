// s9 : laissez ce fichier presque vide.
// s11 : vous collerez ici la recette fetch (e3-3).
// Ne créez pas un deuxième fichier JS. Ne passez pas en type="module".
//
// function async + fetch : voir e3-3 / recettes.js

// ---------- Connexion avec Instagram (nom d'utilisateur seulement) ----------
// Pas de mot de passe : le pseudo est gardé dans ce navigateur (localStorage).

const CLE_PSEUDO = "prisme-pseudo-insta";
const CLE_ENREGISTRES = "prisme-prints-enregistres";
const FORMAT_PSEUDO = /^[A-Za-z0-9._]{1,30}$/; // règles des noms Instagram

// localStorage peut être bloqué (navigation privée…) : on ne plante pas
function lire(cle) {
  try {
    return localStorage.getItem(cle);
  } catch (erreur) {
    return null;
  }
}

function ecrire(cle, valeur) {
  try {
    if (valeur === null) {
      localStorage.removeItem(cle);
    } else {
      localStorage.setItem(cle, valeur);
    }
  } catch (erreur) {
    // tant pis, la connexion ne durera que le temps de la page
  }
}

function lireEnregistres() {
  try {
    return JSON.parse(lire(CLE_ENREGISTRES)) || [];
  } catch (erreur) {
    return [];
  }
}

const fenetre = document.querySelector("#fenetre-connexion");
const boutonCompte = document.querySelector("#bouton-compte");
const formulaire = document.querySelector("#formulaire-connexion");
const champPseudo = document.querySelector("#pseudo-insta");
const erreurConnexion = document.querySelector("#erreur-connexion");

// Met toute la page à jour selon qu'on est connecté·e ou non
function afficherCompte() {
  const pseudo = lire(CLE_PSEUDO);
  const enregistres = lireEnregistres();

  document.body.classList.toggle("connecte", pseudo !== null);
  boutonCompte.textContent = pseudo ? "@" + pseudo : "Se connecter avec Instagram";
  fenetre.querySelector(".etat-deconnecte").hidden = pseudo !== null;
  fenetre.querySelector(".etat-connecte").hidden = pseudo === null;
  fenetre.querySelector("[data-pseudo]").textContent = "@" + pseudo;

  // Le bouton « Enregistrer » ne marche que connecté·e
  document.querySelectorAll("[data-enregistrer]").forEach(function (bouton) {
    const dejaEnregistre = enregistres.includes(bouton.dataset.enregistrer);
    bouton.disabled = pseudo === null;
    bouton.setAttribute("aria-pressed", pseudo !== null && dejaEnregistre ? "true" : "false");
    bouton.textContent = pseudo !== null && dejaEnregistre ? "Enregistré ✓" : "Enregistrer";
  });
}

boutonCompte.addEventListener("click", function () {
  erreurConnexion.hidden = true;
  fenetre.showModal();
});

fenetre.querySelectorAll("[data-fermer]").forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    fenetre.close();
  });
});

formulaire.addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  const pseudo = champPseudo.value.trim().replace(/^@/, "");

  if (!FORMAT_PSEUDO.test(pseudo)) {
    erreurConnexion.textContent = "Ton nom d'utilisateur ne peut contenir que des lettres, des chiffres, des points et des tirets bas (30 caractères au maximum).";
    erreurConnexion.hidden = false;
    champPseudo.focus();
    return;
  }

  ecrire(CLE_PSEUDO, pseudo);
  formulaire.reset();
  fenetre.close();
  afficherCompte();
});

document.querySelector("#bouton-deconnexion").addEventListener("click", function () {
  ecrire(CLE_PSEUDO, null);
  fenetre.close();
  afficherCompte();
});

// ---------- Enregistrer un print (seulement si connecté·e) ----------

document.querySelectorAll("[data-enregistrer]").forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    const jour = bouton.dataset.enregistrer;
    let enregistres = lireEnregistres();

    if (enregistres.includes(jour)) {
      enregistres = enregistres.filter(function (j) {
        return j !== jour;
      });
    } else {
      enregistres.push(jour);
    }
    ecrire(CLE_ENREGISTRES, JSON.stringify(enregistres));
    afficherCompte();
  });
});

// ---------- Partager en story Instagram ----------
// Sur téléphone : le menu de partage s'ouvre avec l'image, on choisit Instagram → Story.
// Sinon (ordinateur, ou partage impossible) : le lien ouvre le compte de l'artiste.

document.querySelectorAll("[data-partager]").forEach(function (lien) {
  lien.addEventListener("click", async function (evenement) {
    if (!lien.dataset.image || !navigator.canShare) {
      return; // le lien s'ouvre normalement
    }
    evenement.preventDefault();

    try {
      const reponse = await fetch(lien.dataset.image);
      const image = await reponse.blob();
      const fichier = new File([image], lien.dataset.image.split("/").pop(), { type: image.type });

      if (!navigator.canShare({ files: [fichier] })) {
        throw new Error("partage de fichier impossible");
      }
      await navigator.share({
        files: [fichier],
        title: lien.dataset.titre,
        text: lien.dataset.titre + " · @la_lanterne_de_yuna"
      });
    } catch (erreur) {
      if (erreur.name !== "AbortError") {
        window.open(lien.href, "_blank", "noopener");
      }
    }
  });
});

afficherCompte();
