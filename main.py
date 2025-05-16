from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import json
import os

app = FastAPI()

# Répertoire contenant les fichiers JSON générés
JSON_DIR = "/home/showdown/api/data-transform/json-data"

# Noms communs des fichiers (sans extension ni préfixe)
ENDPOINTS = [
    "abilities",
    "items",
    "moves",
    "formats-data",
    "learnsets",
    "pokedex",
    "typechart",
]

def load_json_file(prefix: str, endpoint: str):
    filename = f"{prefix}{endpoint}.json"
    path = os.path.join(JSON_DIR, filename)

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"{filename} non trouvé")

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"{filename} invalide (JSON)")

# Accueil
@app.get("/")
def read_root():
    return JSONResponse(content={
        "message": "Bienvenue sur l'API Pokémon Showdown 🐍",
        "routes": {
            "dav": [f"/dav/{ep}" for ep in ENDPOINTS],
            "smogon": [f"/smogon/{ep}" for ep in ENDPOINTS],
        }
    })

# Routes pour les données locales
@app.get("/dav/{endpoint}")
def get_local_data(endpoint: str):
    if endpoint not in ENDPOINTS:
        raise HTTPException(status_code=404, detail="Endpoint invalide")
    return load_json_file(prefix="", endpoint=endpoint)

# Routes pour les données smogon
@app.get("/smogon/{endpoint}")
def get_smogon_data(endpoint: str):
    if endpoint not in ENDPOINTS:
        raise HTTPException(status_code=404, detail="Endpoint invalide")
    return load_json_file(prefix="smogon-", endpoint=endpoint)
