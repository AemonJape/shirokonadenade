import csv
import json

# The specific ranks where stat gains change
BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41]

def process_csv_to_hierarchical_json(csv_filepath, json_filepath):
    db = {}
    
    try:
        with open(csv_filepath, mode='r', encoding='cp949') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                base_char = row['BaseCharacter'].strip()
                char_name = row['Character'].strip()
                
                # Create a safe, lowercase JSON key for the specific alt
                alt_key = char_name
                
                rank = int(row['Rank'])
                stat_type = row['StatType'].strip()
                stat_gain = int(row['StatGain'])
                
                # 1. Initialize the Base Character group if it doesn't exist
                if base_char not in db:
                    db[base_char] = {}
                    
                # 2. Initialize the specific Alt within that group if it doesn't exist
                if alt_key not in db[base_char]:
                    db[base_char][alt_key] = {
                        "name": char_name,
                        "bonuses": {
                            "atk": [0] * len(BREAKPOINTS),
                            "hp": [0] * len(BREAKPOINTS),
                            "healing": [0] * len(BREAKPOINTS)
                        }
                    }
                    
                # 3. Apply the stat gain to the correct breakpoint index
                if rank in BREAKPOINTS:
                    idx = BREAKPOINTS.index(rank)
                    db[base_char][alt_key]["bonuses"][stat_type][idx] = stat_gain

        # Cleanup: Remove empty stat arrays to keep the file size minimal
        for base_char, alts in db.items():
            for alt_key, alt_data in alts.items():
                bonuses = alt_data["bonuses"]
                alt_data["bonuses"] = {k: v for k, v in bonuses.items() if any(val > 0 for val in v)}

        final_json = {"base_characters": db}
            
        with open(json_filepath, 'w', encoding='utf-8') as outfile:
            json.dump(final_json, outfile, indent=2, ensure_ascii=False)

        print(f"Success! Hierarchical JSON saved to {json_filepath}")

    except FileNotFoundError:
        print(f"Error: Could not find '{csv_filepath}'.")
    except KeyError as e:
        print(f"Error: Missing column in CSV - {e}. Check your headers!")

# Run the script
process_csv_to_hierarchical_json('./backend/raw_bond_data.csv', './bond_data.json')