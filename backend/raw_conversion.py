import csv
import json

# The specific ranks where stat gains change
BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41]

def process_csv_to_hierarchical_json(stats_csv, loc_csv, json_filepath):
    db = {}
    translations = {}

    # --- STEP 1: Load Translations ---
    try:
        # Change delimiter to ',' if you save as a standard comma-separated CSV
        with open(loc_csv, mode='r', encoding='utf-8') as loc_file:
            loc_reader = csv.DictReader(loc_file)
            for row in loc_reader:
                kr_name = row['Korean'].strip()
                # Handle potentially missing short name columns gracefully
                translations[kr_name] = {
                    "full": {
                        "kr": kr_name,
                        "en": row.get('English', kr_name).strip(),
                        "jp": row.get('Japanese', kr_name).strip()
                    },
                    "short": {
                        "kr": row.get('KoreanShort', kr_name).strip(),
                        "en": row.get('EnglishShort', row.get('English', kr_name)).strip(),
                        "jp": row.get('JapaneseShort', row.get('Japanese', kr_name)).strip()
                    }
                }
    except FileNotFoundError:
        print(f"Warning: Could not find '{loc_csv}'. Proceeding without translations.")
    except KeyError as e:
        print(f"Error in localization CSV: Missing column {e}. Check headers!")
    
    try:
        # Using cp949 based on your earlier Korean text encoding needs, 
        # but change to utf-8-sig if you saved the CSV as UTF-8
        with open(stats_csv, mode='r', encoding='utf-8') as stat_file:
            stat_reader = csv.DictReader(stat_file)
            
            for row in stat_reader:
                char_name_kr = row['Character'].strip()
                base_char = row['BaseCharacter'].strip().lower()
                alt_key = char_name_kr.lower()
                
                rank = int(row['Rank'])
                stat_type = row['StatType'].strip().lower()
                stat_gain = int(row['StatGain'])
                
                # 1. Initialize Base Character
                if base_char not in db:
                    db[base_char] = {}
                    
                # 2. Initialize Alt and inject localization
                if alt_key not in db[base_char]:
                    # Grab the translation, or fallback to the Korean name if missing
                    char_names = translations.get(char_name_kr, {
                        "full": { "kr": char_name_kr, "en": char_name_kr, "jp": char_name_kr },
                        "short": { "kr": char_name_kr, "en": char_name_kr, "jp": char_name_kr }
                    })
                    
                    db[base_char][alt_key] = {
                        "names": char_names,
                        "bonuses": {}
                    }
                
                # 3. Initialize stat array if missing
                if stat_type not in db[base_char][alt_key]["bonuses"]:
                    db[base_char][alt_key]["bonuses"][stat_type] = [0] * len(BREAKPOINTS)
                    
                # 4. Apply stat gain
                if rank in BREAKPOINTS:
                    idx = BREAKPOINTS.index(rank)
                    db[base_char][alt_key]["bonuses"][stat_type][idx] = stat_gain

        # Cleanup: Remove empty arrays
        for base_char, alts in db.items():
            for alt_key, alt_data in alts.items():
                bonuses = alt_data["bonuses"]
                alt_data["bonuses"] = {k: v for k, v in bonuses.items() if any(val > 0 for val in v)}

        final_json = {"base_characters": db}
            
        with open(json_filepath, 'w', encoding='utf-8') as outfile:
            json.dump(final_json, outfile, indent=2, ensure_ascii=False)

        print(f"Success! Localized JSON saved to {json_filepath}")

    except FileNotFoundError:
        print(f"Error: Could not find '{stats_csv}'.")
    except KeyError as e:
        print(f"Error: Missing column in Stats CSV - {e}. Check your headers!")

# Run the script
process_csv_to_hierarchical_json('./backend/raw_bond_data.csv', './backend/raw_lang_names.csv', './docs/bond_data.json')