import os
import sys
import time
from ftplib import FTP

server = "ftps4.us.freehostia.com"
user = "estavi0"
passwd = os.environ.get("FTP_PASS", "EstebanAvila0504?")
local_dist = "/Users/estebanavila/desarrollo/sheeritpage/dist"
log_file = "/Users/estebanavila/desarrollo/sheeritpage/scratch_daemon.log"

def log(msg):
    timestamp = time.strftime('%H:%M:%S')
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

log("🔍 Monitor de subida activa a Freehostia iniciado...")

uploaded = False
attempts = 0

while not uploaded and attempts < 300:
    attempts += 1
    log(f"Intentando conectar a Freehostia (Intento #{attempts})...")
    try:
        ftp = FTP(server, timeout=10)
        ftp.login(user, passwd)
        log("✅ ¡CONECTADO EXITOSAMENTE A FREEHOSTIA!")
        
        ftp.cwd("sheerit.com.co")
        
        def upload_dir(local_path):
            for item in os.listdir(local_path):
                lpath = os.path.join(local_path, item)
                if os.path.isfile(lpath):
                    log(f" -> Subiendo: {item}")
                    with open(lpath, 'rb') as f:
                        ftp.storbinary(f'STOR {item}', f)
                elif os.path.isdir(lpath):
                    try:
                        ftp.mkd(item)
                    except Exception:
                        pass
                    ftp.cwd(item)
                    upload_dir(lpath)
                    ftp.cwd("..")

        upload_dir(local_dist)
        log("🎉 ¡TODOS LOS ARCHIVOS DEL PORTAFOLIO FUERON SUBIDOS A FREEHOSTIA!")
        ftp.quit()
        uploaded = True
    except Exception as e:
        log(f"❌ Intento #{attempts} rechazado por Freehostia: {e}. Reintentando en 6s...")
        time.sleep(6)

if not uploaded:
    log("❌ Límite de reintentos alcanzado.")
