import pandas as pd
import geopandas as gpd
import os
import glob
import json

# Paths
base_dir = r'c:/Users/sara/Desktop/Data/ANZ tasks/IPM/City of Playford'
shp_path = os.path.join(base_dir, 'SA1_2021', 'SA1_2021_AUST_GDA2020.shp')
js_output_path = os.path.join(base_dir, 'sports_data.js')

print("Reading Shapefile (this may take a moment)...")
gdf = gpd.read_file(shp_path)
print(f"Shapefile loaded with {len(gdf)} records.")
# Ensure SA1 code is string
gdf['SA1_CODE21'] = gdf['SA1_CODE21'].astype(str)

# Find all sport CSVs
csv_files = glob.glob(os.path.join(base_dir, 'map_*_input.csv'))
print(f"Found {len(csv_files)} sport files.")

sports_data = {}

for csv_path in csv_files:
    filename = os.path.basename(csv_path)
    # Extract sport name: map_Hockey_input.csv -> Hockey
    sport_name = filename.replace('map_', '').replace('_input.csv', '')
    print(f"Processing {sport_name}...")
    
    df = pd.read_csv(csv_path)
    # Ensure SA1 code is string
    df['Level0_Identifier'] = df['Level0_Identifier'].astype(str).str.replace('.0', '', regex=False)
    
    # Filter GDF to only those in CSV
    gdf_filtered = gdf[gdf['SA1_CODE21'].isin(df['Level0_Identifier'])]
    
    if len(gdf_filtered) == 0:
        print(f"Warning: No matching SA1s found for {sport_name}")
        continue
        
    # Merge data
    merged = gdf_filtered.merge(df, left_on='SA1_CODE21', right_on='Level0_Identifier')
    
    # Reproject to WGS84
    merged = merged.to_crs(epsg=4326)
    
    # Convert to JSON object (not string yet)
    sports_data[sport_name] = json.loads(merged.to_json())
    print(f"  Added {len(merged)} records for {sport_name}")

print("Saving to sports_data.js...")
with open(js_output_path, 'w') as f:
    f.write('var sportsData = ')
    json.dump(sports_data, f)
    f.write(';')

print(f"Successfully created {js_output_path} with {len(sports_data)} sports.")
