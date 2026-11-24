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
  return {
    code,
    nom: nomFrancais(code) || jur.name,
    niveau: niveau(peine, obstacles, mariage),
    criminalisation: CRIMINALISATION[peine] || "Pas de données",
    couples: COUPLES[typeCouple] || "Pas de données",
    expression: EXPRESSION[obstacles] || "Pas de données",
    ...(NOTES[code] ? { note: NOTES[code] } : {})
  };
});

// Ordre alphabétique français (Émirats avec les E, Îles avec les I)
liste.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
fs.writeFileSync(SORTIE, JSON.stringify(liste, null, 1) + "\n");

const parNiveau = [1, 2, 3, 4].map(n => liste.filter(p => p.niveau === n).length);
console.log(`pays.json : ${liste.length} pays (favorable ${parNiveau[0]}, normale ${parNiveau[1]}, renforcée ${parNiveau[2]}, risque ${parNiveau[3]}).`);
if (inconnus.size > 0) {
  console.log("Catégories ILGA sans traduction (à ajouter dans generer-pays.mjs) :", [...inconnus].join(" · "));
}
