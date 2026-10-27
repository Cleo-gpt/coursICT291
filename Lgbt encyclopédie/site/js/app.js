// s9 : laissez ce fichier presque vide.
// s11 : vous collerez ici la recette fetch (e3-3).
// Ne créez pas un deuxième fichier JS. Ne passez pas en type="module".
//
// function async + fetch : voir e3-3 / recettes.js

// ---------- Comptes : serveur PHP + MySQL (dossier api/) ----------
// Le site doit être ouvert par MAMP (http://localhost:8888), pas en double-cliquant le fichier.
const API = "api/compte.php";

// sessionStorage est vidé à la fermeture de l'onglet → déconnexion automatique
const CLE_SESSION = "prisme-session";
const CLE_CHECKLIST = "prisme-checklist";

// ---------- Données du site ----------

const PRINTS = {
  j01: "Gay", j02: "Lesbienne", j03: "Bisexuel·le", j04: "Polysexuel·le", j05: "Pansexuel·le",
  j06: "Omnisexuel·le", j07: "Skoliosexuel·le", j08: "Demisexuel·le", j09: "Graysexuel·le", j10: "Asexuel·le",
  j11: "Polyamorie", j12: "Intersexe", j13: "Transfem", j14: "Transmasc", j15: "Agenre",
  j16: "Genderfluid", j17: "Bigenre", j18: "Trigenre", j19: "Pangenre", j20: "Genderqueer",
  j21: "Demi-girl", j22: "Demi-boy", j23: "Androgyne", j24: "Intergenre", j25: "Non-binaire",
  j26: "En questionnement", j27: "Homoromantique", j28: "Biromantique", j29: "Panromantique", j30: "Aromantique"
};

// Illustrations déjà publiées (le dernier jour = print de la semaine)
const IMAGES = {
  j01: "01-gay.jpg", j02: "02-lesbienne.jpg", j03: "03-bisexuel.jpg", j04: "04-polysexuel.jpg",
  j05: "05-pansexuel.jpg", j06: "06-omnisexuel.jpg", j07: "07-skoliosexuel.jpg", j08: "08-demisexuel.jpg"
};

const MANIFS = {
  "2026-05-17-geneve": { titre: "Rassemblement contre l’homophobie et la transphobie", date: "di 17.05 · 18h", lieu: "Genève" },
  "2026-06-13-lausanne": { titre: "Marche des fiertés", date: "sa 13.06 · 14h", lieu: "Lausanne" },
  "2026-06-20-geneve": { titre: "Marche des fiertés", date: "sa 20.06 · 13h", lieu: "Genève" },
  "2026-06-28-fribourg": { titre: "Rassemblement Stonewall", date: "di 28.06 · 17h", lieu: "Fribourg" }
};

const etat = {
  session: null, // jeton de session donné par le serveur
  profil: null,
  favoris: new Set(),
  pays: new Set(),
  agenda: new Map() // id de la manif → rappel la veille (true/false)
};

// ---------- Stockage (peut être bloqué en navigation privée) ----------

function lireStockage(stockage, cle) {
  try {
    return JSON.parse(stockage.getItem(cle));
  } catch (erreur) {
    return null;
  }
}

function ecrireStockage(stockage, cle, valeur) {
  try {
    if (valeur === null) {
      stockage.removeItem(cle);
    } else {
      stockage.setItem(cle, JSON.stringify(valeur));
    }
  } catch (erreur) {
    // tant pis : ça ne durera que le temps de la page
  }
}

// ---------- Appel au serveur avec fetch ----------

async function api(action, donnees = {}) {
  const corps = Object.assign({ action: action }, donnees);
  if (etat.session) {
    corps.jeton = etat.session;
  }

  let reponse;
  try {
    reponse = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps)
    });
  } catch (erreur) {
    throw new Error("Impossible de joindre le serveur. Ouvre le site avec MAMP (http://localhost:8888).");
  }

  let resultat = null;
  try {
    resultat = await reponse.json();
  } catch (erreur) {
    resultat = null;
  }

  if (!reponse.ok || resultat === null) {
    if (reponse.status === 401 && etat.session) {
      oublierSession();
      afficherCompte();
    }
    throw new Error(resultat && resultat.erreur ? resultat.erreur : "Le serveur ne répond pas correctement. MAMP est-il démarré ?");
  }
  return resultat;
}

