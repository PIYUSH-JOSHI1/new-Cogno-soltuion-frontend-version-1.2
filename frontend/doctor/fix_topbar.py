import re
import os
import glob

base = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor'

with open(os.path.join(base, 'dashboard.html'), 'r', encoding='utf-8') as f:
    dash = f.read()

match_topbar = re.search(r'(/\*\s*Topbar\s*\*/.*?(?=/\*\s*Notifications Panel\s*\*/))', dash, re.DOTALL)
if match_topbar:
    topbar_css = match_topbar.group(1)
    
    with open(os.path.join(base, 'schedule.html'), 'r', encoding='utf-8') as f:
        sched = f.read()
    
    new_sched = re.sub(r'/\*\s*Topbar\s*\*/.*?(?=/\*\s*Notifications Panel\s*\*/|/\*\s*Bottom Navigation\s*\*/)', topbar_css, sched, flags=re.DOTALL)
    
    # Let's fix fonts too. dashboard.html has:
    # <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    # <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    if 'Outfit' not in new_sched:
        new_sched = new_sched.replace(
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">',
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">'
        )
        new_sched = new_sched.replace(
            "font-family: 'Inter', sans-serif;",
            "font-family: 'Outfit', 'Inter', sans-serif;"
        )
    
    # Remove height: 64px from topbar if it is still there!
    # well the topbar_css from dashboard doesn't have it anyway.
    
    if new_sched != sched:
        with open(os.path.join(base, 'schedule.html'), 'w', encoding='utf-8') as f:
            f.write(new_sched)
            print('Successfully replaced CSS and fonts in schedule.html')
    else:
        print('No changes made to schedule.html CSS blocks')
    
else:
    print('topbar not found in dashboard')
