import subprocess
import os
import tempfile
import uuid

# Mock state and config
thread_id = str(uuid.uuid4())
config = {"configurable": {"thread_id": thread_id}}
workspace_dir = os.path.join(tempfile.gettempdir(), f"ailabor_sandbox_{thread_id}")

# Create files manually to simulate what local_execution_node now does
os.makedirs(workspace_dir, exist_ok=True)

utils_path = os.path.join(workspace_dir, "utils.py")
with open(utils_path, "w") as f:
    f.write("def get_message(): return 'Hello from utils!'")

main_path = os.path.join(workspace_dir, "main.py")
with open(main_path, "w") as f:
    f.write("from utils import get_message; print(get_message())")

print(f"Testing multi-file execution in {workspace_dir}...")
try:
    # Run the main script
    result = subprocess.run(['python3', main_path], capture_output=True, text=True, timeout=10, cwd=workspace_dir)
    print(f"STDOUT: {result.stdout.strip()}")
    print(f"CODE: {result.returncode}")
    if result.stdout.strip() == "Hello from utils!":
        print("VERIFICATION SUCCESS: Multi-file import works!")
    else:
        print("VERIFICATION FAILURE: Output mismatch.")
except subprocess.TimeoutExpired:
    print("TIMEOUT")
finally:
    # Cleanup
    import shutil
    # shutil.rmtree(workspace_dir) # Keep for debugging if it fails, or delete if it succeeds
    pass
