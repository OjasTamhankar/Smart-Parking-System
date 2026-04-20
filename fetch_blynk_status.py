import requests
import time

AUTH_TOKEN = "VskICKvYQZhwRhvXnDmjBMKDs1CK3DD2"

def get_pin_value(pin):
    url = f"https://blynk.cloud/external/api/get?token={AUTH_TOKEN}&{pin}"
    response = requests.get(url)
    
    if response.status_code == 200:
        return int(response.text)
    else:
        print(f"Error fetching {pin}")
        return 0

def update_available_spots(value):
    url = f"https://blynk.cloud/external/api/update?token={AUTH_TOKEN}&V5={value}"
    requests.get(url)

while True:
    try:
        # Fetch parking spot status
        v0 = get_pin_value("V0")
        v1 = get_pin_value("V1")
        v2 = get_pin_value("V2")
        v3 = get_pin_value("V3")

        # Calculate available spots
        spots = [v0, v1, v2, v3]
        available = spots.count(0)

        print("Spots:", spots)
        print("Available:", available)

        # Update V5
        update_available_spots(available)

    except Exception as e:
        print("Error:", e)

    time.sleep(2)  # update every 2 seconds