import json

with open('database.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = content.replace('const gameData = ', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

data = json.loads(json_str)
changed = False

for key, val in data.items():
    original_keywords = val.get('keywords', [])
    new_keywords = [kw for kw in original_keywords if kw != "X" and kw != ""]
    if len(original_keywords) != len(new_keywords):
        print(f"Stage {val['stage']} ({val['verseRef']}): removed X. Original: {original_keywords}")
        val['keywords'] = new_keywords
        changed = True

if changed:
    new_content = 'const gameData = ' + json.dumps(data, ensure_ascii=False, indent=4) + ';\n'
    with open('database.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Cleaned database.js")
else:
    print("No changes needed")
