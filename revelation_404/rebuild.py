import re

with open('original_git_index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract styles
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
old_styles = style_match.group(1) if style_match else ""

# Extract the main script (the one after database.js)
script_match = re.search(r'<script src="database\.js"></script>\s*<script>(.*?)</script>\s*</body>', content, re.DOTALL)
if not script_match:
    script_match = re.search(r'<script>(.*?)</script>\s*</body>', content, re.DOTALL)

old_script = script_match.group(1) if script_match else ""

# Extract body inner HTML (excluding the last scripts)
body_match = re.search(r'<body>(.*?)<script', content, re.DOTALL)
body_html = body_match.group(1) if body_match else ""

# Extract AdSense & InApp blocks from head
head_match = re.search(r'<head>(.*?)</head>', content, re.DOTALL)
head_html = head_match.group(1) if head_match else ""

# We will just write the script to src/main.js
# But we need to make all functions global because HTML uses onclick="func()"
# We can do this by wrapping the script and explicitly setting window.xxx
with open('src/main.js', 'w', encoding='utf-8') as f:
    # First, import database_chunked.js (which has gameData)
    f.write('import { gameData } from "./data/database_chunked.js";\n\n')
    f.write('window.gameData = gameData;\n\n')
    f.write(old_script)
    
    # Now append a snippet to attach all functions to window
    f.write('''
// Automatically expose all functions to window for onclick handlers
Object.getOwnPropertyNames(window).forEach(name => {
    // We don't want to overwrite existing window properties, but if they are functions defined here...
    // Actually, in ES6 modules, top-level functions aren't on window.
    // We need to explicitly attach them.
});
''')

# Actually, the simplest way to attach to window is to run a regex over the script and find function names.
funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', old_script)
with open('src/main.js', 'a', encoding='utf-8') as f:
    for func in set(funcs):
        f.write(f'window.{func} = {func};\n')

# Now build the new index.html
new_index = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
    <title>OMNIARK: 기억의 광산 (Android/PWA)</title>
    
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#0f172a">
    <link rel="apple-touch-icon" href="./icon-192x192.png">

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7902247777992049" crossorigin="anonymous"></script>
    
    <!-- 인앱 브라우저 차단 스크립트 -->
    <script>
        document.addEventListener("DOMContentLoaded", function() {{
            var userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.match(/kakaotalk/i) || userAgent.match(/line/i) || userAgent.match(/inapp/i) || userAgent.match(/naver/i) || userAgent.match(/snapchat/i) || userAgent.match(/everytime/i) || userAgent.match(/instagram/i) || userAgent.match(/facebook/i)) {{
                var inappModal = document.createElement('div');
                inappModal.style.position = 'fixed';
                inappModal.style.top = '0';
                inappModal.style.left = '0';
                inappModal.style.width = '100vw';
                inappModal.style.height = '100vh';
                inappModal.style.backgroundColor = '#1e293b';
                inappModal.style.color = 'white';
                inappModal.style.zIndex = '999999';
                inappModal.style.display = 'flex';
                inappModal.style.flexDirection = 'column';
                inappModal.style.alignItems = 'center';
                inappModal.style.justifyContent = 'center';
                inappModal.style.padding = '30px';
                inappModal.style.textAlign = 'center';
                
                inappModal.innerHTML = `
                    <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 20px; word-break: keep-all; line-height: 1.4;">현재 카카오톡(또는 인앱 확장 브라우저)으로 접속하셨습니다.</h2>
                    <p style="font-size: 1.1rem; color: #94a3b8; margin-bottom: 40px; word-break: keep-all; line-height: 1.5;">정상적인 앱 구동을 위해서는 크롬이나 사파리 같은 기본 인터넷 브라우저로 접속해야 합니다.</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); width: 100%;">
                        <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 10px;">👇 이렇게 해주세요 👇</p>
                        <p style="font-size: 1.1rem; margin-bottom: 10px;">화면 우측 하단(또는 상단)의 <b>[점 3개]</b> 버튼을 누른 후</p>
                        <p style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">[다른 브라우저로 열기]</p>
                        <p style="font-size: 1.1rem; margin-top: 10px;">를 선택해주세요!</p>
                    </div>
                `;
                document.body.appendChild(inappModal);
            }}
        }});
    </script>

    <!-- 클린 아키텍처 스타일 & 프리미엄 폰트 -->
    <link rel="stylesheet" href="src/styles/main.css">
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
</head>
<body>
    {body_html}
    
    <!-- ES6 모듈 로드 -->
    <script type="module" src="src/main.js"></script>
</body>
</html>
"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_index)

print("Rebuild complete!")
