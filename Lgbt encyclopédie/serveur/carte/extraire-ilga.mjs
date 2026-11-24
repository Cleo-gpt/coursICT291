// Ouvre trois pages de la base de données ILGA World dans Chromium et enregistre leurs données
// dans donnees-ilga/. Le site ILGA est une application JavaScript : sans navigateur, ses pages sont vides.
// Usage : npm run ilga   (la première fois : npx playwright install chromium)
import fs from "fs";
import { chromium } from "playwright";

const DOSSIER = new URL("donnees-ilga/", import.meta.url);
fs.mkdirSync(DOSSIER, { recursive: true });

// Page ILGA → requête qui contient les données pays par pays → fichier enregistré
const PAGES = [
  ["criminalisation-consensual-same-sex-sexual-acts", "GetEntriesCSSA", "criminalisation.json"],
  ["same-sex-marriage-civil-unions", "GetEntriesCt", "couples.json"],
  ["legal-barriers-freedom-of-expression", "GetEntriesFOE", "expression.json"]
];

// CHROMIUM : chemin d'un Chromium déjà installé, si besoin (sinon celui de Playwright)
const navigateur = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

for (const [page, requete, fichier] of PAGES) {
  const onglet = await navigateur.newPage();
  let trouve = false;
  onglet.on("response", async reponse => {
    if (!reponse.url().endsWith("/graphql")) return;
    const envoi = JSON.parse(reponse.request().postData() || "{}");
    if ((Array.isArray(envoi) ? envoi[0] : envoi).operationName === requete) {
      fs.writeFileSync(new URL(fichier, DOSSIER), await reponse.text());
      trouve = true;
    }
  });
  await onglet.goto("https://database.ilga.org/" + page, { waitUntil: "networkidle", timeout: 90000 });
  await onglet.waitForTimeout(3000);
  const texte = await onglet.evaluate(() => document.body.innerText);
  const date = (texte.match(/Updated as of:\s*([^\n]+)/) || [, "date inconnue"])[1].trim();
  console.log(`${fichier} : ${trouve ? "enregistré" : "INTROUVABLE"} (ILGA : mis à jour ${date})`);
  await onglet.close();
}

await navigateur.close();
