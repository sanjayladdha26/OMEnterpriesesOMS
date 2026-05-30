#!/usr/bin/env python3
"""Export all PDF pages as images."""
import fitz
import os

PDF_PATH = r"C:\Users\Sumit singhvi\Downloads\BSCatalogueFinal2026.pdf"
OUTPUT_DIR = r"d:\work\OmEnterprisesOMS\scripts\pdf_pages"

os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)
print(f"Total pages: {len(doc)}")

for page_num in range(len(doc)):
    page = doc[page_num]
    # Render at 120 DPI (smaller for faster processing but still readable)
    mat = fitz.Matrix(120/72, 120/72)
    pix = page.get_pixmap(matrix=mat)
    out_path = os.path.join(OUTPUT_DIR, f"page_{page_num+1:03d}.png")
    pix.save(out_path)
    if (page_num + 1) % 10 == 0:
        print(f"Exported {page_num + 1} pages...")

doc.close()
print(f"Done! All {len(doc)} pages exported to {OUTPUT_DIR}")
