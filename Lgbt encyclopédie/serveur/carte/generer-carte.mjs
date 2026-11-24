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

// Cadrage de chaque zone (boutons au-dessus de la carte), en longitudes et latitudes,
// comme les cartes régionales « Conseils aux voyageurs ». Avec le centre à 11° Est,
// une longitude de 189 (= 171° Ouest) se place à droite de la carte, après les Fidji.
const ZONES = {
  europe: [-25, 33, 62, 72],
  afrique: [-26, -36, 60, 27],
  anmo: [-18, 12, 64, 42],
  ameriques: [-168, -57, -28, 84],
  "asie-oceanie": [44, -48, 189, 56]
};
function cadrage([ouest, sud, est, nord]) {
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const lon = ouest + (est - ouest) * i / 20;
    const lat = sud + (nord - sud) * i / 20;
    points.push([lon, sud], [lon, nord], [ouest, lat], [est, lat]);
  }
  const xy = points.map(p => projection(p));
  const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
  const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys));
  const l = Math.min(L, Math.max(...xs)) - x, h = Math.min(H, Math.max(...ys)) - y;
  return [x, y, l, h].map(v => Math.round(v)).join(" ");
}
const attributsZones = Object.entries(ZONES).map(([zone, boite]) => ` data-vue-${zone}="${cadrage(boite)}"`).join("");

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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" data-vue-monde="0 0 ${L} ${H}"${attributsZones} class="carte-monde">\n`
  + `<!-- Frontières : Natural Earth 1:110m (domaine public), via world-atlas. Projection Natural Earth centrée à 11° E. Crimée rattachée à l'Ukraine. -->\n`
  + lignes.join("\n") + "\n</svg>\n";
fs.writeFileSync(SORTIE, svg);
console.log(`carte-monde.svg : ${lignes.length} pays, ${svg.length} caractères.`);
if (inconnus.length > 0) {
  console.log("Sans nom français (à ajouter dans noms.mjs) :", inconnus.join(", "));
}
