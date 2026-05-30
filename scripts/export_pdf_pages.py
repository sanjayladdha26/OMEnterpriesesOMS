#!/usr/bin/env python3
"""Export some sample pages from the PDF as images to understand layout."""
import fitz
import os

PDF_PATH = r"C:\Users\Sumit singhvi\Downloads\BSCatalogueFinal2026.pdf"
OUTPUT_DIR = r"d:\work\OmEnterprisesOMS\scripts\pdf_samples"

os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)

# Export pages 3-8 as samples (first few product pages likely)
sample_pages = [2, 3, 4, 5, 6, 7, 8, 9, 10]

for page_num in sample_pages:
    if page_num < len(doc):
        page = doc[page_num]
        # Render at 150 DPI for a manageable preview
        mat = fitz.Matrix(150/72, 150/72)
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(OUTPUT_DIR, f"page_{page_num+1}.png")
        pix.save(out_path)
        print(f"Saved page {page_num+1} to {out_path}")

doc.close()
print("Done!")
