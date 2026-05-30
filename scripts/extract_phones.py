import pandas as pd
import json

df = pd.read_excel('scripts/brokers.xlsx', header=3)
data = []

# Columns J, K, L, M are at indices 9, 10, 11, 12 in the 0-indexed columns.
# Column A is at index 0
for index, row in df.iterrows():
    name = row.iloc[0]
    if pd.isna(name):
        continue
    
    # We want to convert phone numbers to strings. If they are floats (like 9876543210.0), we need to handle that.
    phones = []
    for col_idx in [9, 10, 11, 12]:
        val = row.iloc[col_idx]
        if not pd.isna(val):
            # Convert to string and strip .0 if it's a float
            s = str(val).strip()
            if s.endswith('.0'):
                s = s[:-2]
            if s and s.lower() != 'nan':
                phones.append(s)
                
    if phones:
        # Join multiple numbers with a comma and space
        phone_str = ', '.join(phones)
        data.append({
            'name': str(name).strip(),
            'phone': phone_str
        })

with open('scripts/brokers_phones.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Extracted {len(data)} brokers with phone numbers")
