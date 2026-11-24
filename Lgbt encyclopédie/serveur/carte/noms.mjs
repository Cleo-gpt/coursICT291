// Noms français des pays, partagés par generer-pays.mjs et generer-carte.mjs.
import pays from "i18n-iso-countries";
import fr from "i18n-iso-countries/langs/fr.json" with { type: "json" };

pays.registerLocale(fr);

// Noms officiels trop longs pour la liste et la carte
const NOMS_COURTS = {
  TZ: "Tanzanie",
  US: "États-Unis",
  DO: "République dominicaine",
  CF: "Centrafrique"
};

// Territoires sans code ISO dans les frontières Natural Earth
export const SANS_CODE = {
  "Kosovo": ["XK", "Kosovo"],
  "N. Cyprus": ["", "Chypre du Nord"],
  "Somaliland": ["", "Somaliland"]
};

export function nomFrancais(code) {
  if (NOMS_COURTS[code]) {
    return NOMS_COURTS[code];
  }
  if (code === "XK") {
    return "Kosovo";
  }
  return pays.getName(code, "fr");
}

export function codeDepuisNumero(numero) {
  return pays.numericToAlpha2(numero);
}
