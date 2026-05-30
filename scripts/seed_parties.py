import json
import os
from supabase import create_client, Client

# ============================================================
# Setup instructions:
# 1. Install supabase python client: pip install supabase
# 2. Set your Supabase URL and Key below or as env variables
# 3. Create a 'parties.json' file in the same directory with your data
# 4. Run the script: python seed_parties.py
# ============================================================

from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "your_supabase_project_url")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "your_supabase_anon_key")

def seed_data():
    if SUPABASE_URL == "your_supabase_project_url":
        print("Please set your SUPABASE_URL and SUPABASE_KEY")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    with open('parties.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} parties from JSON.")
    
    # Extract unique agents from the broker field
    agent_names = set(item.get("broker", "").strip() for item in data if item.get("broker"))
    
    print(f"Found {len(agent_names)} unique agents. Upserting agents...")
    agent_map = {} # Maps agent name to their UUID
    
    for name in agent_names:
        # Create a simple code for login (e.g. lowercase without spaces)
        code = name.lower().replace(" ", "").replace(".", "")
        
        # Upsert agent
        try:
            # We first try to fetch the agent by name
            existing = supabase.table("agents").select("id").eq("name", name).execute()
            if existing.data:
                agent_map[name] = existing.data[0]["id"]
            else:
                response = supabase.table("agents").insert({
                    "name": name,
                    "code": code
                }).execute()
                if response.data:
                    agent_map[name] = response.data[0]["id"]
                    print(f"  - Created agent: {name} (Code: {code})")
        except Exception as e:
            print(f"Error handling agent {name}: {e}")

    print("Upserting parties...")
    parties_to_insert = []
    for item in data:
        broker_name = item.get("broker", "").strip()
        agent_id = agent_map.get(broker_name)
        
        parties_to_insert.append({
            "account_name": item.get("account_name", "Unknown"),
            "address": item.get("address", ""),
            "city": item.get("city", ""),
            "pin_code": item.get("pin_code", ""),
            "state": item.get("state", ""),
            "gstin": item.get("gstin", ""),
            "phone1": item.get("phone1", ""),
            "phone2": item.get("phone2", ""),
            "transport": item.get("transport", ""),
            "delivery_city": item.get("delivery_city", ""),
            "agent_id": agent_id
        })
        
    # Batch insert parties
    if parties_to_insert:
        response = supabase.table("parties").insert(parties_to_insert).execute()
        print(f"Successfully inserted {len(response.data)} parties.")

if __name__ == "__main__":
    seed_data()
