import requests

BASE_URL = "http://localhost:3000/api"
AUTH_CREDENTIALS = {"nik": "ADM001", "password": "admin123"}
TIMEOUT = 30

def test_authentication_refresh_token_endpoint():
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "nik": AUTH_CREDENTIALS["nik"],
        "password": AUTH_CREDENTIALS["password"],
    }
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()

        assert "refreshToken" in login_data, "refreshToken missing in login response"
        valid_refresh_token = login_data["refreshToken"]
        assert isinstance(valid_refresh_token, str) and len(valid_refresh_token) > 0, "No refreshToken returned"

        assert "accessToken" in login_data, "accessToken missing in login response"
        assert "user" in login_data, "user missing in login response"

        refresh_url = f"{BASE_URL}/auth/refresh"
        headers = {"Content-Type": "application/json"}

        refresh_payload_valid = {"refreshToken": valid_refresh_token}
        refresh_resp_valid = requests.post(refresh_url, json=refresh_payload_valid, headers=headers, timeout=TIMEOUT)
        assert refresh_resp_valid.status_code == 200, f"Valid refresh token request failed with status {refresh_resp_valid.status_code}"
        refresh_data_valid = refresh_resp_valid.json()
        assert "accessToken" in refresh_data_valid and isinstance(refresh_data_valid["accessToken"], str) and refresh_data_valid["accessToken"], "accessToken missing or invalid"
        assert "refreshToken" in refresh_data_valid and isinstance(refresh_data_valid["refreshToken"], str) and refresh_data_valid["refreshToken"], "refreshToken missing or invalid"

        refresh_payload_invalid = {"refreshToken": "invalid_refresh_token_xyz"}
        refresh_resp_invalid = requests.post(refresh_url, json=refresh_payload_invalid, headers=headers, timeout=TIMEOUT)
        assert refresh_resp_invalid.status_code == 401, "Invalid refresh token should return 401 Unauthorized"
    except requests.RequestException as ex:
        assert False, f"Request exception occurred: {ex}"


test_authentication_refresh_token_endpoint()
