#!/usr/bin/env python3
"""Root-only, backed-up API proxy configuration for the documented 20 MiB uploads."""
from datetime import datetime, timezone
import os
from pathlib import Path
import re
import shutil
import subprocess


def main():
    if os.geteuid() != 0:
        raise SystemExit("Run this reviewed script from a root/admin shell.")
    site = Path("/etc/nginx/sites-available/api.edusphere.live")
    original = site.read_text()
    marker = "    # EduSphere study upload and inference bounds\n"
    if marker in original:
        print("Study proxy configuration is already present; validating it.")
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        return
    if re.search(r"\b(client_max_body_size|proxy_read_timeout|proxy_send_timeout)\b", original):
        raise SystemExit("Existing proxy bounds need manual review; nothing changed.")
    needle = "    server_name api.edusphere.live;\n"
    if needle not in original:
        raise SystemExit("Expected API server_name not found; nothing changed.")
    addition = (marker + "    client_max_body_size 21m;\n"
                "    proxy_read_timeout 300s;\n    proxy_send_timeout 300s;\n")
    backup = site.with_name(site.name + ".before-study-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
    shutil.copy2(site, backup)
    try:
        site.write_text(original.replace(needle, needle + addition, 1))
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        subprocess.run(["/usr/bin/systemctl", "reload", "nginx.service"], check=True)
    except Exception:
        shutil.copy2(backup, site)
        raise
    print("API proxy reloaded: 21 MiB request ceiling and 300-second upstream timeouts.")
    print("Backup:", backup)


if __name__ == "__main__":
    main()
