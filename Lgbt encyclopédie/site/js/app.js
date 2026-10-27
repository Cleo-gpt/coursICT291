// s9 : laissez ce fichier presque vide.
// s11 : vous collerez ici la recette fetch (e3-3).
// Ne créez pas un deuxième fichier JS. Ne passez pas en type="module".
//
// function async + fetch : voir e3-3 / recettes.js

// ---------- Configuration Supabase ----------
// À remplir avec les valeurs de ton projet : Supabase → Project Settings → API
// (voir supabase/GUIDE.md). La clé « anon » est publique, elle peut être dans le code.
const SUPABASE_URL = ""; // ex. "https://abcdefgh.supabase.co"
const SUPABASE_CLE = ""; // clé « anon public »
const COMPTES_ACTIFS = SUPABASE_URL !== "" && SUPABASE_CLE !== "";

// sessionStorage est vidé à la fermeture de l'onglet → déconnexion automatique
const CLE_SESSION = "prisme-session";
const CLE_RECUPERATION = "prisme-recuperation";
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
  session: null,
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

// ---------- Appels à Supabase avec fetch ----------

async function requete(chemin, options = {}) {
  const reponse = await fetch(SUPABASE_URL + chemin, {
    method: options.methode || "GET",
    headers: Object.assign({
      apikey: SUPABASE_CLE,
      "Content-Type": "application/json",
      Authorization: "Bearer " + (options.jeton || SUPABASE_CLE)
    }, options.entetes || {}),
    body: options.corps ? JSON.stringify(options.corps) : undefined
  });

  const texte = await reponse.text();
  let donnees = null;
  try {
    donnees = texte ? JSON.parse(texte) : null;
  } catch (erreur) {
    donnees = null;
  }

  if (!reponse.ok) {
    const message = donnees && (donnees.msg || donnees.error_description || donnees.message || donnees.error);
    const erreur = new Error(message || "Erreur " + reponse.status);
    erreur.code = donnees && (donnees.error_code || donnees.code);
    erreur.statut = reponse.status;
    throw erreur;
  }
  return donnees;
}

// Même chose, mais en tant que personne connectée (rafraîchit le jeton si besoin)
async function requeteConnectee(chemin, options = {}) {
  const session = await sessionValide();
  if (!session) {
    throw new Error("Ta session a expiré, reconnecte-toi.");
  }
  return requete(chemin, Object.assign({}, options, { jeton: session.access_token }));
}

function enregistrerSession(donnees, utilisateur) {
  etat.session = {
    access_token: donnees.access_token,
    refresh_token: donnees.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(donnees.expires_in || 3600),
    id: utilisateur.id,
    email: utilisateur.email
  };
  ecrireStockage(sessionStorage, CLE_SESSION, etat.session);
}

async function sessionValide() {
  const session = etat.session;
  if (!session) {
    return null;
  }
  if (Date.now() / 1000 < session.expires_at - 60) {
    return session;
  }
  try {
    const donnees = await requete("/auth/v1/token?grant_type=refresh_token", {
      methode: "POST",
      corps: { refresh_token: session.refresh_token }
    });
    enregistrerSession(donnees, donnees.user);
    return etat.session;
  } catch (erreur) {
    oublierSession();
    return null;
  }
}

function oublierSession() {
  etat.session = null;
  etat.profil = null;
  etat.favoris.clear();
  etat.pays.clear();
  etat.agenda.clear();
  ecrireStockage(sessionStorage, CLE_SESSION, null);
}

// Adresse de retour des liens envoyés par e-mail
function adresseRetour(page) {
  return encodeURIComponent(new URL(page, location.href).href);
}

