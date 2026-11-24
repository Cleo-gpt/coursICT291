// Fabrique site/pays.json à partir des données ILGA World (donnees-ilga/, voir extraire-ilga.mjs).
// Un objet par pays : code ISO, nom français, niveau de vigilance (1 à 4) et trois faits traduits.
// Usage : npm run pays
import fs from "fs";
import { nomFrancais } from "./noms.mjs";

const SORTIE = new URL("../../site/pays.json", import.meta.url);

// Les entrées nationales (pas les régions d'un pays), rangées par code ISO
function lire(fichier) {
  const json = JSON.parse(fs.readFileSync(new URL("donnees-ilga/" + fichier, import.meta.url), "utf8"));
  const entrees = Object.values(json.data)[0];
  const parCode = new Map();
  for (const entree of entrees) {
    const { jurisdiction, subjurisdiction } = entree.motherEntry;
    if (subjurisdiction === null && jurisdiction.a2_code) {
      parCode.set(jurisdiction.a2_code, entree);
    }
  }
  return parCode;
}

const criminalisation = lire("criminalisation.json");
const couples = lire("couples.json");
const expression = lire("expression.json");
const association = lire("association.json");
const crimesDeHaine = lire("crimes-de-haine.json");

// Adresse de la fiche ILGA de chaque pays : https://database.ilga.org/switzerland-lgbti
const juridictions = JSON.parse(fs.readFileSync(new URL("donnees-ilga/juridictions.json", import.meta.url), "utf8"))
  .data.jurisdictions.filter(j => j.a2_code);
const fichesIlga = new Map(juridictions.filter(j => j.slug_en)
  .map(j => [j.a2_code, `https://database.ilga.org/${j.slug_en.toLowerCase()}-lgbti`]));

// Zone de chaque pays, comme les cartes « Conseils aux voyageurs » : d'après les régions d'ILGA
// (14 = SWANA, 11 = Europe, 1 = Afrique, 18/15/13 = Amériques, 2/16 = Asie et Océanie).
// Ajustements : ces quatre pays de la région SWANA d'ILGA sont rangés avec l'Afrique.
const ZONES_AJUSTEES = { MR: "afrique", SD: "afrique", DJ: "afrique", ER: "afrique" };
const zones = new Map(juridictions.map(j => {
  const regions = new Set(j.regions.map(r => Number(r.id)));
  let zone = "monde";
  if (regions.has(14)) zone = "anmo";
  else if (regions.has(11)) zone = "europe";
  else if (regions.has(1)) zone = "afrique";
  else if ([18, 15, 13].some(r => regions.has(r))) zone = "ameriques";
  else if ([2, 16].some(r => regions.has(r))) zone = "asie-oceanie";
  return [j.a2_code, ZONES_AJUSTEES[j.a2_code] || zone];
}));

// Attitudes : Global Acceptance Index du Williams Institute (UCLA), moyenne 2017-2020, 175 pays.
// Tableau A.2 du rapport « Social Acceptance of LGBTI People in 175 Countries and Locations » (2021),
// recopié dans sources/acceptation-williams-2017-2020.csv (voir README).
const acceptation = new Map();
const lignesAcceptation = fs.readFileSync(new URL("sources/acceptation-williams-2017-2020.csv", import.meta.url), "utf8").trim().split("\n").slice(1);
for (const ligne of lignesAcceptation) {
  const [rang, , code, score] = ligne.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  if (code) acceptation.set(code, { score: Number(score), rang: Number(rang) });
}
const NOMBRE_PAYS_ACCEPTATION = lignesAcceptation.length; // 175

function attitudes(code) {
  const mesure = acceptation.get(code);
  if (!mesure) {
    return "Pas de mesure de l'acceptation sociale pour ce pays dans l'enquête du Williams Institute.";
  }
  const tiers = mesure.rang <= NOMBRE_PAYS_ACCEPTATION / 3 ? "parmi les pays les plus ouverts"
    : mesure.rang <= NOMBRE_PAYS_ACCEPTATION * 2 / 3 ? "dans la moyenne des pays mesurés"
    : "parmi les pays les moins ouverts";
  const score = mesure.score.toFixed(1).replace(".", ",");
  return `Acceptation des personnes LGBTI : ${score} sur 10, ${mesure.rang}e sur ${NOMBRE_PAYS_ACCEPTATION} pays, ${tiers} (sondages 2017-2020).`;
}