function appliquerDonnees(resultat) {
  etat.profil = resultat.profil;
  etat.favoris = new Set(resultat.favoris);
  etat.pays = new Set(resultat.pays);
  etat.agenda = new Map(resultat.agenda.map(function (ligne) { return [ligne.manif, ligne.rappel]; }));
}

function oublierSession() {
  etat.session = null;
  etat.profil = null;
  etat.favoris.clear();
  etat.pays.clear();
  etat.agenda.clear();
  ecrireStockage(sessionStorage, CLE_SESSION, null);
}

// ---------- Fenêtre de connexion ----------

const fenetre = document.querySelector("#fenetre-connexion");

function afficherVue(nom) {
  fenetre.querySelectorAll("[data-vue]").forEach(function (vue) {
    vue.hidden = vue.dataset.vue !== nom;
  });
  fenetre.querySelectorAll("[data-erreur]").forEach(function (zone) {
    zone.hidden = true;
  });
  const champ = fenetre.querySelector('[data-vue="' + nom + '"] input, [data-vue="' + nom + '"] button');
  if (champ) {
    champ.focus();
  }
}

function ouvrirFenetre(nom) {
  if (!fenetre.open) {
    fenetre.showModal();
  }
  afficherVue(nom);
}

function afficherMessage(titre, texte) {
  fenetre.querySelector("[data-message-titre]").textContent = titre;
  fenetre.querySelector("[data-message-texte]").textContent = texte;
  ouvrirFenetre("message");
}

function montrerErreur(formulaire, message) {
  const zone = formulaire.querySelector("[data-erreur]");
  zone.textContent = message;
  zone.hidden = false;
}

function montrerStatut(formulaire, message) {
  formulaire.querySelector("[data-erreur]").hidden = true;
  formulaire.querySelector(".message-statut").textContent = message;
}

// Désactive le bouton pendant l'envoi pour éviter les doubles clics
async function pendantEnvoi(formulaire, action) {
  const bouton = formulaire.querySelector('[type="submit"]');
  bouton.disabled = true;
  try {
    await action();
  } catch (erreur) {
    montrerErreur(formulaire, erreur.message);
  } finally {
    bouton.disabled = false;
  }
}

document.querySelector("#formulaire-connexion").addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const email = formulaire.querySelector("#connexion-email").value.trim();
  const motDePasse = formulaire.querySelector("#connexion-mdp").value;

  if (email === "" || motDePasse === "") {
    montrerErreur(formulaire, "Indique ton adresse e-mail et ton mot de passe.");
    return;
  }
  pendantEnvoi(formulaire, async function () {
    const resultat = await api("connexion", { email: email, mdp: motDePasse });
    etat.session = resultat.jeton;
    ecrireStockage(sessionStorage, CLE_SESSION, etat.session);
    appliquerDonnees(resultat);
    formulaire.reset();
    fenetre.close();
    afficherCompte();
    remplirProfil();
  });
});

document.querySelector("#formulaire-inscription").addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const pseudo = formulaire.querySelector("#inscription-pseudo").value.trim();
  const champEmail = formulaire.querySelector("#inscription-email");
  const motDePasse = formulaire.querySelector("#inscription-mdp").value;

  if (pseudo.length < 2 || pseudo.length > 30) {
    montrerErreur(formulaire, "Ton pseudo doit faire entre 2 et 30 caractères.");
    return;
  }
  if (champEmail.value.trim() === "" || !champEmail.checkValidity()) {
    montrerErreur(formulaire, "Cette adresse e-mail n'est pas valide.");
    return;
  }
  if (motDePasse.length < 8) {
    montrerErreur(formulaire, "Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }
  pendantEnvoi(formulaire, async function () {
    const resultat = await api("inscription", { pseudo: pseudo, email: champEmail.value.trim(), mdp: motDePasse });
    formulaire.reset();
    afficherMessage("Vérifie ta boîte mail", resultat.message);
  });
});

document.querySelector("#formulaire-oubli").addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const email = formulaire.querySelector("#oubli-email").value.trim();

  if (email === "") {
    montrerErreur(formulaire, "Indique ton adresse e-mail.");
    return;
  }
  pendantEnvoi(formulaire, async function () {
    const resultat = await api("oubli", { email: email });
    formulaire.reset();
    afficherMessage("E-mail envoyé", resultat.message);
  });
});

// ---------- Favoris, pays, agenda ----------

