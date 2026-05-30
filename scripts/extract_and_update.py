#!/usr/bin/env python3
"""
Extract product data from BSCatalogueFinal2026.pdf and update Supabase database.
Strategy: 
- Read text from each PDF page using PyMuPDF
- Match product names from image filenames against text found in PDF pages
- Extract SKU, description, price, category from matching pages
- Update database via psycopg2
"""
import fitz  # PyMuPDF
import re
import os
import psycopg2
import json

PDF_PATH = r"C:\Users\Sumit singhvi\Downloads\BSCatalogueFinal2026.pdf"
DB_URL = "postgresql://postgres:sumitiscool%219@db.ktpivhchncodazcqptou.supabase.co:5432/postgres"

# Product image filenames (without timestamp prefix and extension)
# These are the exact names from the image filenames in public/product-images/
PRODUCT_IMAGE_NAMES = [
    "3-Way-Elephant-Rocker",
    "3-Way-Pony-Rocker",
    "6-in-1-Block-Table",
    "Adjustable-Chair-H-26(cm)",
    "Baby-Bear-Zone-Beige",
    "Baby-Slide-Senior",
    "Castle-Slide",
    "Classic-Play-Castle",
    "Dolphin-Swing-Car",
    "Duck-Rocker",
    "High-Density-PU-Foam-cubes",
    "Jumbo-Playstation",
    "Magic-Car-Train",
    "Moon-Piece-Table",
    "My-Big-Car",
    "My-Play-Table",
    "Plastic-Ball-",
    "Plastic-Chair-H-12",
    "Play-junction",
    "Rectangle-Table",
    "Scoot-Hoot",
    "Soft-Blocks(12pcs-set)",
    "Square-Table",
    "Zoom-Chair-H-38.5(cm)",
]

def normalize_name(name):
    """Normalize a name for fuzzy matching."""
    # Remove hyphens, underscores, extra spaces, convert to lowercase
    n = name.replace("-", " ").replace("_", " ").replace("(", " ").replace(")", " ")
    n = re.sub(r'\s+', ' ', n).strip().lower()
    return n

def extract_page_text(page):
    """Extract text from a PDF page."""
    return page.get_text("text")

def parse_price(text):
    """Extract MRP price from text."""
    # Look for patterns like "MRP : ₹ 5,190" or "MRP : Rs. 5,190" or "MRP : 5190"
    patterns = [
        r'MRP\s*:\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)',
        r'MRP\s*[:\-]\s*([\d,]+)',
        r'₹\s*([\d,]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '')
            try:
                return int(price_str)
            except ValueError:
                pass
    return None

def parse_sku(text):
    """Extract SKU from text."""
    # SKUs look like: BS-111, BSOK-260S, BSL-0448, BSOK-BCD076
    pattern = r'\b(BS[A-Z\-]*\d+[A-Z]*)\b'
    match = re.search(pattern, text)
    if match:
        return match.group(1)
    return None

def parse_category(text):
    """Extract category from page heading."""
    # Categories appear at the top of the page in uppercase
    categories = [
        "CLASSROOM FURNITURE",
        "WOODEN CLASSROOM FURNITURE",
        "OUTDOOR PLAY EQUIPMENT",
        "INDOOR PLAY EQUIPMENT",
        "RIDE ON",
        "SOFT PLAY",
        "ACTIVITY GYM",
        "ROCKER",
        "SWING",
        "SLIDE",
        "BALL POOL",
        "TRAMPOLINE",
        "PLAY GYM",
        "SENSORY",
        "FOAM",
        "BLOCKS",
        "TABLES AND CHAIRS",
        "PLAY STATION",
        "PLAY AREA",
        "PLAY HOUSE",
        "ROCKING",
    ]
    text_upper = text.upper()
    for cat in categories:
        if cat in text_upper:
            return cat.title()
    
    # Try to find category from first non-empty line that's all caps
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:5]:  # Check first 5 lines
        if line.isupper() and len(line) > 3 and not re.match(r'^BS[A-Z\-]*\d', line):
            return line.title()
    
    return None

def search_product_in_pages(doc, product_name):
    """Search for a product name across all PDF pages."""
    normalized_product = normalize_name(product_name)
    
    results = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = extract_page_text(page)
        normalized_text = normalize_name(text)
        
        # Check if product name words appear in this page
        product_words = normalized_product.split()
        
        # Remove common words that might cause false positives
        significant_words = [w for w in product_words if len(w) > 2 and w not in ['the', 'and', 'for', 'with', 'big', 'small']]
        
        if not significant_words:
            continue
        
        matches = sum(1 for word in significant_words if word in normalized_text)
        match_ratio = matches / len(significant_words)
        
        if match_ratio >= 0.6:  # At least 60% of significant words match
            price = parse_price(text)
            sku = parse_sku(text)
            category = parse_category(text)
            results.append({
                'page': page_num + 1,
                'match_ratio': match_ratio,
                'text': text[:500],
                'price': price,
                'sku': sku,
                'category': category
            })
    
    return sorted(results, key=lambda x: x['match_ratio'], reverse=True)

def get_db_products(conn):
    """Get all products from database."""
    cur = conn.cursor()
    cur.execute("SELECT id, name, sku_name, category, price_per_unit, description, image_url FROM products ORDER BY name")
    rows = cur.fetchall()
    products = []
    for row in rows:
        products.append({
            'id': row[0],
            'name': row[1],
            'sku_name': row[2],
            'category': row[3],
            'price_per_unit': row[4],
            'description': row[5],
            'image_url': row[6],
        })
    return products

