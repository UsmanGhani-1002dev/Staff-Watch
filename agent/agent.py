"""
StaffWatch Agent - Silent background monitor
Runs as Windows service, no login required
"""
import os
import sys
import time
import json
import uuid
import random
import base64
import platform
import threading
import subprocess
from datetime import datetime
from io import BytesIO
import requests

# ── CONFIG ────────────────────────────────────────────────────────────────────
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

def load_config():
    if not os.path.exists(CONFIG_FILE):
        setup_gui()
        if not os.path.exists(CONFIG_FILE):
            sys.exit(1)
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

# ── SCREENSHOT ─────────────────────────────────────────────────────────────────
def take_screenshot():
    try:
        import PIL.ImageGrab as ImageGrab
        img = ImageGrab.grab()
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=60)
        return base64.b64encode(buffer.getvalue()).decode("utf-8"), img
    except Exception as e:
        print(f"Screenshot error: {e}")
        return None, None


# ── ACTIVE WINDOW ──────────────────────────────────────────────────────────────
def get_active_window():
    try:
        if platform.system() == "Windows":
            import ctypes
            import ctypes.wintypes
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
            return buf.value or "Unknown"
        elif platform.system() == "Darwin":
            from AppKit import NSWorkspace
            return NSWorkspace.sharedWorkspace().activeApplication()["NSApplicationName"]
        else:
            result = subprocess.run(["xdotool", "getactivewindow", "getwindowname"], capture_output=True, text=True)
            return result.stdout.strip()
    except Exception:
        return "Unknown"

def get_active_app():
    try:
        if platform.system() == "Windows":
            import psutil
            import ctypes
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            pid = ctypes.c_ulong()
            ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            proc = psutil.Process(pid.value)
            return proc.name()
        return "unknown"
    except Exception:
        return "unknown"

# ── IDLE DETECTION ─────────────────────────────────────────────────────────────
def get_idle_seconds():
    try:
        if platform.system() == "Windows":
            import ctypes
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]
            lii = LASTINPUTINFO()
            lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
            ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii))
            millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
            return millis / 1000.0
        return 0
    except Exception:
        return 0

# ── API CALLS ──────────────────────────────────────────────────────────────────
def send_heartbeat(config, window_title, app_name, idle_seconds):
    try:
        payload = {
            "machine_token": config["machine_token"],
            "window_title": window_title,
            "app_name": app_name,
            "idle_seconds": round(idle_seconds),
            "active_seconds": 15 if idle_seconds < 30 else 0,
            "os": platform.system(),
            "hostname": platform.node(),
            "timestamp": datetime.utcnow().isoformat()
        }
        r = requests.post(
            f"{config['server_url']}/api/agent/heartbeat",
            json=payload,
            timeout=10,
            headers={"X-Agent-Token": config["machine_token"]}
        )
        return r.status_code == 200
    except Exception as e:
        print(f"Heartbeat error: {e}")
        return False

def send_screenshot(config, screenshot_b64):
    try:
        payload = {
            "machine_token": config["machine_token"],
            "screenshot": screenshot_b64,
            "taken_at": datetime.utcnow().isoformat()
        }
        r = requests.post(
            f"{config['server_url']}/api/agent/screenshot",
            json=payload,
            timeout=30,
            headers={"X-Agent-Token": config["machine_token"]}
        )
        return r.status_code == 200
    except Exception as e:
        print(f"Screenshot upload error: {e}")
        return False

def fetch_config(config):
    try:
        r = requests.get(
            f"{config['server_url']}/api/agent/config",
            headers={"X-Agent-Token": config["machine_token"]},
            timeout=10
        )
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return {"screenshot_interval_min": 5, "screenshot_interval_max": 15}

