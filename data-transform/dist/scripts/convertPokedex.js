import { Pokedex } from '../data/pokedex';
import fs from 'fs';
// Convertir les données en JSON et les écrire dans un fichier
fs.writeFileSync('pokedex.json', JSON.stringify(Pokedex, null, 2), 'utf8');
console.log('Pokedex has been written to pokedex.json');
