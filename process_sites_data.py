import pandas as pd
import geopandas as gpd
import os
import json

# Paths
base_dir = r'c:/Users/sara/Desktop/Data/ANZ tasks/IPM/City of Playford'
shp_path = os.path.join(base_dir, 'SA1_2021', 'SA1_2021_AUST_GDA2020.shp')
competitors_csv_path = os.path.join(base_dir, 'combined_competitors.csv')
# We need a reference CSV to get the list of 231 SA1s - using Hockey as reference
reference_csv_path = os.path.join(base_dir, 'map_Hockey_input.csv')

sa1_output_path = os.path.join(base_dir, 'sites_sa1_boundaries.js')
sites_output_path = os.path.join(base_dir, 'competitor_sites.js')

print("Reading Reference CSV to identify SA1s...")
ref_df = pd.read_csv(reference_csv_path)
ref_df['Level0_Identifier'] = ref_df['Level0_Identifier'].astype(str).str.replace('.0', '', regex=False)
target_sa1s = ref_df['Level0_Identifier'].unique()
print(f"Identified {len(target_sa1s)} target SA1s.")

print("Reading Shapefile...")
gdf = gpd.read_file(shp_path)
gdf['SA1_CODE21'] = gdf['SA1_CODE21'].astype(str)

print("Filtering Shapefile...")
gdf_filtered = gdf[gdf['SA1_CODE21'].isin(target_sa1s)]
print(f"Filtered to {len(gdf_filtered)} SA1 boundaries.")

# Reproject to WGS84
gdf_filtered = gdf_filtered.to_crs(epsg=4326)

# Save SA1 boundaries
print("Saving SA1 boundaries...")
with open(sa1_output_path, 'w') as f:
    f.write('var sa1Boundaries = ')
    f.write(gdf_filtered.to_json())
    f.write(';')

print("Reading Competitor Sites...")
sites_df = pd.read_csv(competitors_csv_path)
# Convert to list of dictionaries
sites_data = sites_df.to_dict(orient='records')
print(f"Loaded {len(sites_data)} competitor sites.")

# Save Competitor Sites
print("Saving Competitor Sites...")
with open(sites_output_path, 'w') as f:
    f.write('var competitorSites = ')
    json.dump(sites_data, f)
    f.write(';')

print("Data processing complete.")
