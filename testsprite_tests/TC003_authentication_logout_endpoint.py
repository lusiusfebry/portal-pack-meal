import requests

BASE_API_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_authentication_logout_endpoint():
    # Step 1: Login to get access token
    login_url = f"{BASE_API_URL}/auth/login"
    credentials = {
        "nik": "ADM001",
        "password": "admin123"
    }
    try:
        login_response = requests.post(login_url, json=credentials, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_data = login_response.json()
        access_token = login_data.get("accessToken")
        refresh_token = login_data.get("refreshToken")
        user = login_data.get("user")
        assert access_token is not None, "No accessToken returned"
        assert refresh_token is not None, "No refreshToken returned"
        assert user is not None, "No user object returned"
        assert isinstance(user, dict), "User should be an object"
        assert "id" in user and isinstance(user["id"], str), "User id missing or not a string"
        assert "username" in user and isinstance(user["username"], str), "Username missing or not a string"
        assert "role" in user and isinstance(user["role"], str), "User role missing or not a string"
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    # Step 2: Use access token to call logout endpoint
    logout_url = f"{BASE_API_URL}/auth/logout"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        logout_response = requests.post(logout_url, headers=headers, timeout=TIMEOUT)
        assert logout_response.status_code == 200, f"Logout failed with status code {logout_response.status_code}"
    except requests.RequestException as e:
        assert False, f"Logout request failed: {e}"

    # Step 3: Verify tokens are invalidated by attempting to access a protected endpoint (e.g., /users)
    protected_url = f"{BASE_API_URL}/users"
    try:
        protected_response = requests.get(protected_url, headers=headers, timeout=TIMEOUT)
        # Expecting 401 Unauthorized because token should be revoked after logout
        assert protected_response.status_code == 401, (
            f"Expected 401 Unauthorized after logout but got {protected_response.status_code}"
        )
    except requests.RequestException as e:
        assert False, f"Protected endpoint request failed: {e}"

test_authentication_logout_endpoint()
