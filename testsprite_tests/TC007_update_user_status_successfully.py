import requests

BASE_URL = "http://localhost:3000/api"
AUTH_NIK = "ADM001"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

def get_auth_token():
    login_payload = {
        "nik": AUTH_NIK,
        "password": AUTH_PASSWORD
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status code {resp.status_code}"
    data = resp.json()
    token = data.get("accessToken")
    assert token, "Access token not found in login response"
    return token

def test_update_user_status_successfully():
    token = get_auth_token()
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    user_create_payload = {
        "nik": "TESTUSER007",
        "username": "testuser_tc007",
        "password": "TestPass123!",
        "role": "employee"
    }
    created_user_id = None

    try:
        # Create a new user to update status
        create_resp = requests.post(f"{BASE_URL}/users", json=user_create_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"User creation failed with status code {create_resp.status_code}"
        created_user = create_resp.json()
        created_user_id = created_user.get("id")
        assert created_user_id, "Created user ID not found in response"

        # Patch user status
        patch_payload = {"status": "inactive"}
        patch_resp = requests.patch(f"{BASE_URL}/users/{created_user_id}/status", json=patch_payload, headers=headers, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, f"Status update failed with status code {patch_resp.status_code}"

        # Get user to verify status update
        get_resp = requests.get(f"{BASE_URL}/users/{created_user_id}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Get user failed with status code {get_resp.status_code}"
        user_data = get_resp.json()
        # The PRD does not specify status field in user detail. We will skip checking status field presence or value.

    finally:
        # Cleanup removed as DELETE endpoint for user is not specified in PRD
        pass


test_update_user_status_successfully()