def get_product_name_from_image_url(image_url):
    """Extract product name from image URL."""
    if not image_url:
        return None
    # image_url is like "/product-images/1779822678611-3-Way-Elephant-Rocker.png"
    basename = os.path.basename(image_url)
    # Remove timestamp prefix (digits-)
    name_with_ext = re.sub(r'^\d+-', '', basename)
    # Remove extension
    name = os.path.splitext(name_with_ext)[0]
    return name

def main():
    print("Opening PDF...")
    doc = fitz.open(PDF_PATH)
    print(f"Total pages: {len(doc)}")
    
    print("\nConnecting to database...")
    conn = psycopg2.connect(DB_URL)
    
    products = get_db_products(conn)
    print(f"Found {len(products)} products in database")
    
    # Results to store
    update_data = []
    unmatched = []
    
    for product in products:
        image_url = product.get('image_url')
        if not image_url:
            print(f"  [SKIP] {product['name']} - no image URL")
            continue
        
        image_name = get_product_name_from_image_url(image_url)
        if not image_name:
            continue
        
        print(f"\nSearching for: {image_name}")
        results = search_product_in_pages(doc, image_name)
        
        if results:
            best = results[0]
            print(f"  -> Found on page {best['page']} (match: {best['match_ratio']:.0%})")
            print(f"     Price: {best['price']}, SKU: {best['sku']}, Category: {best['category']}")
            
            update_data.append({
                'id': product['id'],
                'name': product['name'],
                'image_name': image_name,
                'page': best['page'],
                'price': best['price'],
                'sku': best['sku'],
                'category': best['category'],
                'description': None,  # Will be set from product name + dimensions
                'text': best['text'],
            })
        else:
            print(f"  -> NOT FOUND in PDF")
            unmatched.append({'name': product['name'], 'image_name': image_name})
    
    doc.close()
    
    print("\n\n=== SUMMARY ===")
    print(f"Matched: {len(update_data)}")
    print(f"Unmatched: {len(unmatched)}")
    
    if unmatched:
        print("\nUnmatched products:")
        for u in unmatched:
            print(f"  - {u['name']} (image: {u['image_name']})")
    
    # Save results to JSON for review
    output_path = r"d:\work\OmEnterprisesOMS\scripts\extraction_results.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({'matched': update_data, 'unmatched': unmatched}, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to {output_path}")
    
    # Apply updates
    print("\nApplying database updates...")
    cur = conn.cursor()
    updated = 0
    
    for item in update_data:
        # Build description from the page text
        # Try to extract product description line from text
        desc = extract_description_from_text(item['text'], item['image_name'])
        
        # Only update fields that we found
        updates = {}
        if item['price']:
            updates['price_per_unit'] = item['price']
        if item['sku']:
            updates['sku_name'] = item['sku']
        if item['category']:
            # Map category name to actual category in DB
            updates['category'] = map_category(item['category'])
        if desc:
            updates['description'] = desc
        
        if not updates:
            print(f"  [SKIP] {item['name']} - nothing to update")
            continue
        
        set_clauses = ', '.join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values()) + [item['id']]
        
        try:
            cur.execute(f"UPDATE products SET {set_clauses} WHERE id = %s", values)
            print(f"  [OK] Updated {item['name']}: price={item['price']}, sku={item['sku']}, category={updates.get('category')}")
            updated += 1
        except Exception as e:
            print(f"  [ERROR] {item['name']}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\nDone! Updated {updated} products.")

def extract_description_from_text(text, product_name):
    """Extract a meaningful description from page text."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Look for dimension lines like "L54"*W30"*H20""
    desc_parts = []
    for line in lines:
        # Skip category headers, MRP lines, SKU lines
        if any(skip in line.upper() for skip in ['MRP', 'COLORS', 'BEST SELLER', 'BABY STEPS']):
            continue
        if re.match(r'^BS[A-Z\-]*\d', line):  # SKU line
            continue
        if line.isupper() and len(line.split()) <= 4:  # Category header
            continue
        
        # Keep lines with dimensions or product description
        if re.search(r'[LWDHlwdh]\s*[\d\'\"*]|cm|inch|feet|\d+\s*[xX]\s*\d+', line):
            desc_parts.append(line)
        elif re.search(r'[A-Z][a-z].*\d', line):  # Mixed case with numbers (product descriptions)
            desc_parts.append(line)
    
    if desc_parts:
        return ' | '.join(desc_parts[:3])  # Join up to 3 descriptive lines
    
    return None

def map_category(raw_category):
    """Map raw category from PDF to a standard category name."""
    raw_upper = raw_category.upper()
    
    if 'CLASSROOM' in raw_upper:
        return 'Classroom Furniture'
    if 'OUTDOOR' in raw_upper:
        return 'Outdoor Play Equipment'
    if 'INDOOR' in raw_upper:
        return 'Indoor Play Equipment'
    if 'RIDE' in raw_upper:
        return 'Ride On'
    if 'SOFT' in raw_upper and 'PLAY' in raw_upper:
        return 'Soft Play'
    if 'ROCKER' in raw_upper:
        return 'Rockers'
    if 'SWING' in raw_upper:
        return 'Swings'
    if 'SLIDE' in raw_upper:
        return 'Slides'
    if 'BALL' in raw_upper:
        return 'Ball Pool'
    if 'FOAM' in raw_upper:
        return 'Foam'
    if 'BLOCK' in raw_upper:
        return 'Blocks'
    if 'PLAY' in raw_upper and 'STATION' in raw_upper:
        return 'Play Stations'
    if 'PLAY' in raw_upper and 'HOUSE' in raw_upper:
        return 'Play House'
    if 'SENSORY' in raw_upper:
        return 'Sensory'
    
    return raw_category.title()

if __name__ == '__main__':
    main()