async function basculer(table, valeur, ensemble) {
  const resultat = await api("basculer", { table: table, valeur: valeur });
  if (resultat.actif) {
    ensemble.set ? ensemble.set(valeur, true) : ensemble.add(valeur);
  } else {
    ensemble.delete(valeur);
  }
  afficherCompte();
}

async function deconnecter() {
  try {
    await api("deconnexion");
  } catch (erreur) {
    // on se déconnecte quand même de ce côté
  }
  oublierSession();
  afficherCompte();
}

// Un seul écouteur pour tous les boutons de la page
document.addEventListener("click", async function (evenement) {
  const cible = evenement.target.closest("button");
  if (!cible) {
    return;
  }
  try {
    if (cible.id === "bouton-compte") {
      if (etat.session) {
        location.href = "mon-espace.html";
      } else {
        ouvrirFenetre("connexion");
      }
    } else if (cible.dataset.ouvrir) {
      ouvrirFenetre(cible.dataset.ouvrir);
    } else if (cible.dataset.vueCible) {
      afficherVue(cible.dataset.vueCible);
    } else if (cible.hasAttribute("data-fermer")) {
      fenetre.close();
    } else if (cible.hasAttribute("data-deconnexion")) {
      await deconnecter();
    } else if (cible.dataset.enregistrer) {
      await basculer("favoris", cible.dataset.enregistrer, etat.favoris);
    } else if (cible.dataset.pays) {
      await basculer("pays", cible.dataset.pays, etat.pays);
    } else if (cible.dataset.agenda) {
      await basculer("agenda", cible.dataset.agenda, etat.agenda);
    } else if (cible.dataset.retirerPays) {
      await basculer("pays", cible.dataset.retirerPays, etat.pays);
    } else if (cible.dataset.retirerAgenda) {
      await basculer("agenda", cible.dataset.retirerAgenda, etat.agenda);
    }
  } catch (erreur) {
    afficherMessage("Oups", erreur.message);
  }
});

document.addEventListener("change", async function (evenement) {
  const caseRappel = evenement.target.closest("[data-rappel]");
  if (!caseRappel) {
    return;
  }
  try {
    await api("rappel", { manif: caseRappel.dataset.rappel, rappel: caseRappel.checked });
    etat.agenda.set(caseRappel.dataset.rappel, caseRappel.checked);
  } catch (erreur) {
    caseRappel.checked = !caseRappel.checked;
    afficherMessage("Oups", erreur.message);
  }
});

// ---------- Affichage ----------

function creerElement(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte) element.textContent = texte;
  return element;
}

function creerImagePrint(jour) {
  const image = creerElement("img");
  image.src = "images/prints/" + IMAGES[jour];
  image.alt = "";
  image.draggable = false;
  return image;
}

function remplirAvatar(element, valeur) {
  element.replaceChildren();
  element.className = "avatar-rond grand";
  if (valeur && valeur.startsWith("carpe-")) {
    element.append(creerImagePrint("j" + valeur.slice(6)));
  } else {
    element.classList.add("avatar-" + (valeur || "arc-en-ciel"));
  }
}

function afficherCompte() {
  const connecte = etat.session !== null && etat.profil !== null;
  const pseudo = connecte ? etat.profil.pseudo : "";

  document.body.classList.toggle("connecte", connecte);
  document.querySelector("#bouton-compte").textContent = connecte ? "@" + pseudo : "Se connecter";
  document.querySelector("#bandeau-session").hidden = !connecte;
  document.querySelectorAll("[data-pseudo]").forEach(function (zone) { zone.textContent = "@" + pseudo; });
  document.querySelectorAll("[data-email]").forEach(function (zone) { zone.textContent = connecte ? etat.profil.email : ""; });

  // Boutons actifs seulement une fois connecté·e
  document.querySelectorAll("[data-enregistrer]").forEach(function (bouton) {
    const actif = etat.favoris.has(bouton.dataset.enregistrer);
    bouton.disabled = !connecte;
    bouton.setAttribute("aria-pressed", actif ? "true" : "false");
    bouton.textContent = actif ? "Enregistré ✓" : "Enregistrer";
  });
  document.querySelectorAll("[data-pays]").forEach(function (bouton) {
    const actif = etat.pays.has(bouton.dataset.pays);
    bouton.disabled = !connecte;
    bouton.setAttribute("aria-pressed", actif ? "true" : "false");
    bouton.setAttribute("aria-label", (actif ? "Retirer " : "Ajouter ") + bouton.dataset.pays + (actif ? " de" : " à") + " mes pays favoris");
    bouton.textContent = actif ? "★" : "☆";
  });
  document.querySelectorAll("[data-agenda]").forEach(function (bouton) {
    const actif = etat.agenda.has(bouton.dataset.agenda);
    bouton.disabled = !connecte;
    bouton.setAttribute("aria-pressed", actif ? "true" : "false");
    bouton.textContent = actif ? "Dans mon agenda ✓" : "Ajouter à l'agenda";
  });

  afficherMonEspace(connecte);
}

