import requests

BASE_URL = "http://localhost:3000/api"
AUTH_CREDENTIALS = {
    "nik": "ADM001",
    "password": "admin123"
}
TIMEOUT = 30

def authenticate():
    login_url = f"{BASE_URL}/auth/login"
    resp = requests.post(login_url, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return data["accessToken"]

def get_shifts(token):
    url = f"{BASE_URL}/master-data/shifts"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def create_shift(token, name, start_time, end_time):
    url = f"{BASE_URL}/master-data/shifts"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "name": name,
        "startTime": start_time,
        "endTime": end_time
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    if resp.status_code != 201:
        resp.raise_for_status()
    # Shift creation response body unspecified, do not parse JSON here
    return None

def delete_shift(shift_id, token):
    url = f"{BASE_URL}/master-data/shifts/{shift_id}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()

def get_lokasi(token):
    url = f"{BASE_URL}/master-data/lokasi"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def delete_order(order_id, token):
    # No direct delete order API shown in PRD - assuming not supported; skipping delete
    # So no cleanup of order resource is done here.
    pass

def test_create_order_endpoint():
    access_token = authenticate()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    shifts = get_shifts(access_token)
    created_shift_id = None
    if not shifts:
        # Create a shift since none exists
        create_shift(access_token, "Morning", "08:00", "12:00")
        shifts = get_shifts(access_token)
        assert isinstance(shifts, list) and len(shifts) > 0, "Shift must be created and retrievable"

    assert isinstance(shifts, list), "Shifts response should be a list"
    assert len(shifts) > 0, "At least one shift must exist to create order"
    shift_id = shifts[0].get("id") if isinstance(shifts[0], dict) else None
    assert shift_id, "Shift item must have 'id'"

    if len(shifts) == 1 and shifts[0].get("name") == "Morning" and shifts[0].get("startTime") == "08:00" and shifts[0].get("endTime") == "12:00":
        created_shift_id = shift_id

    lokasi_list = get_lokasi(access_token)
    assert isinstance(lokasi_list, list), "Lokasi response should be a list"
    # lokasiId is optional according to schema, so if available, use first, else omit
    lokasi_id = None
    if len(lokasi_list) > 0 and isinstance(lokasi_list[0], dict):
        lokasi_id = lokasi_list[0].get("id")

    order_url = f"{BASE_URL}/orders"
    order_payload = {
        "menu": "Chicken Rice",
        "quantity": 2,
        "shiftId": shift_id
    }
    if lokasi_id:
        order_payload["lokasiId"] = lokasi_id

    created_order = None
    try:
        resp = requests.post(order_url, headers=headers, json=order_payload, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 Created but got {resp.status_code}"
        created_order = resp.json()
        assert "id" in created_order, "Response JSON must contain 'id'"
        assert created_order["menu"] == order_payload["menu"], "Menu value mismatch"
        assert created_order["quantity"] == order_payload["quantity"], "Quantity value mismatch"
        assert created_order["shiftId"] == order_payload["shiftId"], "ShiftId value mismatch"
        if lokasi_id:
            assert created_order.get("lokasiId") == lokasi_id, "LokasiId value mismatch"
    finally:
        if created_order and "id" in created_order:
            # No documented delete endpoint for orders; if exists in future, cleanup code can be added here
            delete_order(created_order["id"], access_token)
        if created_shift_id:
            delete_shift(created_shift_id, access_token)

test_create_order_endpoint()
