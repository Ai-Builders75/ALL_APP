import re
import sys

def main():
    try:
        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\full_script.js', 'r', encoding='utf-8') as f:
            content = f.read()

        keyboard_funcs = ['renderKeyboard', 'handleInput']
        typing_funcs = ['handleTypingKeypress', 'handleTypingInput', 'getChoseong', 'hidePremiumHint', 'showChoseongHint', 'submitTyping']

        def extract_function(name, text):
            pattern = r'function\s+' + name + r'\s*\([^)]*\)\s*\{'
            match = re.search(pattern, text)
            if not match:
                print(f"NOT FOUND: {name}")
                return '', text
            
            start_idx = match.start()
            brace_count = 0
            in_string = False
            string_char = ''
            in_comment = False
            
            idx = start_idx
            while idx < len(text):
                char = text[idx]
                if not in_string and not in_comment:
                    if char in ['"', "'", '`']:
                        in_string = True
                        string_char = char
                    elif char == '/' and idx + 1 < len(text) and text[idx+1] == '/':
                        in_comment = True
                    elif char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            func_text = text[start_idx:idx+1]
                            new_text = text[:start_idx] + text[idx+1:]
                            return func_text, new_text
                elif in_string:
                    if char == string_char and text[idx-1] != '\\':
                        in_string = False
                elif in_comment:
                    if char == '\n':
                        in_comment = False
                idx += 1
            print(f"FAILED BRACES: {name}")
            return '', text

        kb_content = []
        for f in keyboard_funcs:
            func_text, content = extract_function(f, content)
            kb_content.append(func_text)

        tp_content = []
        for f in typing_funcs:
            func_text, content = extract_function(f, content)
            tp_content.append(func_text)

        choseong_def = 'const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];\n'
        content = content.replace(choseong_def, '')
        
        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\mode_keyboard.js', 'w', encoding='utf-8') as f:
            f.write('// Keyboard Mode Logic (Stages 1-3)\n\n' + '\n\n'.join(kb_content))

        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\mode_typing.js', 'w', encoding='utf-8') as f:
            f.write('// Typing Mode Logic (Stages 4-5)\n\n' + choseong_def + '\n\n' + '\n\n'.join(tp_content))

        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\core.js', 'w', encoding='utf-8') as f:
            f.write('// Core Logic & Global State\n\n' + content)
            
        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\full_script2.js', 'r', encoding='utf-8') as f:
            content2 = f.read()
            
        with open('d:\\global_1\\memorization_app_android\\www\\src\\js\\core.js', 'a', encoding='utf-8') as f:
            f.write('\n\n// Native & Monetization Settings\n\n' + content2)

        print('Modules generated successfully!')
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
