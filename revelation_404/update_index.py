import os

def main():
    try:
        with open('d:\\global_1\\memorization_app_android\\www\\index.html', 'r', encoding='utf-8') as f:
            lines = f.readlines()

        new_lines = []
        for i, line in enumerate(lines):
            # lines[229] is <script src="database.js"></script>
            if i == 229:
                new_lines.append(line)
                new_lines.append('    <script src="src/js/core.js?v=2"></script>\n')
                new_lines.append('    <script src="src/js/mode_keyboard.js?v=2"></script>\n')
                new_lines.append('    <script src="src/js/mode_typing.js?v=2"></script>\n')
            elif 230 <= i <= 1305:
                pass
            else:
                new_lines.append(line)

        with open('d:\\global_1\\memorization_app_android\\www\\index.html', 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print('index.html updated successfully!')
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