// Messages d'erreur compréhensibles
function traduireErreur(erreur) {
  const texte = (erreur.message || "").toLowerCase();
  if (texte.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (texte.includes("not confirmed")) return "Confirme d'abord ton adresse e-mail : regarde dans ta boîte mail.";
  if (texte.includes("already registered") || texte.includes("already been registered")) return "Un compte existe déjà avec cette adresse.";
  if (texte.includes("password should be") || texte.includes("weak")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (texte.includes("rate limit") || erreur.statut === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (texte.includes("nonce") || texte.includes("reauthentication")) return "Le code est incorrect ou a expiré. Demande un nouveau code.";
  if (texte.includes("same") && texte.includes("password")) return "Choisis un mot de passe différent de l'actuel.";
  if (texte.includes("failed to fetch")) return "Impossible de joindre le serveur. Vérifie ta connexion.";
  return "Une erreur est survenue : " + erreur.message;
}

// ---------- Compte : connexion, inscription, déconnexion ----------

async function connecter(email, motDePasse) {
  const donnees = await requete("/auth/v1/token?grant_type=password", {
    methode: "POST",
    corps: { email: email, password: motDePasse }
  });
  enregistrerSession(donnees, donnees.user);
  await chargerDonnees();
}

async function inscrire(pseudo, email, motDePasse) {
  await requete("/auth/v1/signup?redirect_to=" + adresseRetour("mon-espace.html"), {
    methode: "POST",
    corps: { email: email, password: motDePasse, data: { pseudo: pseudo } }
  });
}

async function deconnecter() {
  if (etat.session) {
    try {
      await requete("/auth/v1/logout", { methode: "POST", jeton: etat.session.access_token });
    } catch (erreur) {
      // on se déconnecte quand même de ce côté
    }
  }
  oublierSession();
  afficherCompte();
}

async function chargerDonnees() {
  const resultats = await Promise.all([
    requeteConnectee("/rest/v1/profiles?select=*&id=eq." + etat.session.id),
    requeteConnectee("/rest/v1/favoris?select=jour"),
    requeteConnectee("/rest/v1/pays_favoris?select=pays"),
    requeteConnectee("/rest/v1/agenda?select=manif,rappel")
  ]);
  etat.profil = resultats[0][0] || null;
  etat.favoris = new Set(resultats[1].map(function (ligne) { return ligne.jour; }));
  etat.pays = new Set(resultats[2].map(function (ligne) { return ligne.pays; }));
  etat.agenda = new Map(resultats[3].map(function (ligne) { return [ligne.manif, ligne.rappel]; }));
}

// Retour depuis un lien reçu par e-mail (#access_token=… dans l'adresse)
async function traiterRetourEmail() {
  const parametres = new URLSearchParams(location.hash.slice(1));

  if (parametres.has("error_description")) {
    history.replaceState(null, "", location.pathname);
    afficherMessage("Lien expiré", "Ce lien n'est plus valable. Recommence l'opération depuis le site.");
    return;
  }
  if (parametres.has("message")) {
    // changement d'e-mail : il faut aussi cliquer le lien envoyé à l'autre adresse
    history.replaceState(null, "", location.pathname);
    afficherMessage("Presque fini", "Clique aussi sur le lien envoyé à ton autre adresse e-mail pour terminer le changement.");
    return;
  }
  if (!parametres.has("access_token")) {
    return;
  }

  const jeton = parametres.get("access_token");
  const utilisateur = await requete("/auth/v1/user", { jeton: jeton });
  enregistrerSession({
    access_token: jeton,
    refresh_token: parametres.get("refresh_token"),
    expires_in: parametres.get("expires_in")
  }, utilisateur);
  history.replaceState(null, "", location.pathname);
  await chargerDonnees();

  const type = parametres.get("type");
  if (type === "recovery") {
    ecrireStockage(sessionStorage, CLE_RECUPERATION, true);
    location.href = "mon-espace.html#securite-compte";
  } else if (type === "signup") {
    afficherMessage("Bienvenue !", "Ton adresse est confirmée, tu es connecté·e. Pense que tu seras déconnecté·e en fermant l'onglet.");
  } else if (type === "email_change") {
    afficherMessage("Adresse modifiée", "Ta nouvelle adresse e-mail est enregistrée.");
  }
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
  if (!COMPTES_ACTIFS) {
    afficherMessage("Bientôt disponible", "Les comptes ne sont pas encore activés sur ce site.");
    return;
  }
  if (!fenetre.open) {
    fenetre.showModal();
  }
  afficherVue(nom);
}

function afficherMessage(titre, texte) {
  fenetre.querySelector("[data-message-titre]").textContent = titre;
  fenetre.querySelector("[data-message-texte]").textContent = texte;
  if (!fenetre.open) {
    fenetre.showModal();
  }
  afficherVue("message");
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
    montrerErreur(formulaire, traduireErreur(erreur));
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
    await connecter(email, motDePasse);
    formulaire.reset();
    fenetre.close();
    afficherCompte();
  });
});

