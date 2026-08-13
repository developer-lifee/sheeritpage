import os
import sys
from ftplib import FTP_TLS, FTP

server = "ftps4.us.freehostia.com"
user = "estavi0"
passwd = os.environ.get("FTP_PASS", "EstebanAvila0504?")
remote_dir = "sheerit.com.co"

print(f"Connecting to {server}...")
try:
    ftp = FTP(server, timeout=30)
    ftp.login(user, passwd)
    print("Logged in successfully!")
    ftp.cwd(remote_dir)
    print(f"Current remote directory: {ftp.pwd()}")
    
    local_dist = "/Users/estebanavila/desarrollo/sheeritpage/dist"
    
    def upload_dir(local_path, remote_path):
        for item in os.listdir(local_path):
            lpath = os.path.join(local_path, item)
            rpath = remote_path + "/" + item if remote_path else item
            if os.path.isfile(lpath):
                print(f"Uploading {item}...")
                with open(lpath, 'rb') as f:
                    ftp.storbinary(f'STOR {item}', f)
            elif os.path.isdir(lpath):
                try:
                    ftp.mkd(item)
                except Exception:
                    pass
                ftp.cwd(item)
                upload_dir(lpath, "")
                ftp.cwd("..")

    upload_dir(local_dist, "")
    print("FTP Upload finished 100% successfully!")
    ftp.quit()
except Exception as e:
    print(f"FTP Error: {e}")
