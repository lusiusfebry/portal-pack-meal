import requests
import uuid

API_BASE_URL = "http://localhost:3000/api"
AUTH_USERNAME = "ADM001"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

def authenticate():
    resp = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={"nik": AUTH_USERNAME, "password": AUTH_PASSWORD},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["accessToken"]

def create_user(token, username, nik, role="employee", password="Initial123!"):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "username": username,
        "nik": nik,
        "role": role,
        "password": password
    }
    resp = requests.post(f"{API_BASE_URL}/users", json=payload, headers=headers, timeout=TIMEOUT)
    if resp.status_code == 409:
        raise Exception(f"User with nik {nik} or username {username} already exists.")
    resp.raise_for_status()
    return resp.json()

def delete_user(token, user_id):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(f"{API_BASE_URL}/users/{user_id}", headers=headers, timeout=TIMEOUT)
    # delete user might not be in API doc but try anyway, ignore if 404 or method not allowed
    if resp.status_code not in (200, 204, 404):
        resp.raise_for_status()

def reset_password(token, user_id, new_password):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"newPassword": new_password}
    resp = requests.post(f"{API_BASE_URL}/users/{user_id}/reset-password", json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp

def login_user(nik, password):
    resp = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={"nik": nik, "password": password},
        timeout=TIMEOUT,
    )
    return resp

def test_users_management_reset_user_password_endpoint():
    token = authenticate()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a new user to test password reset (unique nik and username)
    uniq_suffix = uuid.uuid4().hex[:8]
    username = f"testuser_{uniq_suffix}"
    nik = f"testnik{uniq_suffix}"
    initial_password = "InitPass123!"
    new_password = "NewPass456!"

    user_id = None
    try:
        # Create user
        create_resp = requests.post(
            f"{API_BASE_URL}/users",
            json={
                "username": username,
                "nik": nik,
                "role": "employee",
                "password": initial_password
            },
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201
        user_data = create_resp.json()
        # The response may contain created user data with id, if not, fetch user list and find id
        if "id" in user_data:
            user_id = user_data["id"]
        else:
            # fallback: fetch users and find user by nik or username
            list_resp = requests.get(f"{API_BASE_URL}/users", headers=headers, timeout=TIMEOUT)
            list_resp.raise_for_status()
            users = list_resp.json()
            found_users = [u for u in users if u.get("nik") == nik and u.get("username") == username]
            assert len(found_users) == 1
            user_id = found_users[0]["id"]

        assert user_id is not None

        # Reset password with valid new password
        reset_resp = reset_password(token, user_id, new_password)
        assert reset_resp.status_code == 200

        # Verify password update by trying to login with new password
        login_new = login_user(nik, new_password)
        assert login_new.status_code == 200
        login_new_data = login_new.json()
        assert "accessToken" in login_new_data
        assert "refreshToken" in login_new_data
        assert "user" in login_new_data
        # The user object should have 'id', 'username', 'role' according to API spec
        assert "id" in login_new_data["user"]
        assert "username" in login_new_data["user"] and login_new_data["user"]["username"] == username
        assert "role" in login_new_data["user"] and login_new_data["user"]["role"] == "employee"

        # Verify login fails with old password
        login_old = login_user(nik, initial_password)
        assert login_old.status_code == 401 or login_old.status_code == 400

    finally:
        if user_id:
            try:
                # Cleanup: delete the created user after test
                delete_resp = requests.delete(
                    f"{API_BASE_URL}/users/{user_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                # Accept 200, 204 or 404 as possible success/failure in cleanup
                assert delete_resp.status_code in (200, 204, 404)
            except Exception:
                pass

test_users_management_reset_user_password_endpoint()
