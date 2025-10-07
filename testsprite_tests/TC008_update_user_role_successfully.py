import requests

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

LOGIN_NIK = "ADM001"
LOGIN_PASSWORD = "admin123"


def get_access_token():
    login_payload = {"nik": LOGIN_NIK, "password": LOGIN_PASSWORD}
    headers_json = {"Content-Type": "application/json"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload, headers=headers_json, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    access_token = data.get("accessToken")
    assert access_token, "Access token not found in login response"
    return access_token


def test_update_user_role_successfully():
    access_token = get_access_token()
    headers_json = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}

    # Create a new user to update role
    create_payload = {
        "username": "testuser_role_update",
        "nik": "1234567890",
        "password": "TestPass123!",
        "role": "employee"
    }

    created_user_id = None

    # Create user first, then update role, then finally delete user
    try:
        # Create User
        create_resp = requests.post(
            f"{BASE_URL}/users",
            json=create_payload,
            headers=headers_json,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"User creation failed: {create_resp.status_code} {create_resp.text}"
        created_user = create_resp.json()
        created_user_id = created_user.get("id")
        assert created_user_id, "Created user ID not found in response"

        # Choose a different role to update to (not original)
        new_role = "dapur" if create_payload["role"] != "dapur" else "administrator"
        update_payload = {"role": new_role}

        # Update user role
        patch_resp = requests.patch(
            f"{BASE_URL}/users/{created_user_id}/role",
            json=update_payload,
            headers=headers_json,
            timeout=TIMEOUT
        )
        assert patch_resp.status_code == 200, f"Role update failed: {patch_resp.status_code} {patch_resp.text}"

        # Verify updated role by retrieving user details
        get_resp = requests.get(
            f"{BASE_URL}/users/{created_user_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Getting user failed: {get_resp.status_code} {get_resp.text}"
        user_data = get_resp.json()
        assert user_data.get("role") == new_role, f"Role not updated correctly, expected '{new_role}', got '{user_data.get('role')}'"

    finally:
        # Clean up: delete the created user if exists
        if created_user_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/users/{created_user_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=TIMEOUT
                )
                # Accept 200 OK or 204 No Content as successful deletion
                assert del_resp.status_code in (200, 204), f"User deletion failed: {del_resp.status_code} {del_resp.text}"
            except Exception:
                pass


test_update_user_role_successfully()