const ASSOCIATION = {
  "No Known Legal Barriers": "Pas d'obstacle légal connu pour les associations LGBTI.",
  "Legal Barriers Likely to Exist": "Des obstacles légaux aux associations LGBTI sont probables.",
  "Non-Explicit Legal Barriers": "Des lois générales servent à empêcher les associations LGBTI de se déclarer ou d'agir.",
  "Explicit Legal Barriers": "La loi interdit ou empêche explicitement les associations LGBTI."
};

// Loi qui punit plus sévèrement une agression motivée par l'orientation sexuelle (so) ou l'identité de genre (gi)
function crimesHaine(entree) {
  if (!entree) return null;
  const so = entree.so_protection_type?.name;
  const gi = entree.gi_protection_type?.name;
  if (so === "Varies" || gi === "Varies") {
    return "Les lois sur les crimes de haine varient selon les régions du pays.";
  }
  if (so === "Yes" && gi === "Yes") {
    return "Une agression motivée par l'orientation sexuelle ou l'identité de genre est punie plus sévèrement (loi sur les crimes de haine).";
  }
  if (so === "Yes") {
    return "Une agression motivée par l'orientation sexuelle est punie plus sévèrement ; pas de protection équivalente pour l'identité de genre.";
  }
  return "Aucune loi ne punit plus sévèrement les agressions motivées par l'orientation sexuelle ou l'identité de genre.";
}

// Conseils généraux de Prisme selon le niveau (ce ne sont pas des données ILGA)
const CONSEILS = {
  1: "Cadre légal protecteur, mais les agressions existent partout : en cas de problème, porte plainte et contacte une association LGBTI locale.",
  2: "Pas de criminalisation, mais une protection légale limitée : renseigne-toi sur les lieux et quartiers accueillants avant de partir.",
  3: "Les signes visibles (drapeaux, marches, publications) peuvent être sanctionnés : reste discret·e en public, surtout hors des grandes villes.",
  4: "Évite les gestes affectueux en public et sois prudent·e avec les applications de rencontre, utilisées dans plusieurs pays pour piéger des personnes. Garde les contacts de l'ambassade de Suisse."
};

const CRIMINALISATION = {
  "No criminalisation": "Non criminalisées",
  "Up to 8 years imprisonment": "Criminalisées : jusqu'à 8 ans de prison",
  "10 years to life in prison": "Criminalisées : de 10 ans à la prison à vie",
  "Death Penalty (possible)": "Criminalisées : peine de mort possible",
  "Death Penalty": "Criminalisées : peine de mort",
  "De facto criminalisation": "Criminalisées dans les faits, sans loi explicite",
  "Criminalisation Varies": "Criminalisées dans une partie du territoire (variable selon les régions)",
  "Unclear": "Situation juridique incertaine"
};
const COUPLES = {
  "No": "Aucune reconnaissance des couples de même sexe",
  "Marriage & Civil Union": "Mariage et union civile",
  "Marriage": "Mariage",
  "Civil Union Only": "Union civile seulement",
  "Varies": "Variable selon les régions du pays",
  "Unclear": "Situation incertaine"
};
const EXPRESSION = {
  "No Known Legal Barriers": "Pas d'obstacle légal connu",
  "Non-Explicit Legal Barriers": "Obstacles légaux non explicites (lois générales, par exemple sur la « moralité publique »)",
  "Explicit Legal Barriers": "Obstacles légaux explicites (lois dites « anti-propagande »)",
  "Varies": "Variable selon les régions du pays",
  "Unclear": "Situation incertaine"
};