function afficherMonEspace(connecte) {
  const espace = document.querySelector("#espace-connecte");
  if (!espace) {
    return;
  }
  document.querySelector("#espace-deconnecte").hidden = connecte;
  espace.hidden = !connecte;
  if (!connecte) {
    return;
  }

  remplirAvatar(document.querySelector("#avatar-profil"), etat.profil.avatar);

  // Print de la semaine : la dernière illustration publiée
  const jours = Object.keys(IMAGES);
  const dernier = jours[jours.length - 1];
  const lienSemaine = creerElement("a", "print-semaine");
  lienSemaine.href = "print.html#" + dernier;
  lienSemaine.append(creerImagePrint(dernier), creerElement("span", "", PRINTS[dernier] + " · " + Number(dernier.slice(1)) + " juin"));
  document.querySelector("#print-semaine").replaceChildren(lienSemaine);

  // Prints favoris
  const listeFavoris = document.querySelector("#liste-favoris");
  listeFavoris.replaceChildren();
  Array.from(etat.favoris).sort().forEach(function (jour) {
    const lien = creerElement("a");
    lien.href = "print.html#" + jour;
    if (IMAGES[jour]) {
      lien.append(creerImagePrint(jour));
    }
    lien.append(creerElement("span", "visuellement-cache", PRINTS[jour] + ", " + Number(jour.slice(1)) + " juin"));
    const element = creerElement("li");
    element.append(lien);
    listeFavoris.append(element);
  });
  document.querySelector('[data-vide="favoris"]').hidden = etat.favoris.size > 0;

  // Pays favoris
  const listePays = document.querySelector("#liste-pays-favoris");
  listePays.replaceChildren();
  Array.from(etat.pays).sort().forEach(function (pays) {
    const bouton = creerElement("button", "lien-bouton", "Retirer");
    bouton.type = "button";
    bouton.dataset.retirerPays = pays;
    bouton.setAttribute("aria-label", "Retirer " + pays);
    const element = creerElement("li");
    element.append(creerElement("span", "", pays), bouton);
    listePays.append(element);
  });
  document.querySelector('[data-vide="pays"]').hidden = etat.pays.size > 0;

  // Agenda
  const listeAgenda = document.querySelector("#liste-agenda");
  listeAgenda.replaceChildren();
  etat.agenda.forEach(function (rappel, id) {
    const manif = MANIFS[id];
    if (!manif) {
      return;
    }
    const texte = creerElement("div");
    texte.append(creerElement("strong", "", manif.titre), creerElement("p", "petite-info", manif.date + " · " + manif.lieu));
    const caseRappel = creerElement("input");
    caseRappel.type = "checkbox";
    caseRappel.checked = rappel;
    caseRappel.dataset.rappel = id;
    const etiquette = creerElement("label", "ligne-case");
    etiquette.append(caseRappel, " Rappel la veille");
    const bouton = creerElement("button", "lien-bouton", "Retirer");
    bouton.type = "button";
    bouton.dataset.retirerAgenda = id;
    bouton.setAttribute("aria-label", "Retirer " + manif.titre + " de mon agenda");
    const element = creerElement("li");
    element.append(texte, etiquette, bouton);
    listeAgenda.append(element);
  });
  document.querySelector('[data-vide="agenda"]').hidden = etat.agenda.size > 0;
}

// ---------- Mon espace : profil et sécurité ----------

const formulaireProfil = document.querySelector("#profil");

