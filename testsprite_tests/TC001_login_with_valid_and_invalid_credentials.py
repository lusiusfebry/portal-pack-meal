import requests

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30


def test_login_with_valid_and_invalid_credentials():
    url = f"{BASE_URL}/auth/login"
    headers = {
        "Content-Type": "application/json"
    }

    # Valid credentials (from instructions: basic token credential username as NIK, password)
    valid_payload = {
        "nik": "ADM001",
        "password": "admin123"
    }

    # Test login with valid credentials
    try:
        response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed for valid credentials: {e}"

    assert response.status_code == 200, f"Expected status 200 for valid login, got {response.status_code}"
    try:
        resp_json = response.json()
    except Exception:
        assert False, "Response is not valid JSON on valid login"

    assert "accessToken" in resp_json and isinstance(resp_json["accessToken"], str) and resp_json["accessToken"], "accessToken missing or empty"
    assert "refreshToken" in resp_json and isinstance(resp_json["refreshToken"], str) and resp_json["refreshToken"], "refreshToken missing or empty"
    assert "user" in resp_json and isinstance(resp_json["user"], dict), "user object missing in response"

    user = resp_json["user"]
    required_user_fields = {"id", "username", "role", "createdAt"}
    assert required_user_fields.issubset(user.keys()), f"user object missing fields {required_user_fields - user.keys()}"

    # Invalid credentials tests
    invalid_credentials_list = [
        {"nik": "wrongnik", "password": "admin123"},
        {"nik": "ADM001", "password": "wrongpassword"},
        {"nik": "", "password": "admin123"},
        {"nik": "ADM001", "password": ""},
        {"nik": "nonexistent", "password": "nopassword"}
    ]

    for invalid_cred in invalid_credentials_list:
        try:
            resp = requests.post(url, json=invalid_cred, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for invalid credentials {invalid_cred}: {e}"

        assert resp.status_code == 401, f"Expected 401 for invalid login {invalid_cred}, got {resp.status_code}"


test_login_with_valid_and_invalid_credentials()