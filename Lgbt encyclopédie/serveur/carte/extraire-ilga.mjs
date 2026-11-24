// Ouvre trois pages de la base de données ILGA World dans Chromium et enregistre leurs données
// dans donnees-ilga/. Le site ILGA est une application JavaScript : sans navigateur, ses pages sont vides.
// Usage : npm run ilga   (la première fois : npx playwright install chromium)
import fs from "fs";
import { chromium } from "playwright";

const DOSSIER = new URL("donnees-ilga/", import.meta.url);
fs.mkdirSync(DOSSIER, { recursive: true });

// Page ILGA → requête qui contient les données pays par pays (et son type, si la requête en a un) → fichier enregistré
const PAGES = [
  ["criminalisation-consensual-same-sex-sexual-acts", "GetEntriesCSSA", null, "criminalisation.json"],
  ["same-sex-marriage-civil-unions", "GetEntriesCt", null, "couples.json"],
  ["legal-barriers-freedom-of-expression", "GetEntriesFOE", null, "expression.json"],
  ["legal-barriers-freedom-of-association", "GetEntriesFOA", null, "association.json"],
  ["hate-crime-law-lgbti", "GetEntriesProtection", "A1-12", "crimes-de-haine.json"]
];

// CHROMIUM : chemin d'un Chromium déjà installé, si besoin (sinon celui de Playwright)
const navigateur = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

for (const [page, requete, type, fichier] of PAGES) {
  const onglet = await navigateur.newPage();
  let trouve = false;
  onglet.on("response", async reponse => {
    if (!reponse.url().endsWith("/graphql")) return;
    const envoi = JSON.parse(reponse.request().postData() || "{}");
    const appel = Array.isArray(envoi) ? envoi[0] : envoi;
    // La liste des pays d'ILGA, avec l'adresse de leur fiche (slug_en)
    if (appel.operationName === "GetJurs") {
      fs.writeFileSync(new URL("juridictions.json", DOSSIER), await reponse.text());
    }
    if (appel.operationName === requete && (type === null || (appel.variables || {}).type === type)) {
      fs.writeFileSync(new URL(fichier, DOSSIER), await reponse.text());
      trouve = true;
    }
  });
  // Certaines pages ILGA ne cessent jamais de charger : on attend le chargement, puis 12 secondes
  await onglet.goto("https://database.ilga.org/" + page, { waitUntil: "load", timeout: 90000 });
  await onglet.waitForTimeout(12000);
  const texte = await onglet.evaluate(() => document.body.innerText);
  const date = (texte.match(/Updated as of:\s*([^\n]+)/) || [, "date inconnue"])[1].trim();
  console.log(`${fichier} : ${trouve ? "enregistré" : "INTROUVABLE"} (ILGA : mis à jour ${date})`);
  await onglet.close();
}

await navigateur.close();
