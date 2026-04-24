import fitz
import os

pdf_path = r"d:\세계 최고의 1인기업\temp_analysis\404\404 핵심 키워드 그림카드 1장.pdf"
output_path = r"d:\세계 최고의 1인기업\memorization_app\assets\ch1.jpg"

try:
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Higher resolution
    pix.save(output_path)
    print("Image extracted to", output_path)
except Exception as e:
    print("Error:", e)
