import re

with open('database.js', 'r', encoding='utf-8') as f:
    data = f.read()

match = re.search(r'"23": \{.*?"24":', data, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
