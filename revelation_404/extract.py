import re

with open('original_git_index.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
big_script = [s for s in scripts if 'function loadStage' in s][0]

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write('import { gameData } from "./data/database_chunked.js";\n')
    f.write('window.gameData = gameData;\n\n')
    f.write(big_script)
    f.write('\n\n// Expose all functions\n')
    funcs = set(re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', big_script))
    for func in funcs:
        f.write(f'window.{func} = {func};\n')

body_match = re.search(r'<body>(.*?)<script', content, re.DOTALL)
body_html = body_match.group(1) if body_match else ''

# Replace body contents of index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

new_idx = re.sub(r'<body>.*?</body>', f'<body>{body_html}\n    <!-- ES6 Modules -->\n    <script type="module" src="src/main.js"></script>\n</body>', idx_content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_idx)

print("Done extraction")
