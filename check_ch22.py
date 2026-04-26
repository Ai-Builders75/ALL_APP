import json

with open('database.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = content.replace('const gameData = ', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

data = json.loads(json_str)

ch22_data = {k: v for k, v in data.items() if v.get('chapter') == 22}
print(f'Chapter 22 has {len(ch22_data)} verses.')

issues = []
for k, v in ch22_data.items():
    stage = v['stage']
    ref = v['verseRef']
    text = v['verseText']
    keywords = v['keywords']
    
    for kw in keywords:
        if kw == '' or kw.lower() == 'x':
            issues.append(f'[{ref}] Stage {stage}: Invalid keyword "{kw}"')
        elif kw not in text:
            issues.append(f'[{ref}] Stage {stage}: Keyword "{kw}" not found in verseText: {text}')

if issues:
    print('Found issues in Chapter 22:')
    for issue in issues:
        print(issue)
else:
    print('No missing keywords or placeholder errors found in Chapter 22.')
