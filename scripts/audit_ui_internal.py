import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
ui_dir = root / 'components' / 'ui'
ui_files = [p for p in sorted(ui_dir.iterdir()) if p.suffix in {'.ts', '.tsx', '.js', '.jsx'}]
all_files = [p for p in root.rglob('*') if p.suffix in {'.ts', '.tsx', '.js', '.jsx'}]

name_to_file = {p.stem: p for p in ui_files}

external_refs = {}
internal_refs = {}
for name, fpath in name_to_file.items():
    external_refs[name] = []
    internal_refs[name] = []
    pattern_external = re.compile(rf"from ['\"]@/components/ui/{re.escape(name)}['\"]")
    pattern_internal = re.compile(rf"from ['\"](?:\.\./)+components/ui/{re.escape(name)}['\"]")
    pattern_same_dir = re.compile(rf"from ['\"]\./{re.escape(name)}['\"]")
    for g in all_files:
        if g.samefile(fpath):
            continue
        try:
            txt = g.read_text(encoding='utf-8')
        except Exception:
            continue
        if pattern_external.search(txt):
            external_refs[name].append(str(g.relative_to(root)))
        if pattern_internal.search(txt) or pattern_same_dir.search(txt):
            internal_refs[name].append(str(g.relative_to(root)))

out = []
out.append('name,external,internal,total')
for name in sorted(name_to_file):
    ext = len(external_refs[name])
    intern = len(internal_refs[name])
    out.append(f"{name},{ext},{intern},{ext+intern}")
with open(root / 'scripts' / 'ui_imports_internal_audit.csv', 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(out))
print('\n'.join(out))
