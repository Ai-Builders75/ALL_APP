import fitz
import os
import json
import urllib.request
from bs4 import BeautifulSoup
import re

def fetch_verses(chapter):
    """Fetch verses for a given chapter of Revelation from holybible.or.kr"""
    url = f"http://www.holybible.or.kr/B_RHV/cgi/bibleftxt.php?VR=RHV&VL=66&CN={chapter}&CV=99"
    try:
        req = urllib.request.urlopen(url)
        soup = BeautifulSoup(req.read(), 'html.parser', from_encoding='euc-kr')
        # Holybible HTML nests <li> tags. The first line of each <li> text is the actual verse.
        verses = [li.text.strip().split('\n')[0].strip() for li in soup.find_all('li')]
        return verses
    except Exception as e:
        print(f"Error fetching chapter {chapter}: {e}")
        return []

def build_app():
    print("Starting 404 Builder Agent...")
    
    source_dir = r"d:\세계 최고의 1인기업\temp_analysis\404"
    assets_dir = r"d:\세계 최고의 1인기업\memorization_app\assets"
    db_path = r"d:\세계 최고의 1인기업\memorization_app\database.js"
    
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        print(f"Created assets directory at {assets_dir}")
        
    print("Processing all 22 PDFs and fetching verses for 404 Keywords...")
    
    game_data = {}
    global_stage_idx = 1
    
    pdf_files = [f"404 핵심 키워드 그림카드 {i}장.pdf" for i in range(1, 23)]
    
    for chapter_idx, pdf_name in enumerate(pdf_files, 1):
        pdf_path = os.path.join(source_dir, pdf_name)
        if not os.path.exists(pdf_path):
            print(f"Warning: File not found - {pdf_name}")
            continue
            
        print(f"Fetching Bible Text for Chapter {chapter_idx}...")
        chapter_verses = fetch_verses(chapter_idx)
            
        try:
            doc = fitz.open(pdf_path)
            num_pages = len(doc)
            # Iterate through answer pages (odd indices: 1, 3, 5...)
            for page_idx in range(1, num_pages, 2):
                page = doc[page_idx]
                
                # 1. Extract Image
                card_index = page_idx // 2 + 1
                output_filename = f"ch{chapter_idx}_{card_index}.jpg"
                output_path = os.path.join(assets_dir, output_filename)
                
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                pix.save(output_path)
                
                # 2. Extract Keywords from PDF text
                text_lines = page.get_text().strip().split('\n')
                text_lines = [t.strip() for t in text_lines if t.strip()]
                
                if not text_lines:
                    continue
                    
                verse_ref = text_lines[0] # e.g. "계 1:1"
                keywords = text_lines[1:]
                keywords = [k.replace("~", "").strip() for k in keywords if k]
                
                # 3. Match with Bible Verse Text
                # Parse verse number from "계 1:12" -> 12
                verse_num_match = re.search(r':(\d+)', verse_ref)
                full_verse_text = ""
                if verse_num_match and chapter_verses:
                    v_num = int(verse_num_match.group(1))
                    if 1 <= v_num <= len(chapter_verses):
                        full_verse_text = chapter_verses[v_num - 1]
                
                # If extraction fails, fallback to empty
                if not full_verse_text:
                    full_verse_text = f"({verse_ref} 본문 내용)"

                # Store in database
                game_data[global_stage_idx] = {
                    "stage": global_stage_idx,
                    "chapter": chapter_idx,
                    "image": f"assets/{output_filename}",
                    "verseRef": verse_ref,
                    "verseText": full_verse_text,
                    "keywords": keywords
                }
                
                global_stage_idx += 1
                
            print(f"Processed Chapter {chapter_idx} (Total stages so far: {global_stage_idx-1})")
        except Exception as e:
            print(f"Error processing {pdf_name}: {e}")
            
    # Write database.js
    print(f"Writing {global_stage_idx-1} stages to database.js...")
    with open(db_path, 'w', encoding='utf-8') as f:
        f.write("const gameData = ")
        f.write(json.dumps(game_data, ensure_ascii=False, indent=4))
        f.write(";\n")
        
    print("Builder Agent Finished Successfully! 404 stages generated.")

if __name__ == "__main__":
    build_app()