document.querySelector("#formulaire-inscription").addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  const formulaire = evenement.target;
  const pseudo = formulaire.querySelector("#inscription-pseudo").value.trim();
  const email = formulaire.querySelector("#inscription-email").value.trim();
  const motDePasse = formulaire.querySelector("#inscription-mdp").value;

  if (pseudo.length < 2 || pseudo.length > 30) {
    montrerErreur(formulaire, "Ton pseudo doit faire entre 2 et 30 caractères.");
    return;
  }
  if (!formulaire.querySelector("#inscription-email").checkValidity() || email === "") {
    montrerErreur(formulaire, "Cette adresse e-mail n'est pas valide.");
    return;
  }
  if (motDePasse.length < 8) {
    montrerErreur(formulaire, "Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }
  pendantEnvoi(formulaire, async function () {
    await inscrire(pseudo, email, motDePasse);
    formulaire.reset();
    afficherMessage("Vérifie ta boîte mail", "On t'a envoyé un lien pour confirmer ton adresse. Clique dessus pour activer ton compte.");
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
    await requete("/auth/v1/recover?redirect_to=" + adresseRetour("mon-espace.html"), {
      methode: "POST",
      corps: { email: email }
    });
    formulaire.reset();
    afficherMessage("E-mail envoyé", "Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe.");
  });
});

// ---------- Favoris, pays, agenda ----------

async function basculer(table, colonne, valeur, ensemble) {
  if (ensemble.has(valeur)) {
    await requeteConnectee("/rest/v1/" + table + "?" + colonne + "=eq." + encodeURIComponent(valeur), { methode: "DELETE" });
    ensemble.delete(valeur);
  } else {
    const ligne = {};
    ligne[colonne] = valeur;
    await requeteConnectee("/rest/v1/" + table, { methode: "POST", corps: ligne, entetes: { Prefer: "return=minimal" } });
    ensemble.set ? ensemble.set(valeur, true) : ensemble.add(valeur);
  }
  afficherCompte();
}

async function changerRappel(manif, rappel) {
  await requeteConnectee("/rest/v1/agenda?manif=eq." + encodeURIComponent(manif), {
    methode: "PATCH",
    corps: { rappel: rappel },
    entetes: { Prefer: "return=minimal" }
  });
  etat.agenda.set(manif, rappel);
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
      await basculer("favoris", "jour", cible.dataset.enregistrer, etat.favoris);
    } else if (cible.dataset.pays) {
      await basculer("pays_favoris", "pays", cible.dataset.pays, etat.pays);
    } else if (cible.dataset.agenda) {
      await basculer("agenda", "manif", cible.dataset.agenda, etat.agenda);
    } else if (cible.dataset.retirerPays) {
      await basculer("pays_favoris", "pays", cible.dataset.retirerPays, etat.pays);
    } else if (cible.dataset.retirerAgenda) {
      await basculer("agenda", "manif", cible.dataset.retirerAgenda, etat.agenda);
    }
  } catch (erreur) {
    afficherMessage("Oups", traduireErreur(erreur));
  }
});

document.addEventListener("change", async function (evenement) {
  const caseRappel = evenement.target.closest("[data-rappel]");
  if (!caseRappel) {
    return;
  }
  try {
    await changerRappel(caseRappel.dataset.rappel, caseRappel.checked);
  } catch (erreur) {
    caseRappel.checked = !caseRappel.checked;
    afficherMessage("Oups", traduireErreur(erreur));
  }
});

// ---------- Affichage ----------

