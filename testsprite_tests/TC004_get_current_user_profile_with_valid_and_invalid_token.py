import requests

BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"
TIMEOUT = 30

def test_tc004_get_current_user_profile_with_valid_and_invalid_token():
    login_url = f"{API_BASE}/auth/login"
    me_url = f"{API_BASE}/auth/me"
    valid_credentials = {
        "nik": "ADM001",
        "password": "admin123"
    }

    # Step 1: Login to get a valid JWT token
    try:
        login_resp = requests.post(login_url, json=valid_credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken")
        assert access_token and isinstance(access_token, str), "Access token missing or invalid in login response"
    except Exception as e:
        raise AssertionError(f"Exception during login: {e}")

    headers_valid = {
        "Authorization": f"Bearer {access_token}"
    }

    # Step 2: Access /auth/me with valid token
    try:
        me_resp_valid = requests.get(me_url, headers=headers_valid, timeout=TIMEOUT)
        assert me_resp_valid.status_code == 200, f"Expected 200 OK for valid token, got {me_resp_valid.status_code}"
        profile = me_resp_valid.json()
        # Validate required fields in user profile
        for field in ["id", "username", "role", "createdAt"]:
            assert field in profile, f"Field '{field}' missing in profile response"
        assert profile["role"] in ["administrator", "employee", "dapur", "delivery"], "User role invalid"
    except Exception as e:
        raise AssertionError(f"Exception during valid token profile retrieval: {e}")

    # Step 3: Access /auth/me without token
    try:
        me_resp_no_token = requests.get(me_url, timeout=TIMEOUT)
        assert me_resp_no_token.status_code == 401, f"Expected 401 Unauthorized without token, got {me_resp_no_token.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during no token profile retrieval: {e}")

    # Step 4: Access /auth/me with invalid token
    headers_invalid = {
        "Authorization": "Bearer invalid.token.value"
    }
    try:
        me_resp_invalid = requests.get(me_url, headers=headers_invalid, timeout=TIMEOUT)
        assert me_resp_invalid.status_code == 401, f"Expected 401 Unauthorized for invalid token, got {me_resp_invalid.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during invalid token profile retrieval: {e}")

test_tc004_get_current_user_profile_with_valid_and_invalid_token()