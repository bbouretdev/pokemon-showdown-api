import os
import json
import sys
from pathlib import Path

SOURCE_ROOT = Path("/var/www/pokemon-showdown/logs/battlelogs")
DEST_ROOT = Path("/home/showdown/pokemon-showdown-api/battlelogs")

def extract_logs_for_date(target_date: str):
    flattened_logs = []

    for format_dir in SOURCE_ROOT.iterdir():
        if not format_dir.is_dir():
            continue

        format_name = format_dir.name
        date_dir = format_dir / target_date

        if not date_dir.exists():
            continue

        for log_file in date_dir.glob("*.json"):
            try:
                with log_file.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    flattened_logs.append({
                        "format": format_name,
                        "match": data
                    })
            except Exception as e:
                print(f"[Erreur] Lecture échouée {log_file}: {e}")

    if not flattened_logs:
        print(f"[Info] Aucun log trouvé pour la date {target_date}")
        return

    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    output_path = DEST_ROOT / f"{target_date}.json"

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(flattened_logs, f, ensure_ascii=False, indent=2)

    print(f"[OK] Fichier généré : {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage : python extract_logs_by_date.py YYYY-MM-DD")
        sys.exit(1)

    date_input = sys.argv[1]
    extract_logs_for_date(date_input)