# ── MAIN LOOP ──────────────────────────────────────────────────────────────────
def run():
    config = load_config()
    print(f"StaffWatch Agent starting — server: {config['server_url']}")

    remote_config = fetch_config(config)
    interval_min = remote_config.get("screenshot_interval_min", 5) * 60
    interval_max = remote_config.get("screenshot_interval_max", 15) * 60

    next_screenshot_at = time.time() + random.randint(interval_min, interval_max)
    heartbeat_interval = 15  # every 15 seconds

    last_heartbeat = 0

    while True:
        now = time.time()

        # Heartbeat every 15s
        if now - last_heartbeat >= heartbeat_interval:
            window = get_active_window()
            app = get_active_app()
            idle = get_idle_seconds()
            send_heartbeat(config, window, app, idle)
            last_heartbeat = now

        # Random screenshot
        if now >= next_screenshot_at:
            print(f"Taking screenshot at {datetime.now().strftime('%H:%M:%S')}")
            screenshot_b64, screenshot_img = take_screenshot()
            if screenshot_b64:
                send_screenshot(config, screenshot_b64)
            next_screenshot_at = now + random.randint(interval_min, interval_max)

        time.sleep(5)

# ── AUTO-START ─────────────────────────────────────────────────────────────────
def install_to_startup():
    try:
        if platform.system() == "Windows":
            import shutil
            # Only install to startup if running as compiled .exe
            if getattr(sys, 'frozen', False):
                exe_path = sys.executable
                startup_dir = os.path.join(os.getenv('APPDATA'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
                target_path = os.path.join(startup_dir, 'StaffWatchAgent.exe')
                if exe_path != target_path:
                    shutil.copyfile(exe_path, target_path)
                    print(f"Installed to startup: {target_path}")
    except Exception as e:
        print(f"Startup install error: {e}")

# ── SETUP MODE ─────────────────────────────────────────────────────────────────
def setup_gui():
    import tkinter as tk
    from tkinter import messagebox
    
    root = tk.Tk()
    root.title("StaffWatch Setup")
    root.geometry("400x280")
    root.configure(bg="#1a1a2e")
    
    # Center window
    root.update_idletasks()
    width = root.winfo_width()
    height = root.winfo_height()
    x = (root.winfo_screenwidth() // 2) - (width // 2)
    y = (root.winfo_screenheight() // 2) - (height // 2)
    root.geometry(f"+{x}+{y}")
    
    tk.Label(root, text="Welcome to StaffWatch", fg="#ffffff", bg="#1a1a2e", font=("Segoe UI", 16, "bold")).pack(pady=(20, 10))
    
    tk.Label(root, text="Server URL:", fg="#8b8bab", bg="#1a1a2e", font=("Segoe UI", 10)).pack()
    url_entry = tk.Entry(root, width=40, bg="#0f0f18", fg="#ffffff", insertbackground="#ffffff", font=("Segoe UI", 10))
    url_entry.insert(0, "http://localhost:3000") # Change to production URL later
    url_entry.pack(pady=5)
    
    tk.Label(root, text="Machine Token:", fg="#8b8bab", bg="#1a1a2e", font=("Segoe UI", 10)).pack(pady=(10, 0))
    token_entry = tk.Entry(root, width=40, bg="#0f0f18", fg="#ffffff", insertbackground="#ffffff", font=("Segoe UI", 10))
    token_entry.pack(pady=5)
    
    def on_connect():
        url = url_entry.get().strip()
        token = token_entry.get().strip()
        if not url or not token:
            messagebox.showerror("Error", "Please fill in all fields")
            return
            
        config = {
            "server_url": url.rstrip("/"),
            "machine_token": token,
            "installed_at": datetime.utcnow().isoformat()
        }
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(config, f, indent=2)
            
            install_to_startup()
            
            messagebox.showinfo("Success", "Connected successfully! The agent will now run silently in the background.")
            root.destroy()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save config: {e}")

    tk.Button(root, text="Connect Agent", command=on_connect, bg="#6366f1", fg="#ffffff", 
              activebackground="#4f46e5", activeforeground="#ffffff", relief="flat", 
              font=("Segoe UI", 10, "bold"), padx=20, pady=5).pack(pady=20)
    
    root.mainloop()

if __name__ == "__main__":
    if getattr(sys, 'frozen', False):
        install_to_startup()
        
    if not os.path.exists(CONFIG_FILE):
        setup_gui()
        
    if os.path.exists(CONFIG_FILE):
        run()