function remplirProfil() {
  if (!formulaireProfil || !etat.profil) {
    return;
  }
  formulaireProfil.querySelector("#profil-pseudo").value = etat.profil.pseudo;
  formulaireProfil.querySelector("#profil-orientation").value = etat.profil.orientation || "";
  formulaireProfil.querySelector("#profil-ville").value = etat.profil.ville || "";
  formulaireProfil.querySelector("#profil-region").value = etat.profil.region || "";
  formulaireProfil.querySelector("#profil-alertes").checked = etat.profil.alertes_region;
  const avatar = formulaireProfil.querySelector('[name="avatar"][value="' + etat.profil.avatar + '"]');
  if (avatar) {
    avatar.checked = true;
  }
}

if (formulaireProfil) {
  formulaireProfil.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    const pseudo = formulaireProfil.querySelector("#profil-pseudo").value.trim();
    const avatar = formulaireProfil.querySelector('[name="avatar"]:checked');

    if (pseudo.length < 2 || pseudo.length > 30) {
      montrerErreur(formulaireProfil, "Ton pseudo doit faire entre 2 et 30 caractères.");
      return;
    }
    if (!confirm("Enregistrer les modifications de ton profil ?")) {
      return;
    }
    pendantEnvoi(formulaireProfil, async function () {
      const resultat = await api("profil", {
        pseudo: pseudo,
        avatar: avatar ? avatar.value : etat.profil.avatar,
        orientation: formulaireProfil.querySelector("#profil-orientation").value,
        ville: formulaireProfil.querySelector("#profil-ville").value.trim(),
        region: formulaireProfil.querySelector("#profil-region").value,
        alertes_region: formulaireProfil.querySelector("#profil-alertes").checked
      });
      appliquerDonnees(resultat);
      afficherCompte();
      // Orientation et ville ne changent qu'après le clic dans l'e-mail
      montrerStatut(formulaireProfil, resultat.attente
        ? "Enregistré ✓ Pour ton orientation et ta ville, confirme le changement dans l'e-mail qu'on vient de t'envoyer."
        : "Modifications enregistrées ✓");
    });
  });
}

const formulaireEmail = document.querySelector("#formulaire-email");
if (formulaireEmail) {
  formulaireEmail.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    const champ = formulaireEmail.querySelector("#nouvel-email");
    if (champ.value.trim() === "" || !champ.checkValidity()) {
      montrerErreur(formulaireEmail, "Cette adresse e-mail n'est pas valide.");
      return;
    }
    pendantEnvoi(formulaireEmail, async function () {
      const resultat = await api("changer_email", { email: champ.value.trim() });
      formulaireEmail.reset();
      montrerStatut(formulaireEmail, resultat.message);
    });
  });
}

const formulaireMdp = document.querySelector("#formulaire-mdp");
if (formulaireMdp) {
  document.querySelector("#bouton-code").addEventListener("click", async function () {
    try {
      const resultat = await api("demander_code");
      formulaireMdp.querySelector('[data-etape="code"]').hidden = true;
      formulaireMdp.querySelector('[data-etape="nouveau"]').hidden = false;
      montrerStatut(formulaireMdp, resultat.message);
      formulaireMdp.querySelector("#mdp-code").focus();
    } catch (erreur) {
      montrerErreur(formulaireMdp, erreur.message);
    }
  });

  formulaireMdp.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    const code = formulaireMdp.querySelector("#mdp-code").value.trim();
    const nouveau = formulaireMdp.querySelector("#mdp-nouveau").value;
    const confirmation = formulaireMdp.querySelector("#mdp-confirmation").value;

    if (code === "") {
      montrerErreur(formulaireMdp, "Indique le code reçu par e-mail.");
      return;
    }
    if (nouveau.length < 8) {
      montrerErreur(formulaireMdp, "Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveau !== confirmation) {
      montrerErreur(formulaireMdp, "Les deux mots de passe ne sont pas identiques.");
      return;
    }
    pendantEnvoi(formulaireMdp, async function () {
      const resultat = await api("changer_mdp", { code: code, mdp: nouveau });
      formulaireMdp.reset();
      formulaireMdp.querySelector('[data-etape="code"]').hidden = false;
      formulaireMdp.querySelector('[data-etape="nouveau"]').hidden = true;
      montrerStatut(formulaireMdp, resultat.message);
    });
  });

  document.querySelector("#bouton-supprimer").addEventListener("click", async function () {
    if (!confirm("Supprimer définitivement ton compte et toutes tes données ? Cette action est irréversible.")) {
      return;
    }
    try {
      const resultat = await api("supprimer_compte");
      oublierSession();
      afficherCompte();
      afficherMessage("Compte supprimé", resultat.message);
    } catch (erreur) {
      afficherMessage("Oups", erreur.message);
    }
  });
}