function remplirAvatar(element, valeur) {
  element.replaceChildren();
  element.className = "avatar-rond grand";
  if (valeur && valeur.startsWith("carpe-")) {
    const image = document.createElement("img");
    image.src = "images/prints/" + IMAGES["j" + valeur.slice(6)];
    image.alt = "";
    image.draggable = false;
    element.append(image);
  } else {
    element.classList.add("avatar-" + (valeur || "arc-en-ciel"));
  }
}

function creerElement(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte) element.textContent = texte;
  return element;
}

function afficherCompte() {
  const connecte = etat.session !== null;
  const pseudo = etat.profil ? etat.profil.pseudo : "";

  document.body.classList.toggle("connecte", connecte);
  document.querySelector("#bouton-compte").textContent = connecte ? "@" + pseudo : "Se connecter";
  document.querySelector("#bandeau-session").hidden = !connecte;
  document.querySelectorAll("[data-pseudo]").forEach(function (zone) { zone.textContent = "@" + pseudo; });
  document.querySelectorAll("[data-email]").forEach(function (zone) { zone.textContent = connecte ? etat.session.email : ""; });

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
  if (!connecte || !etat.profil) {
    return;
  }

  remplirAvatar(document.querySelector("#avatar-profil"), etat.profil.avatar);

  // Print de la semaine : la dernière illustration publiée
  const jours = Object.keys(IMAGES);
  const dernier = jours[jours.length - 1];
  const semaine = document.querySelector("#print-semaine");
  semaine.replaceChildren();
  const lienSemaine = creerElement("a", "print-semaine");
  lienSemaine.href = "print.html#" + dernier;
  const imageSemaine = creerElement("img");
  imageSemaine.src = "images/prints/" + IMAGES[dernier];
  imageSemaine.alt = "";
  imageSemaine.draggable = false;
  lienSemaine.append(imageSemaine, creerElement("span", "", PRINTS[dernier] + " · " + Number(dernier.slice(1)) + " juin"));
  semaine.append(lienSemaine);

  // Prints favoris
  const listeFavoris = document.querySelector("#liste-favoris");
  listeFavoris.replaceChildren();
  Array.from(etat.favoris).sort().forEach(function (jour) {
    const element = creerElement("li");
    const lien = creerElement("a");
    lien.href = "print.html#" + jour;
    if (IMAGES[jour]) {
      const image = creerElement("img");
      image.src = "images/prints/" + IMAGES[jour];
      image.alt = "";
      image.draggable = false;
      lien.append(image);
    }
    lien.append(creerElement("span", "visuellement-cache", PRINTS[jour] + ", " + Number(jour.slice(1)) + " juin"));
    element.append(lien);
    listeFavoris.append(element);
  });
  document.querySelector('[data-vide="favoris"]').hidden = etat.favoris.size > 0;

  // Pays favoris
  const listePays = document.querySelector("#liste-pays-favoris");
  listePays.replaceChildren();
  Array.from(etat.pays).sort().forEach(function (pays) {
    const element = creerElement("li");
    const bouton = creerElement("button", "lien-bouton", "Retirer");
    bouton.type = "button";
    bouton.dataset.retirerPays = pays;
    bouton.setAttribute("aria-label", "Retirer " + pays);
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
    const element = creerElement("li");
    const texte = creerElement("div");
    texte.append(creerElement("strong", "", manif.titre), creerElement("p", "petite-info", manif.date + " · " + manif.lieu));
    const etiquette = creerElement("label", "ligne-case");
    const caseRappel = creerElement("input");
    caseRappel.type = "checkbox";
    caseRappel.checked = rappel;
    caseRappel.dataset.rappel = id;
    etiquette.append(caseRappel, " Rappel la veille");
    const bouton = creerElement("button", "lien-bouton", "Retirer");
    bouton.type = "button";
    bouton.dataset.retirerAgenda = id;
    bouton.setAttribute("aria-label", "Retirer " + manif.titre + " de mon agenda");
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
    const orientation = formulaireProfil.querySelector("#profil-orientation").value || null;
    const ville = formulaireProfil.querySelector("#profil-ville").value.trim() || null;

    if (pseudo.length < 2 || pseudo.length > 30) {
      montrerErreur(formulaireProfil, "Ton pseudo doit faire entre 2 et 30 caractères.");
      return;
    }
    if (!confirm("Enregistrer les modifications de ton profil ?")) {
      return;
    }

    pendantEnvoi(formulaireProfil, async function () {
      // Paramètres obligatoires : enregistrés tout de suite
      const modifications = {
        pseudo: pseudo,
        avatar: avatar ? avatar.value : etat.profil.avatar,
        region: formulaireProfil.querySelector("#profil-region").value || null,
        alertes_region: formulaireProfil.querySelector("#profil-alertes").checked
      };
      await requeteConnectee("/rest/v1/profiles?id=eq." + etat.session.id, {
        methode: "PATCH",
        corps: modifications,
        entetes: { Prefer: "return=minimal" }
      });
      Object.assign(etat.profil, modifications);

      // Paramètres facultatifs (orientation, ville) : appliqués seulement après le clic dans l'e-mail
      const facultatifChange = orientation !== (etat.profil.orientation || null) || ville !== (etat.profil.ville || null);
      if (facultatifChange) {
        await requeteConnectee("/rest/v1/modifications_en_attente", {
          methode: "POST",
          corps: { changements: { orientation: orientation, ville: ville } },
          entetes: { Prefer: "return=minimal" }
        });
        await requeteConnectee("/functions/v1/envoyer-confirmation", { methode: "POST", corps: {} });
        montrerStatut(formulaireProfil, "Enregistré ✓ Pour ton orientation et ta ville, confirme le changement dans l'e-mail qu'on vient de t'envoyer.");
      } else {
        montrerStatut(formulaireProfil, "Modifications enregistrées ✓");
      }
      afficherCompte();
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
      await requeteConnectee("/auth/v1/user?redirect_to=" + adresseRetour("mon-espace.html"), {
        methode: "PUT",
        corps: { email: champ.value.trim() }
      });
      formulaireEmail.reset();
      montrerStatut(formulaireEmail, "On a envoyé un e-mail de confirmation à ton ancienne et à ta nouvelle adresse. Clique sur les deux liens pour valider.");
    });
  });
}

