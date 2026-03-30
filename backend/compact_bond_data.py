import csv
from collections import defaultdict
import os

def compact_csv(input_filepath, output_filepath):
    """
    Reads a long-form CSV of bond stats and converts it into a compact,
    wide-form CSV, with one row per character/stat combination.
    """
    # The specific ranks where stat gains change, these will be the new columns
    BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41]
    
    # Use a nested dictionary to store the data: 
    # {(base_char, char, stat_type): {rank: gain, ...}}
    data = defaultdict(lambda: defaultdict(int))

    try:
        with open(input_filepath, mode='r', encoding='utf-8-sig') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                base_char = row['BaseCharacter']
                char = row['Character']
                stat_type = row['StatType']
                rank = int(row['Rank'])
                stat_gain = int(row['StatGain'])
                
                # Only process ranks that are in our breakpoints
                if rank in BREAKPOINTS:
                    key = (base_char, char, stat_type)
                    data[key][rank] = stat_gain
    except FileNotFoundError:
        print(f"Error: Could not find '{input_filepath}'.")
        return
    except KeyError as e:
        print(f"Error: Missing column in input CSV - {e}. Check your headers!")
        return

    # Write the compacted data to the output file
    try:
        with open(output_filepath, mode='w', encoding='utf-8-sig', newline='') as outfile:
            header = ['BaseCharacter', 'Character', 'StatType'] + [str(r) for r in BREAKPOINTS]
            writer = csv.writer(outfile)
            writer.writerow(header)
            
            for key in sorted(data.keys()):
                base_char, char, stat_type = key
                output_row = [base_char, char, stat_type] + [data[key].get(rank, 0) for rank in BREAKPOINTS]
                writer.writerow(output_row)

        print(f"Successfully compacted CSV and saved to {output_filepath}")

    except IOError:
        print(f"Error: Could not write to '{output_filepath}'.")

if __name__ == '__main__':
    # Assuming the script is in the 'backend' folder, and data is also there.
    # The output will be created in the same folder.
    script_dir = os.path.dirname(__file__)
    input_csv = os.path.join(script_dir, 'raw_bond_data.csv')
    output_csv = os.path.join(script_dir, 'bond_data.csv')
    compact_csv(input_csv, output_csv)