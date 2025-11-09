import subprocess
import platform
import socket

def is_windows():
    return platform.system().lower() == "windows"

def ping(ip):
    command = ["ping", "-n", "1", "-w", "200", ip] if is_windows() else ["ping", "-c", "1", "-W", "1", ip]
    return subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0

def get_hostname(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except:
        return ""

def get_mac(ip):
    if is_windows():
        arp_cmd = f"arp -a {ip}"
        output = subprocess.getoutput(arp_cmd)
        for line in output.splitlines():
            if ip in line:
                return line.split()[1]
    return None

def scan_network(base_ip):
    print("🔍 Scanning for Raspberry Pi...")
    for i in range(1, 255):
        ip = f"{base_ip}.{i}"
        if ping(ip):
            hostname = get_hostname(ip)
            mac = get_mac(ip)
            # Check if the hostname or MAC suggests it's a Raspberry Pi
            if "raspberrypi" in hostname.lower() or (mac and (mac.startswith("b8:27:eb") or mac.startswith("dc:a6:32"))):
                print(f"🎯 Raspberry Pi FOUND at: {ip} | Hostname: {hostname} | MAC: {mac}")
                return ip
            else:
                print(f"✅ Active: {ip} | Hostname: {hostname} | MAC: {mac}")
    print("❌ Raspberry Pi NOT found.")
    return None

# CHANGE THIS BASE IP IF NEEDED (check from your hotspot or other device)
scan_network("192.168.187")
