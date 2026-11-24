// Fabrique site/images/carte-monde.svg : un <path id="pays-CA" data-code="CA" data-nom="Canada"> par pays.
// Frontières : Natural Earth 1:110m (domaine public), via le paquet world-atlas.
// Usage : npm run carte
import fs from "fs";
import { feature, merge } from "topojson-client";
import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { nomFrancais, codeDepuisNumero, SANS_CODE } from "./noms.mjs";

const SORTIE = new URL("../../site/images/carte-monde.svg", import.meta.url);
const topo = JSON.parse(fs.readFileSync(new URL("node_modules/world-atlas/countries-110m.json", import.meta.url), "utf8"));

// Crimée : Natural Earth la dessine avec la Russie, qui l'occupe depuis 2014.
// Prisme suit la frontière reconnue internationalement (ONU, Suisse) : on la rattache à l'Ukraine.
// La fiche de l'Ukraine précise que les lois russes s'y appliquent dans les faits (generer-pays.mjs).
const geometries = topo.objects.countries.geometries;
const russie = geometries.find(g => g.id === "643");
const ukraine = geometries.find(g => g.id === "804");
const indexCrimee = russie.arcs.findIndex(polygone => {
  const [longitude, latitude] = geoCentroid(feature(topo, { type: "Polygon", arcs: polygone }));
  return longitude > 32 && longitude < 37 && latitude > 44 && latitude < 46.5;
});
if (indexCrimee === -1) {
  throw new Error("Crimée introuvable dans la forme de la Russie : vérifier la version de world-atlas.");
}
const crimee = russie.arcs.splice(indexCrimee, 1)[0];
// Fusion : la Crimée et le reste de l'Ukraine forment une seule forme, sans frontière entre les deux
const ukraineAvecCrimee = merge(topo, [ukraine, { type: "Polygon", arcs: crimee }]);

const monde = feature(topo, topo.objects.countries);
monde.features = monde.features.filter(f => f.id !== "010"); // sans l'Antarctique
monde.features.find(f => f.id === "804").geometry = ukraineAvecCrimee;

const L = 1000, H = 500;
// Centre à 11° Est : le méridien de coupure (169° Ouest) passe dans le détroit de Béring,
// la Russie reste d'un seul tenant et l'Alaska aussi.
const projection = geoNaturalEarth1().rotate([-11, 0]).fitExtent([[4, 4], [L - 4, H - 4]], monde);
const chemin = geoPath(projection).digits(1);

const inconnus = [];
const lignes = monde.features.map(f => {
  let code = f.id ? codeDepuisNumero(f.id) : undefined;
  let nom = code ? nomFrancais(code) : undefined;
  if (!code || !nom) {
    const secours = SANS_CODE[f.properties.name];
    if (secours) {
      [code, nom] = secours;
    } else {
      inconnus.push(f.properties.name);
      [code, nom] = ["", f.properties.name];
    }
  }
  const attributs = code ? ` id="pays-${code}" data-code="${code}"` : "";
  return `<path${attributs} data-nom="${nom.replace(/"/g, "&quot;")}" d="${chemin(f)}"/>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" class="carte-monde">\n`
  + `<!-- Frontières : Natural Earth 1:110m (domaine public), via world-atlas. Projection Natural Earth centrée à 11° E. Crimée rattachée à l'Ukraine. -->\n`
  + lignes.join("\n") + "\n</svg>\n";
fs.writeFileSync(SORTIE, svg);
console.log(`carte-monde.svg : ${lignes.length} pays, ${svg.length} caractères.`);
if (inconnus.length > 0) {
  console.log("Sans nom français (à ajouter dans noms.mjs) :", inconnus.join(", "));
}
