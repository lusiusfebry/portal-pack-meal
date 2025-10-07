import requests
import uuid
import time

BASE_URL = "http://localhost:3000/api"
AUTH_CREDENTIALS = ("ADM001", "admin123")
TIMEOUT = 30

def login_and_get_token():
    url = f"{BASE_URL}/auth/login"
    payload = {"nik": AUTH_CREDENTIALS[0], "password": AUTH_CREDENTIALS[1]}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status code {resp.status_code}"
    data = resp.json()
    assert "accessToken" in data, "accessToken missing in login response"
    assert "refreshToken" in data, "refreshToken missing in login response"
    assert "user" in data, "user field missing in login response"
    return data["accessToken"]

def create_user(access_token):
    url = f"{BASE_URL}/users"
    # Use unique nik/username to avoid conflict
    unique_suffix = str(uuid.uuid4())[:8]
    user_data = {
        "username": f"testuser_{unique_suffix}",
        "nik": f"nik_{unique_suffix}",
        "role": "employee",
        "password": "TestPass123!"
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.post(url, json=user_data, headers=headers, timeout=TIMEOUT)
    # Accept 201 Created or 409 Conflict (in case of duplicate try again)
    if resp.status_code == 409:
        # Retry with new suffix
        time.sleep(1)
        return create_user(access_token)
    resp.raise_for_status()
    assert resp.status_code == 201
    user_created = resp.json() if resp.headers.get("Content-Type") == "application/json" else None
    # If API returns created user data with id, use it, else fetch list and find user by nik
    if user_created and "id" in user_created:
        return user_created["id"], user_data["nik"], user_data["username"]
    else:
        # fallback to get users and find user by nik
        list_resp = requests.get(f"{BASE_URL}/users", headers=headers, timeout=TIMEOUT)
        list_resp.raise_for_status()
        users = list_resp.json()
        for u in users:
            if u.get("nik") == user_data["nik"]:
                return u.get("id"), user_data["nik"], user_data["username"]
        raise Exception("Created user not found in user list")
        
def delete_user(user_id, access_token):
    # Not present in PRD to delete user endpoint explicitly, no delete user endpoint found
    # So no delete call as per PRD, will skip delete step
    pass

def test_users_management_get_user_by_id_endpoint():
    access_token = login_and_get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    
    user_id = None
    try:
        # Create a user to test valid retrieval
        user_id, nik, username = create_user(access_token)
        
        # 1. Valid ID retrieval
        url_get_valid = f"{BASE_URL}/users/{user_id}"
        resp_valid = requests.get(url_get_valid, headers=headers, timeout=TIMEOUT)
        assert resp_valid.status_code == 200
        user_data = resp_valid.json()
        assert user_data.get("id") == user_id
        # Basic field checks
        assert "username" in user_data and "role" in user_data
        
        # 2. Invalid ID format retrieval - using clearly invalid UUID string
        invalid_id = "invalid-id-format-123"
        url_get_invalid = f"{BASE_URL}/users/{invalid_id}"
        resp_invalid = requests.get(url_get_invalid, headers=headers, timeout=TIMEOUT)
        # Some backends treat invalid format as 404 not found or 400 bad request, so accept those
        assert resp_invalid.status_code in (400, 404)
        
        # 3. Non-existent ID retrieval - generate a valid UUID unlikely to exist
        non_existent_id = str(uuid.uuid4())
        url_get_nonexistent = f"{BASE_URL}/users/{non_existent_id}"
        resp_nonexistent = requests.get(url_get_nonexistent, headers=headers, timeout=TIMEOUT)
        assert resp_nonexistent.status_code == 404
        
    finally:
        # Cleanup user if needed (delete endpoint not defined in PRD so skipping)
        if user_id:
            delete_user(user_id, access_token)

test_users_management_get_user_by_id_endpoint()