// Remarques ajoutées à la fiche de certains pays
const NOTES = {
  UA: "En Crimée, occupée par la Russie depuis 2014, ce sont dans les faits les lois russes qui s'appliquent, dont la loi « anti-propagande ». Le niveau de vigilance y est celui de la Russie.",
  RU: "La Crimée, occupée par la Russie depuis 2014, est rattachée à l'Ukraine sur la carte : c'est la frontière reconnue internationalement. Dans les faits, les lois russes s'y appliquent."
};

// Les règles des couleurs (expliquées sur la page Voyager, « Comment les couleurs sont choisies »)
const CRIMINALISE = new Set(["Up to 8 years imprisonment", "10 years to life in prison", "Death Penalty (possible)",
  "Death Penalty", "De facto criminalisation", "Criminalisation Varies"]);
const OBSTACLES = new Set(["Explicit Legal Barriers", "Non-Explicit Legal Barriers"]);

function niveau(peine, obstacles, mariage) {
  if (CRIMINALISE.has(peine)) return 4;      // zone à risque
  if (OBSTACLES.has(obstacles)) return 3;    // vigilance renforcée
  if (mariage === "Yes") return 1;           // accueil favorable
  return 2;                                  // vigilance normale
}

const codes = new Set([...criminalisation.keys(), ...couples.keys(), ...expression.keys()]);
const inconnus = new Set();
const liste = [...codes].map(code => {
  const peine = criminalisation.get(code)?.entry_csssa_penalty?.name;
  const typeCouple = couples.get(code)?.summary_type?.name;
  const mariage = couples.get(code)?.marriage_type?.name;
  const obstacles = expression.get(code)?.entry_foe_barrier_summary_value?.name;
  for (const [valeur, table] of [[peine, CRIMINALISATION], [typeCouple, COUPLES], [obstacles, EXPRESSION]]) {
    if (valeur && !table[valeur]) inconnus.add(valeur);
  }
  const jur = (criminalisation.get(code) || couples.get(code) || expression.get(code)).motherEntry.jurisdiction;
  const niveauPays = niveau(peine, obstacles, mariage);

  // Sécurité : faits ILGA, puis le conseil de Prisme
  const securite = [];
  if (CRIMINALISE.has(peine) && criminalisation.get(code)?.enforcement) {
    securite.push("ILGA World analyse l'application de la loi dans ce pays : arrestations, poursuites, ciblage par la police.");
  }
  const barriere = association.get(code)?.barrier_value?.name;
  if (ASSOCIATION[barriere]) securite.push(ASSOCIATION[barriere]);
  else if (barriere) inconnus.add(barriere);
  const haine = crimesHaine(crimesDeHaine.get(code));
  if (haine) securite.push(haine);

  return {
    code,
    nom: nomFrancais(code) || jur.name,
    niveau: niveauPays,
    zone: zones.get(code) || "monde",
    criminalisation: CRIMINALISATION[peine] || "Pas de données",
    couples: COUPLES[typeCouple] || "Pas de données",
    expression: EXPRESSION[obstacles] || "Pas de données",
    attitudes: attitudes(code),
    securite: securite,
    conseil: CONSEILS[niveauPays],
    ilga: fichesIlga.get(code) || null,
    ...(NOTES[code] ? { note: NOTES[code] } : {})
  };
});

// Ordre alphabétique français (Émirats avec les E, Îles avec les I)
liste.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
fs.writeFileSync(SORTIE, JSON.stringify(liste, null, 1) + "\n");

const parNiveau = [1, 2, 3, 4].map(n => liste.filter(p => p.niveau === n).length);
console.log(`pays.json : ${liste.length} pays (favorable ${parNiveau[0]}, normale ${parNiveau[1]}, renforcée ${parNiveau[2]}, risque ${parNiveau[3]}).`);
const sansZone = liste.filter(p => p.zone === "monde").map(p => p.nom);
if (sansZone.length > 0) {
  console.log("Pays sans zone (à ajouter dans ZONES_AJUSTEES) :", sansZone.join(", "));
}
if (inconnus.size > 0) {
  console.log("Catégories ILGA sans traduction (à ajouter dans generer-pays.mjs) :", [...inconnus].join(" · "));
}
