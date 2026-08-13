import os
import sys
import time
from ftplib import FTP, FTP_TLS

server = "ftps4.us.freehostia.com"
user = "estavi0"
passwd = os.environ.get("FTP_PASS", "EstebanAvila0504?")

print(f"Iniciando reintentos de conexión FTP a {server}...")

ftp = None
for attempt in range(1, 15):
    print(f"Intento {attempt}/15...")
    try:
        ftp = FTP(server, timeout=15)
        ftp.login(user, passwd)
        print("¡Conexión y autenticación exitosa en Freehostia!")
        break
    except Exception as e:
        print(f"Intento {attempt} falló: {e}")
        time.sleep(3)

if not ftp:
    print("No se pudo conectar a Freehostia tras 15 intentos.")
    sys.exit(1)

try:
    ftp.cwd("sheerit.com.co")
    print(f"Directorio remoto actual: {ftp.pwd()}")
    
    local_dist = "/Users/estebanavila/desarrollo/sheeritpage/dist"
    
    def upload_dir(local_path):
        for item in os.listdir(local_path):
            lpath = os.path.join(local_path, item)
            if os.path.isfile(lpath):
                print(f"Subiendo {item}...")
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
    print("🎉 ¡TODOS LOS ARCHIVOS COMPILADOS HAN SIDO SUBIDOS EXITOSAMENTE A FREEHOSTIA!")
    ftp.quit()
except Exception as e:
    print(f"Error durante la transferencia: {e}")
