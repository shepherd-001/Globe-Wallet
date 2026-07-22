import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
ui_dir = root / 'components' / 'ui'
all_files = [p for p in root.rglob('*') if p.suffix in {'.ts', '.tsx', '.js', '.jsx'}]

pattern_template = "from ['\"]@/components/ui/{name}['\"]"
internal_pattern_template = r"from ['\"](?:\.\./)+components/ui/{name}['\"]"

print('name,external_imports,internal_ui_imports,total_imports')
for f in sorted(ui_dir.iterdir(), key=lambda p: p.name):
    if f.suffix not in {'.ts', '.tsx', '.js', '.jsx'}:
        continue
    name = f.stem
    ext_count = 0
    int_count = 0
    total_count = 0
    for g in all_files:
        if g.samefile(f):
            continue
        try:
            txt = g.read_text(encoding='utf-8')
        except Exception:
            continue
        if re.search(pattern_template.format(name=re.escape(name)), txt):
            ext_count += 1
            total_count += 1
        elif re.search(internal_pattern_template.format(name=re.escape(name)), txt):
            int_count += 1
            total_count += 1
    print(f"{name},{ext_count},{int_count},{total_count}")
