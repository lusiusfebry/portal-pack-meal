import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000/api"
USERNAME = "ADM001"
PASSWORD = "admin123"
TIMEOUT = 30

def test_list_users_with_proper_authorization():
    try:
        # First, login to get access token via /auth/login since API uses JWT auth
        login_url = f"{BASE_URL}/auth/login"
        login_payload = {"nik": USERNAME, "password": PASSWORD}
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken")
        assert access_token, "No access token received after login"

        # Use access token to access /users endpoint
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        users_url = f"{BASE_URL}/users"
        users_resp = requests.get(users_url, headers=headers, timeout=TIMEOUT)

        # Assert success status code
        assert users_resp.status_code == 200, f"Users list request failed with status {users_resp.status_code}"

        users_data = users_resp.json()

        # Assert the response is a list or contains expected "users" list
        # The PRD summary says "Array of users" expected in response
        assert isinstance(users_data, list) or (isinstance(users_data, dict) and "users" in users_data), \
            "Users response is not an array or does not contain 'users' key"

        # Further validate users array non-empty and contains expected fields if possible
        user_list = users_data if isinstance(users_data, list) else users_data.get("users", [])
        assert isinstance(user_list, list), "Users data is not a list"

        for user in user_list:
            assert "id" in user, "User object missing 'id'"
            assert "username" in user, "User object missing 'username'"
            assert "role" in user, "User object missing 'role'"
            assert user["role"] in ["administrator", "employee", "dapur", "delivery"], f"Unexpected user role {user['role']}"
            assert "createdAt" in user, "User object missing 'createdAt'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_list_users_with_proper_authorization()