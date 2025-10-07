import requests

BASE_API_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_authentication_login_endpoint():
    login_url = f"{BASE_API_URL}/auth/login"
    headers = {"Content-Type": "application/json"}

    # Valid credentials (assuming ADM001 with password admin123 is valid)
    valid_payload = {
        "nik": "ADM001",
        "password": "admin123"
    }
    # Invalid credentials: incorrect password
    invalid_payload_1 = {
        "nik": "ADM001",
        "password": "wrongpassword"
    }
    # Invalid credentials: non-existing NIK
    invalid_payload_2 = {
        "nik": "UNKNOWNNIK",
        "password": "somepassword"
    }

    # Test valid login
    try:
        resp_valid = requests.post(login_url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Valid login request failed: {e}"
    assert resp_valid.status_code == 200, f"Valid login expected 200 but got {resp_valid.status_code}"
    try:
        data_valid = resp_valid.json()
    except ValueError:
        assert False, "Response is not valid JSON for valid login."
    # Check keys exist
    assert "accessToken" in data_valid, "accessToken missing in response"
    assert "refreshToken" in data_valid, "refreshToken missing in response"
    assert "user" in data_valid, "user object missing in response"
    user_obj = data_valid["user"]
    assert isinstance(user_obj, dict), "user should be an object"
    assert "id" in user_obj and isinstance(user_obj["id"], str), "user.id missing or not string"
    assert "username" in user_obj and isinstance(user_obj["username"], str), "user.username missing or not string"
    assert "role" in user_obj and isinstance(user_obj["role"], str), "user.role missing or not string"

    # Test invalid login (wrong password)
    try:
        resp_invalid1 = requests.post(login_url, json=invalid_payload_1, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid login request (wrong password) failed: {e}"
    assert resp_invalid1.status_code == 401, f"Invalid login (wrong password) expected 401 but got {resp_invalid1.status_code}"

    # Test invalid login (unknown NIK)
    try:
        resp_invalid2 = requests.post(login_url, json=invalid_payload_2, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid login request (unknown NIK) failed: {e}"
    assert resp_invalid2.status_code == 401, f"Invalid login (unknown NIK) expected 401 but got {resp_invalid2.status_code}"

test_authentication_login_endpoint()