// ---------- Page de confirmation (lien reçu par e-mail) ----------
// Il faut toucher un bouton : certaines messageries ouvrent les liens toutes seules pour les vérifier.

const pageConfirmation = document.querySelector("#confirmation");
if (pageConfirmation) {
  const parametres = new URLSearchParams(location.search);
  const type = parametres.get("type");
  const lien = parametres.get("jeton");
  const refus = parametres.get("refus") === "1";
  const statut = pageConfirmation.querySelector(".message-statut");
  const boutonConfirmer = document.querySelector("#bouton-confirmer");
  const formulaireReset = document.querySelector("#formulaire-reset");

  const TEXTES = {
    inscription: ["Confirme ton adresse", "Touche le bouton pour activer ton compte.", "Activer mon compte"],
    email: ["Confirme ta nouvelle adresse", "Touche le bouton pour utiliser cette adresse e-mail sur ton compte.", "Confirmer cette adresse"],
    modif: ["Confirmer une modification", "Tu t'apprêtes à changer un paramètre non obligatoire de ton profil. Est-ce bien toi ?", "Oui, c'est bien moi"],
    refus: ["Ce n'est pas toi ?", "On annule la modification, on déconnecte tous les appareils et on t'envoie un lien pour choisir un nouveau mot de passe.", "Annuler la modification"],
    reset: ["Nouveau mot de passe", "Choisis ton nouveau mot de passe.", ""]
  };
  const cle = type === "modif" && refus ? "refus" : type;

  function afficherTexte(titre, texte) {
    pageConfirmation.querySelector("[data-titre]").textContent = titre;
    pageConfirmation.querySelector("[data-texte]").textContent = texte;
  }

  function terminer(message) {
    afficherTexte("C'est fait", message);
    boutonConfirmer.hidden = true;
    formulaireReset.hidden = true;
    statut.textContent = "";
  }

  if (!TEXTES[cle] || !lien) {
    afficherTexte("Lien incomplet", "Ce lien n'est pas valable. Ouvre-le directement depuis l'e-mail reçu.");
  } else {
    afficherTexte(TEXTES[cle][0], TEXTES[cle][1]);
    if (type === "reset") {
      formulaireReset.hidden = false;
    } else {
      boutonConfirmer.textContent = TEXTES[cle][2];
      boutonConfirmer.hidden = false;
    }
  }

  boutonConfirmer.addEventListener("click", async function () {
    boutonConfirmer.disabled = true;
    try {
      const resultat = await api("confirmer", { type: type, lien: lien, refus: refus });
      terminer(resultat.message);
    } catch (erreur) {
      statut.textContent = erreur.message;
      boutonConfirmer.disabled = false;
    }
  });

  formulaireReset.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    const nouveau = formulaireReset.querySelector("#reset-mdp").value;
    if (nouveau.length < 8) {
      montrerErreur(formulaireReset, "Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveau !== formulaireReset.querySelector("#reset-confirmation").value) {
      montrerErreur(formulaireReset, "Les deux mots de passe ne sont pas identiques.");
      return;
    }
    pendantEnvoi(formulaireReset, async function () {
      const resultat = await api("confirmer", { type: "reset", lien: lien, mdp: nouveau });
      terminer(resultat.message);
    });
  });
}

// ---------- Checklist de manif (sur cet appareil, sans compte) ----------

const casesChecklist = document.querySelectorAll("[data-checklist]");
if (casesChecklist.length > 0) {
  const cochees = lireStockage(localStorage, CLE_CHECKLIST) || [];
  casesChecklist.forEach(function (caseACocher) {
    caseACocher.checked = cochees.includes(caseACocher.dataset.checklist);
    caseACocher.addEventListener("change", function () {
      const liste = Array.from(casesChecklist)
        .filter(function (c) { return c.checked; })
        .map(function (c) { return c.dataset.checklist; });
      ecrireStockage(localStorage, CLE_CHECKLIST, liste);
    });
  });
}

// ---------- Démarrage ----------

async function demarrer() {
  etat.session = lireStockage(sessionStorage, CLE_SESSION);
  if (etat.session) {
    try {
      appliquerDonnees(await api("moi"));
    } catch (erreur) {
      oublierSession();
    }
  }
  afficherCompte();
  remplirProfil();
}

demarrer();
