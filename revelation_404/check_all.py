import json
import re

with open('database.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = content.replace('const gameData = ', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

data = json.loads(json_str)

issues = []

def clean_text(text):
    # Remove punctuation and spaces for a fuzzy match check if needed
    return re.sub(r'\s+', '', text)

for k, v in data.items():
    stage = v.get('stage')
    ref = v.get('verseRef')
    text = v.get('verseText')
    keywords = v.get('keywords', [])
    
    for kw in keywords:
        if kw == '' or kw.lower() == 'x':
            issues.append(f'[{ref}] Stage {stage}: Invalid keyword "{kw}"')
        elif kw not in text:
            # Maybe the keyword is in the text if we ignore spaces?
            if clean_text(kw) in clean_text(text):
                issues.append(f'[{ref}] Stage {stage}: Spacing mismatch for "{kw}". Verse text: {text}')
            else:
                issues.append(f'[{ref}] Stage {stage}: Keyword "{kw}" not found in verseText: {text}')

with open('all_issues.txt', 'w', encoding='utf-8') as f:
    for issue in issues:
        f.write(issue + '\n')

print(f"Found {len(issues)} issues across all chapters.")
