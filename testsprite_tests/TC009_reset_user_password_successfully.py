import requests

BASE_URL = "http://localhost:3000/api"
NIK = "ADM001"
PASSWORD = "admin123"
TIMEOUT = 30


def get_access_token():
    login_payload = {
        "nik": NIK,
        "password": PASSWORD
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    access_token = data.get("accessToken")
    assert isinstance(access_token, str) and access_token != ""
    return access_token


def test_reset_user_password_successfully():
    access_token = get_access_token()
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    # Step 1: Create a new user to reset password for
    create_user_payload = {
        "nik": "testuser_resetpw",
        "namaLengkap": "Test User ResetPW",
        "roleAccess": "employee"
    }

    created_user_id = None
    try:
        # Create user
        create_response = requests.post(
            f"{BASE_URL}/users",
            json=create_user_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_response.status_code == 201, f"User creation failed: {create_response.text}"
        created_user = create_response.json()
        created_user_id = created_user.get("id")
        assert isinstance(created_user_id, str) and created_user_id != ""

        # Step 2: Reset password for the created user
        reset_password_response = requests.post(
            f"{BASE_URL}/users/{created_user_id}/reset-password",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert reset_password_response.status_code == 200, f"Password reset failed: {reset_password_response.text}"
    finally:
        # Cleanup: Delete the created user
        if created_user_id:
            try:
                requests.delete(
                    f"{BASE_URL}/users/{created_user_id}",
                    headers=headers,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass


test_reset_user_password_successfully()
