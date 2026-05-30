import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(dotenv_path="../.env")

# Ensure required env vars are present
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not found in .env")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def seed_products():
    json_path = "products.json"
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return
        
    products_data = load_json(json_path)
    if not products_data:
        print("No products found in JSON or file is empty.")
        return

    print(f"Loaded {len(products_data)} products from JSON.")

    products_to_insert = []
    
    for row in products_data:
        # Expected mapping:
        # Item description/name -> name
        # item code -> sku_name
        
        name = row.get("name", "").strip()
        sku_name = row.get("item_code", "").strip()
        
        if not name:
            continue

        products_to_insert.append({
            "name": name,
            "sku_name": sku_name,
            "price_per_unit": 0
        })

    # Batch insert in chunks of 500
    batch_size = 500
    total_inserted = 0
    
    for i in range(0, len(products_to_insert), batch_size):
        batch = products_to_insert[i:i + batch_size]
        try:
            response = supabase.table("products").insert(batch).execute()
            if response.data:
                total_inserted += len(response.data)
        except Exception as e:
            print(f"Error inserting products batch {i} to {i + batch_size}: {e}")

    print(f"Successfully inserted {total_inserted} products.")

if __name__ == "__main__":
    seed_products()
