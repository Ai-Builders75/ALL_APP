import json

with open('database.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = content.replace('const gameData = ', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

data = json.loads(json_str)

# Fix Stage 385 (22:2)
kw_385 = data['385']['keywords']
if "생명나무" in kw_385:
    kw_385[kw_385.index("생명나무")] = "생명 나무"

# Fix Stage 386 (22:3)
kw_386 = data['386']['keywords']
if "저주 없음" in kw_386:
    kw_386[kw_386.index("저주 없음")] = "저주가 없으며"

# Fix Stage 388 (22:5)
kw_388 = data['388']['keywords']
if "왕 노릇" in kw_388:
    kw_388[kw_388.index("왕 노릇")] = "왕노릇"

# Fix Stage 404 (22:21)
kw_404 = data['404']['keywords']
if "은혜, 아멘" in kw_404:
    kw_404.remove("은혜, 아멘")
    kw_404.extend(["은혜가", "아멘"])

new_content = 'const gameData = ' + json.dumps(data, ensure_ascii=False, indent=4) + ';\n'
with open('database.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Chapter 22 fixed successfully.")
