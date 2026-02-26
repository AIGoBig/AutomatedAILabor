import subprocess
import time
import sys
import os
import signal
import threading
from datetime import datetime

# --- Configuration ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Ensure Node.js is in PATH for background processes
NODE_PATHS = "/usr/local/n/versions/node/20.17.0/bin:/opt/homebrew/bin"
os.environ["PATH"] = NODE_PATHS + ":" + os.environ.get("PATH", "")

# Commands
BACKEND_CMD = [
    os.path.join(BACKEND_DIR, "venv", "bin", "python3"),
    "-m", "uvicorn", "main:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--reload",
    "--reload-exclude", "workspace/*"
]

FRONTEND_CMD = ["/usr/local/n/versions/node/20.17.0/bin/npm", "run", "dev"]

class ServiceManager:
    def __init__(self, name, cmd, cwd):
        self.name = name
        self.cmd = cmd
        self.cwd = cwd
        self.process = None
        self.running = True

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{self.name}] {message}")

    def start(self):
        self.log(f"Starting service in {self.cwd}...")
        try:
            self.process = subprocess.Popen(
                self.cmd,
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            # Start status monitor thread
            threading.Thread(target=self._monitor_output, daemon=True).start()
        except Exception as e:
            self.log(f"Failed to start: {e}")

    def _monitor_output(self):
        for line in iter(self.process.stdout.readline, ''):
            if not self.running:
                break
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] [{self.name}] {line.strip()}")
        self.process.stdout.close()

    def check_health(self):
        if self.process is None or self.process.poll() is not None:
            self.log("Service is DOWN. Restarting...")
            self.start()

    def stop(self):
        self.running = False
        if self.process:
            self.log("Stopping...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()

def main():
    print("="*50)
    print("      Automated AI Labor - DEV MANAGER      ")
    print("="*50)

    backend = ServiceManager("BACKEND", BACKEND_CMD, BACKEND_DIR)
    frontend = ServiceManager("FRONTEND", FRONTEND_CMD, FRONTEND_DIR)

    services = [backend, frontend]

    for s in services:
        s.start()

    def signal_handler(sig, frame):
        print("\nShutting down dev manager...")
        for s in services:
            s.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            for s in services:
                s.check_health()
            time.sleep(5)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
