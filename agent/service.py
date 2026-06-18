"""
StaffWatch Windows Service Wrapper
Installs and runs agent.py as a proper Windows background service
"""
import sys
import os
import time
import subprocess

SERVICE_NAME = "StaffWatchAgent"
SERVICE_DISPLAY = "StaffWatch Monitoring Agent"
AGENT_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agent.py")

try:
    import win32serviceutil
    import win32service
    import win32event
    import servicemanager

    class StaffWatchService(win32serviceutil.ServiceFramework):
        _svc_name_ = SERVICE_NAME
        _svc_display_name_ = SERVICE_DISPLAY
        _svc_description_ = "StaffWatch background monitoring agent"

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            self.process = None

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            if self.process:
                self.process.terminate()
            win32event.SetEvent(self.hWaitStop)

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, "")
            )
            python_exe = sys.executable
            self.process = subprocess.Popen([python_exe, AGENT_SCRIPT])
            win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

    if __name__ == "__main__":
        if len(sys.argv) == 1:
            servicemanager.Initialize()
            servicemanager.PrepareToHostSingle(StaffWatchService)
            servicemanager.StartServiceCtrlDispatcher()
        else:
            win32serviceutil.HandleCommandLine(StaffWatchService)

except ImportError:
    # Non-Windows fallback — just run directly
    print("Running in non-Windows mode (no service wrapper)")
    import agent
    agent.run()