const formulaireMdp = document.querySelector("#formulaire-mdp");
if (formulaireMdp) {
  const enRecuperation = lireStockage(sessionStorage, CLE_RECUPERATION) === true;

  function montrerEtapeNouveau(avecCode) {
    formulaireMdp.querySelector('[data-etape="code"]').hidden = true;
    formulaireMdp.querySelector('[data-etape="nouveau"]').hidden = false;
    formulaireMdp.querySelectorAll("[data-champ-code]").forEach(function (champ) {
      champ.hidden = !avecCode;
    });
  }

  // Après « mot de passe oublié », le lien reçu suffit : pas besoin de code
  if (enRecuperation) {
    montrerEtapeNouveau(false);
    montrerStatut(formulaireMdp, "Choisis ton nouveau mot de passe.");
  }

  document.querySelector("#bouton-code").addEventListener("click", async function () {
    try {
      await requeteConnectee("/auth/v1/reauthenticate", { methode: "GET" });
      montrerEtapeNouveau(true);
      montrerStatut(formulaireMdp, "Un code t'a été envoyé par e-mail.");
      formulaireMdp.querySelector("#mdp-code").focus();
    } catch (erreur) {
      montrerErreur(formulaireMdp, traduireErreur(erreur));
    }
  });

  formulaireMdp.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    const code = formulaireMdp.querySelector("#mdp-code").value.trim();
    const nouveau = formulaireMdp.querySelector("#mdp-nouveau").value;
    const confirmation = formulaireMdp.querySelector("#mdp-confirmation").value;

    if (nouveau.length < 8) {
      montrerErreur(formulaireMdp, "Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveau !== confirmation) {
      montrerErreur(formulaireMdp, "Les deux mots de passe ne sont pas identiques.");
      return;
    }
    if (!enRecuperation && code === "") {
      montrerErreur(formulaireMdp, "Indique le code reçu par e-mail.");
      return;
    }
    pendantEnvoi(formulaireMdp, async function () {
      const corps = { password: nouveau };
      if (code !== "") {
        corps.nonce = code;
      }
      await requeteConnectee("/auth/v1/user", { methode: "PUT", corps: corps });
      ecrireStockage(sessionStorage, CLE_RECUPERATION, null);
      formulaireMdp.reset();
      montrerStatut(formulaireMdp, "Ton mot de passe a été changé ✓");
    });
  });

  document.querySelector("#bouton-supprimer").addEventListener("click", async function () {
    if (!confirm("Supprimer définitivement ton compte et toutes tes données ? Cette action est irréversible.")) {
      return;
    }
    try {
      await requeteConnectee("/rest/v1/rpc/supprimer_mon_compte", { methode: "POST", corps: {} });
      oublierSession();
      afficherCompte();
      afficherMessage("Compte supprimé", "Ton compte et toutes tes données ont été effacés.");
    } catch (erreur) {
      afficherMessage("Oups", traduireErreur(erreur));
    }
  });
}

