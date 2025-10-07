import requests
import uuid
import time

BASE_URL = "http://localhost:3000/api"
AUTH_CREDENTIALS = {"nik": "ADM001", "password": "admin123"}
TIMEOUT = 30

def test_users_management_update_user_status_endpoint():
    # Step 1: Login to get JWT token
    login_resp = requests.post(
        f"{BASE_URL}/auth/login",
        json=AUTH_CREDENTIALS,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    tokens = login_resp.json()
    access_token = tokens.get("accessToken")
    assert access_token, "No accessToken in login response"
    headers = {"Authorization": f"Bearer {access_token}"}

    user_id = None
    try:
        unique_suffix = str(uuid.uuid4())[:8]
        user_payload = {
            "username": f"update_status_user_{unique_suffix}",
            "nik": f"nik_update_status_{unique_suffix}",
            "role": "employee",
            "password": "Password123!"
        }
        create_resp = requests.post(
            f"{BASE_URL}/users",
            json=user_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Failed to create user: {create_resp.text}"
        json_resp = create_resp.json()
        if isinstance(json_resp, dict) and "id" in json_resp:
            user_id = json_resp["id"]
        else:
            list_resp = requests.get(f"{BASE_URL}/users", headers=headers, timeout=TIMEOUT)
            assert list_resp.status_code == 200, f"Failed to list users: {list_resp.text}"
            users_list = list_resp.json()
            found_user = next((u for u in users_list if u.get("nik") == user_payload["nik"]), None)
            assert found_user is not None, "Created user not found in list"
            user_id = found_user.get("id")
        assert user_id, "User ID not found after creation"

        valid_statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"]
        for status_value in valid_statuses:
            patch_resp = requests.patch(
                f"{BASE_URL}/users/{user_id}/status",
                json={"status": status_value},
                headers={**headers, "Content-Type": "application/json"},
                timeout=TIMEOUT,
            )
            assert patch_resp.status_code == 200, f"Failed to update status {status_value}: {patch_resp.text}"

            get_resp = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers, timeout=TIMEOUT)
            assert get_resp.status_code == 200, f"Failed to get user detail after status update: {get_resp.text}"
            user_data = get_resp.json()
            assert "status" in user_data or "status" in user_data.get("data", {}), "User status field missing in response"
            actual_status = user_data.get("status") or user_data.get("data", {}).get("status")
            assert actual_status == status_value, f"Expected status {status_value}, got {actual_status}"

    finally:
        if user_id:
            del_resp = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers, timeout=TIMEOUT)
            assert del_resp.status_code in [200, 204, 404], f"Failed to delete user in cleanup: {del_resp.text}"

test_users_management_update_user_status_endpoint()
