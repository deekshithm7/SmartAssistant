import time
import datetime
import os

reminders = []

def execute_command(command: str):
    if "time" in command:
        return f"The time is {datetime.datetime.now().strftime('%H:%M')}"
    elif "open notepad" in command:
        os.system("notepad.exe")
        return "Opening Notepad."
    elif "remind me" in command:
        reminders.append((time.time() + 10, "Reminder: Don't forget!"))
        return "Okay, I’ll remind you in 10 seconds."
    return "GPT"

def check_reminders():
    now = time.time()
    due = [r for r in reminders if r[0] <= now]
    for r in due:
        reminders.remove(r)
        return r[1]
    return None
