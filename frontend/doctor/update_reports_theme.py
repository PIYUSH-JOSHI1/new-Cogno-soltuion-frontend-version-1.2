import sys

file_path = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor\reports.html'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

variables_to_inject = """        :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --primary-light: #eff6ff;
            --success: #10b981;
            --warning: #f59e0b;
            --bg: #f5f7fa;
            --card: #ffffff;
            --text: #1f2937;
            --text-muted: #6b7280;
            --border: #e5e7eb;
        }
        [data-theme="dark"] {
            --bg: #0f172a;
            --card: #1e293b;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --border: #334155;
            --primary-light: #1e3a5f;
            --success: #10b981;
            --warning: #f59e0b;
        }"""

if ':root {' not in text[:500]:
    text = text.replace('<style>', '<style>\n' + variables_to_inject)


# Remove the bottom block that overrides theme variables
text = text.replace("""        :root {
            --tg-card: var(--card, #ffffff);
            --tg-border: var(--border, #e5e7eb);
            --tg-text: var(--text, #1f2937);
            --tg-text-muted: var(--text-muted, #6b7280);
        }
        [data-theme="dark"] {
            --tg-card: var(--card, #1e293b);
            --tg-border: var(--border, #334155);
            --tg-text: var(--text, #f1f5f9);
            --tg-text-muted: var(--text-muted, #94a3b8);
        }""", "")

# Replace generic tg references
text = text.replace('--tg-bg', '--bg')
text = text.replace('--tg-card', '--card')
text = text.replace('--tg-text', '--text')
text = text.replace('--tg-text-muted', '--text-muted')
text = text.replace('--tg-border', '--border')
text = text.replace('--tg-icon-bg', '--primary-light')
text = text.replace('--tg-hover', '--primary-light')
text = text.replace('--tg-active-bg', '--primary-light')

text = text.replace('background: white;', 'background: var(--card);')

# specifically correct some leftovers
text = text.replace('color: #3b82f6;', 'color: var(--primary);')
text = text.replace('background: #eff6ff;', 'background: var(--primary-light);')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated theme correctly')