// ---------- Page de confirmation (lien reçu par e-mail) ----------

const pageConfirmation = document.querySelector("#confirmation-modif");
if (pageConfirmation) {
  const parametres = new URLSearchParams(location.search);
  const jetonModif = parametres.get("jeton");
  const statut = pageConfirmation.querySelector(".message-statut");
  let emailCompte = null;

  // Le lien « Ce n'est pas moi » met directement en avant le bon bouton
  if (parametres.get("action") === "refuser") {
    pageConfirmation.querySelector("#bouton-accepter").hidden = true;
  } else {
    pageConfirmation.querySelector("#bouton-refuser").hidden = true;
  }

  function terminer(titre, texte) {
    pageConfirmation.querySelector("[data-titre]").textContent = titre;
    pageConfirmation.querySelector("[data-texte]").textContent = texte;
    pageConfirmation.querySelector("[data-actions]").hidden = true;
  }

  if (!jetonModif || !COMPTES_ACTIFS) {
    terminer("Lien incomplet", "Ce lien n'est pas valable. Ouvre-le directement depuis l'e-mail reçu.");
  }

  document.querySelector("#bouton-accepter").addEventListener("click", async function () {
    try {
      const resultat = await requete("/rest/v1/rpc/confirmer_modification", { methode: "POST", corps: { p_jeton: jetonModif } });
      if (resultat === "ok") {
        terminer("C'est confirmé ✓", "La modification de ton profil est enregistrée. Tu peux fermer cette page.");
      } else {
        terminer("Lien expiré", "Ce lien n'est plus valable (il expire après 24 heures). Refais la modification depuis ton espace.");
      }
    } catch (erreur) {
      statut.textContent = traduireErreur(erreur);
    }
  });

  document.querySelector("#bouton-refuser").addEventListener("click", async function () {
    try {
      emailCompte = await requete("/rest/v1/rpc/refuser_modification", { methode: "POST", corps: { p_jeton: jetonModif } });
      if (!emailCompte) {
        terminer("Lien expiré", "Ce lien n'est plus valable. Si tu penses que quelqu'un utilise ton compte, utilise « Mot de passe oublié ».");
        return;
      }
      terminer("Modification annulée", "Rien n'a été changé sur ton profil.");
      pageConfirmation.querySelector("[data-reset]").hidden = false;
    } catch (erreur) {
      statut.textContent = traduireErreur(erreur);
    }
  });

  document.querySelector("#bouton-reset").addEventListener("click", async function () {
    try {
      await requete("/auth/v1/recover?redirect_to=" + adresseRetour("mon-espace.html"), {
        methode: "POST",
        corps: { email: emailCompte }
      });
      statut.textContent = "C'est envoyé : regarde ta boîte mail pour choisir un nouveau mot de passe.";
    } catch (erreur) {
      statut.textContent = traduireErreur(erreur);
    }
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
  if (COMPTES_ACTIFS) {
    try {
      await traiterRetourEmail();
      if (etat.session && !etat.profil) {
        await chargerDonnees();
      }
    } catch (erreur) {
      oublierSession();
    }
  } else {
    oublierSession();
  }
  afficherCompte();
  remplirProfil();
}

demarrer();
