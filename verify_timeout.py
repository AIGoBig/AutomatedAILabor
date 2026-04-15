import subprocess
import os
import tempfile

workspace_dir = os.path.join(tempfile.gettempdir(), 'ailabor_sandbox')
os.makedirs(workspace_dir, exist_ok=True)
script_path = os.path.join(workspace_dir, 'test_timeout.py')

with open(script_path, 'w') as f:
    f.write('import time; time.sleep(20); print("Success after 20s")')

print("Starting subprocess with 60s timeout...")
try:
    result = subprocess.run(['python3', script_path], capture_output=True, text=True, timeout=60)
    print(f'STDOUT: {result.stdout.strip()}')
    print(f'CODE: {result.returncode}')
except subprocess.TimeoutExpired:
    print('TIMEOUT')
