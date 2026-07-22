import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
script = root / 'audit_ui_internal.py'
print('Running', script)
result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
print('returncode:', result.returncode)
print('stdout:\n', result.stdout)
print('stderr:\n', result.stderr)
