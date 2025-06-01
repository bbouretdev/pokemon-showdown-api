// generate-api-data.cjs

const fs = require('fs');
const path = require('path');
const https = require('https');

const localDataDir = '/var/www/pokemon-showdown-client/play.pokemonshowdown.com/data';
const outputDir = '/home/showdown/pokemon-showdown-api/data-transform/json-data';
const tmpDir = '/home/showdown/pokemon-showdown-api/data-transform/tmp'
const remoteBaseUrl = 'https://play.pokemonshowdown.com/data';

const files = [
  'pokedex.js',
  'moves.js',
  'abilities.js',
  'items.js',
  'formats-data.js',
  'learnsets.js',
  'typechart.js',
];

// Crée le dossier de sortie s'il n'existe pas
fs.mkdirSync(outputDir, { recursive: true });

// Convertit un fichier CommonJS en JSON transformé
function convertCjsToJson(inputPath, outputPath) {
  try {
    delete require.cache[require.resolve(inputPath)];
    const raw = require(inputPath);
    const topKey = Object.keys(raw)[0];
    const rawContent = raw[topKey];
    let transformed = {};

    if (typeof rawContent === 'object' && !Array.isArray(rawContent)) {
      // Transforme l’objet en array d’objets avec clé incluse
      transformed[topKey] = Object.entries(rawContent).map(([key, value]) => ({
        key,
        ...value,
      }));
    } else {
      transformed[topKey] = rawContent;
    }

    fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
    console.log(`✅ Généré : ${outputPath}`);
  } catch (err) {
    console.error(`❌ Erreur de conversion : ${inputPath}`, err);
  }
}

// Télécharge un fichier distant
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(`Erreur HTTP ${res.statusCode}`);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

// Fonction d'aplatissement des fichiers JSON sur le tableau racine donné
function flattenJsonArrayAtRoot(filePath, rootArrayKey) {
  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (jsonData[rootArrayKey] && Array.isArray(jsonData[rootArrayKey])) {
      const flattened = jsonData[rootArrayKey];
      fs.writeFileSync(filePath, JSON.stringify(flattened, null, 2));
      console.log(`✅ Aplatit : ${filePath} (clé extraite : ${rootArrayKey})`);
    } else {
      console.warn(`⚠️ Clé '${rootArrayKey}' non trouvée ou n'est pas un tableau dans ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors de l'aplatissement de ${filePath}:`, err);
  }
}

// Mapping des fichiers à aplatir
const filesToFlatten = [
  { fileName: 'abilities.json', rootKey: 'BattleAbilities' },
  { fileName: 'items.json', rootKey: 'BattleItems' },
  { fileName: 'learnsets.json', rootKey: 'BattleLearnsets' },
  { fileName: 'moves.json', rootKey: 'BattleMovedex' },
  { fileName: 'pokedex.json', rootKey: 'BattlePokedex' },
  { fileName: 'formats-data.json', rootKey: 'BattleFormatsData' },
  { fileName: 'typechart.json', rootKey: 'BattleTypeChart' },
  { fileName: 'smogon-abilities.json', rootKey: 'BattleAbilities' },
  { fileName: 'smogon-items.json', rootKey: 'BattleItems' },
  { fileName: 'smogon-learnsets.json', rootKey: 'BattleLearnsets' },
  { fileName: 'smogon-moves.json', rootKey: 'BattleMovedex' },
  { fileName: 'smogon-pokedex.json', rootKey: 'BattlePokedex' },
  { fileName: 'smogon-formats-data.json', rootKey: 'BattleFormatsData' },
  { fileName: 'smogon-typechart.json', rootKey: 'BattleTypeChart' },
];

// 🔹 Traitement des fichiers locaux
for (const file of files) {
  const baseName = file.replace('.js', '');
  const localJsPath = path.join(localDataDir, file);
  const tempCjsPath = path.join(`${tmpDir}`, `local-${baseName}.cjs`);
  const outputJsonPath = path.join(outputDir, `${baseName}.json`);

  if (fs.existsSync(localJsPath)) {
    const jsContent = fs.readFileSync(localJsPath, 'utf8');
    fs.writeFileSync(tempCjsPath, jsContent);
    convertCjsToJson(tempCjsPath, outputJsonPath);
  } else {
    console.warn(`⚠️ Fichier local non trouvé : ${localJsPath}`);
  }
}

// 🔸 Traitement des fichiers distants + aplatissement
(async () => {
  for (const file of files) {
    const baseName = file.replace('.js', '');
    const tempCjsPath = path.join(`${tmpDir}`, `smogon-${baseName}.cjs`);
    const outputJsonPath = path.join(outputDir, `smogon-${baseName}.json`); // <== préfixe smogon-
    const remoteUrl = `${remoteBaseUrl}/${file}`;

    try {
      await downloadFile(remoteUrl, tempCjsPath);
      convertCjsToJson(tempCjsPath, outputJsonPath);
    } catch (err) {
      console.error(`❌ Échec du téléchargement de ${file}:`, err);
    }
  }

  // Aplatir tous les fichiers JSON produits (locaux + distants)
  for (const { fileName, rootKey } of filesToFlatten) {
    const filePath = path.join(outputDir, fileName);
    if (fs.existsSync(filePath)) {
      flattenJsonArrayAtRoot(filePath, rootKey);
    } else {
      console.warn(`⚠️ Fichier JSON à aplatir non trouvé : ${filePath}`);
    }
  }
})();
