import requests

BASE_URL = "http://localhost:3000/api"
AUTH_LOGIN_ENDPOINT = "/auth/login"
AUTH_REFRESH_ENDPOINT = "/auth/refresh"
TIMEOUT = 30

USERNAME = "ADM001"
PASSWORD = "admin123"

def test_refresh_jwt_tokens_with_valid_and_invalid_refresh_token():
    try:
        # Step 1: Login to get valid tokens
        login_payload = {
            "nik": USERNAME,
            "password": PASSWORD
        }

        login_response = requests.post(
            BASE_URL + AUTH_LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_data = login_response.json()
        valid_refresh_token = login_data.get("refreshToken")
        assert valid_refresh_token, "No refreshToken received on login"

        # Step 2: Refresh tokens using valid refresh token
        refresh_payload_valid = {
            "refreshToken": valid_refresh_token
        }
        refresh_response_valid = requests.post(
            BASE_URL + AUTH_REFRESH_ENDPOINT,
            json=refresh_payload_valid,
            timeout=TIMEOUT
        )
        assert refresh_response_valid.status_code == 200, f"Refresh failed with valid token, status code {refresh_response_valid.status_code}"
        refresh_data = refresh_response_valid.json()
        assert "accessToken" in refresh_data and "refreshToken" in refresh_data, "Refresh response missing tokens"

        # Step 3: Refresh tokens using invalid refresh token
        invalid_refresh_token = "invalid_or_expired_refresh_token_xyz"
        refresh_payload_invalid = {
            "refreshToken": invalid_refresh_token
        }
        refresh_response_invalid = requests.post(
            BASE_URL + AUTH_REFRESH_ENDPOINT,
            json=refresh_payload_invalid,
            timeout=TIMEOUT
        )
        assert refresh_response_invalid.status_code == 401, (
            f"Expected 401 Unauthorized for invalid refresh token, got {refresh_response_invalid.status_code}"
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_refresh_jwt_tokens_with_valid_and_invalid_refresh_token()
