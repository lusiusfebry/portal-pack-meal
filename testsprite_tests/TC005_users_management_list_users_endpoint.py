import requests
from requests.auth import HTTPBasicAuth

API_BASE_URL = "http://localhost:3000/api"
AUTH_CREDENTIALS = {"username": "ADM001", "password": "admin123"}
TIMEOUT = 30

def test_users_management_list_users_endpoint():
    # Step 1: Authenticate with basic token to get JWT bearer token
    login_url = f"{API_BASE_URL}/auth/login"
    login_payload = {
        "nik": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }
    try:
        login_response = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Login request failed with exception: {e}"
    assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
    login_data = login_response.json()
    access_token = login_data.get("accessToken")
    assert access_token, "No accessToken received after login"
    
    # Step 2: Use the access token to call the users list endpoint
    users_url = f"{API_BASE_URL}/users"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    try:
        users_response = requests.get(users_url, headers=headers, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"List users request failed with exception: {e}"
    assert users_response.status_code == 200, f"List users failed with status code {users_response.status_code}"
    
    users_data = users_response.json()
    # Validate returned user list is a list (array)
    assert isinstance(users_data, list), "Users response is not a list"
    # Optional: Validate each user object has expected keys
    for user in users_data:
        assert isinstance(user, dict), "User entry is not an object"
        assert "id" in user or "username" in user, "User object missing id or username"
    
test_users_management_list_users_endpoint()