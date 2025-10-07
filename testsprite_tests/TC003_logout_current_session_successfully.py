import requests

BASE_URL = "http://localhost:3000/api"
USERNAME = "ADM001"
PASSWORD = "admin123"
TIMEOUT = 30

def test_logout_current_session_successfully():
    login_url = f"{BASE_URL}/auth/login"
    logout_url = f"{BASE_URL}/auth/logout"

    login_payload = {
        "nik": USERNAME,
        "password": PASSWORD
    }

    try:
        # Login to get access token
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken")
        assert access_token, "Access token not found in login response"

        headers = {"Authorization": f"Bearer {access_token}"}

        # Call logout endpoint
        logout_resp = requests.post(logout_url, headers=headers, timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"

    except requests.RequestException as e:
        assert False, f"RequestException occurred: {e}"


test_logout_current_session_successfully()