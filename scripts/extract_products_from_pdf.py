#!/usr/bin/env python3
"""
Extract product data from BSCatalogueFinal2026.pdf.
Outputs a JSON file with the extracted data for each product found in the PDF.
"""
import fitz  # PyMuPDF
import re
import os
import json

PDF_PATH = r"C:\Users\Sumit singhvi\Downloads\BSCatalogueFinal2026.pdf"
OUTPUT_PATH = r"d:\work\OmEnterprisesOMS\scripts\extracted_products.json"

# Product image filenames (without timestamp prefix and extension)
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
    n = name.replace("-", " ").replace("_", " ").replace("(", " ").replace(")", " ")
    n = re.sub(r'\s+', ' ', n).strip().lower()
    return n

def parse_price(text):
    """Extract MRP price from text."""
    patterns = [
        r'MRP\s*:\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)',
        r'MRP\s*[:\-]\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)',
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
    patterns = [
        r'\b(BSOK-[A-Z0-9]+)\b',
        r'\b(BSL-[A-Z0-9]+)\b',
        r'\b(BS-[A-Z0-9]+)\b',
        r'\b(BS[A-Z]+-[A-Z0-9]+)\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None

def parse_category(text):
    """Extract category from page heading - usually first line."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Category is usually at top of page in UPPERCASE
    for line in lines[:3]:
        # Skip very short lines and lines that look like SKUs
        if len(line) < 4:
            continue
        if re.match(r'^BS', line) and any(c.isdigit() for c in line):
            continue
        # If line is uppercase (or mostly), it's likely a category
        if line.isupper() and not re.search(r'\d{3,}', line):
            return line
    
    return None

def extract_product_description(text, product_name):
    """Extract product description (name + dimensions) from page text."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    desc_lines = []
    in_product_block = False
    
    for i, line in enumerate(lines):
        # Skip MRP, COLORS, logo lines
        if any(skip in line.upper() for skip in ['MRP', 'COLORS', 'BEST SELLER', 'BABY STEP', '₹']):
            continue
        # Skip empty or very short lines  
        if len(line) < 2:
            continue
        # Skip category headers (all caps, short)
        if line.isupper() and len(line.split()) <= 5 and not any(c.isdigit() for c in line):
            continue
        
        # Look for product name and dimension lines
        # Dimension patterns: L54"*W30"*H20" or D-122*122 or L122'*W60'*H36-52(cms)
        is_dimension = bool(re.search(r'[LWDHlwdh]\s*[\:\-]?\s*[\d\'"*]|cm|inch|feet|\d+\s*[xX*]\s*\d+|\d+\'\*\d+', line))
        
        # Product name lines: mixed case, not all caps, not SKU
        is_sku = bool(re.match(r'^BS[A-Z\-]*\d', line))
        is_desc = not is_sku and not line.isupper() and len(line) > 3
        
        if is_dimension or is_desc:
            desc_lines.append(line)
        
        if len(desc_lines) >= 4:
            break
    
    if desc_lines:
        return ' | '.join(desc_lines)
    return None

def search_product_in_pdf(doc, product_name):
    """Search for a product name across all PDF pages."""
    normalized_product = normalize_name(product_name)
    product_words = normalized_product.split()
    
    # Filter to significant words (length > 2, not common words)
    stop_words = {'the', 'and', 'for', 'with', 'set', 'big', 'small', 'mini', 'cm', 'h', 'w', 'l'}
    significant_words = [w for w in product_words if len(w) > 2 and w not in stop_words]
    
    if not significant_words:
        significant_words = product_words
    
    best_results = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = extract_page_text_raw(page)
        normalized_text = normalize_name(text)
        
        matches = sum(1 for word in significant_words if word in normalized_text)
        match_ratio = matches / len(significant_words) if significant_words else 0
        
        if match_ratio >= 0.5:
            price = parse_price(text)
            sku = parse_sku(text)
            category = parse_category(text)
            desc = extract_product_description(text, product_name)
            
            best_results.append({
                'page': page_num + 1,
                'match_ratio': match_ratio,
                'price': price,
                'sku': sku,
                'category': category,
                'description': desc,
                'raw_text': text[:600],
            })
    
    return sorted(best_results, key=lambda x: x['match_ratio'], reverse=True)

def extract_page_text_raw(page):
    """Extract raw text from a PDF page."""
    return page.get_text("text")

def main():
    print(f"Opening PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    print(f"Total pages: {len(doc)}")
    
    results = {}
    unmatched = []
    
    for image_name in PRODUCT_IMAGE_NAMES:
        print(f"\nSearching: {image_name}")
        matches = search_product_in_pdf(doc, image_name)
        
        if matches:
            best = matches[0]
            print(f"  -> Page {best['page']} ({best['match_ratio']:.0%}) | Price: {best['price']} | SKU: {best['sku']} | Cat: {best['category']}")
            results[image_name] = best
        else:
            print(f"  -> NOT FOUND")
            unmatched.append(image_name)
    
    doc.close()
    
    # Save results
    output = {
        'matched': {k: {
            'page': v['page'],
            'price': v['price'],
            'sku': v['sku'],
            'category': v['category'],
            'description': v['description'],
            'match_ratio': v['match_ratio'],
        } for k, v in results.items()},
        'unmatched': unmatched
    }
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n=== DONE ===")
    print(f"Matched: {len(results)}")
    print(f"Unmatched: {len(unmatched)}")
    if unmatched:
        print("Unmatched:", unmatched)
    print(f"Saved to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
