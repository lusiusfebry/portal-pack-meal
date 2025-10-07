import requests
import uuid

API_BASE_URL = "http://localhost:3000/api"
AUTH_USERNAME = "ADM001"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

def login_and_get_jwt() -> str:
    resp = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={"nik": AUTH_USERNAME, "password": AUTH_PASSWORD},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    return data["accessToken"]

def create_user(headers, username, nik, role, password, department_id=None):
    payload = {
        "username": username,
        "nik": nik,
        "role": role,
        "password": password,
    }
    if department_id:
        payload["departmentId"] = department_id

    resp = requests.post(
        f"{API_BASE_URL}/users",
        headers=headers,
        json=payload,
        timeout=TIMEOUT,
    )
    if resp.status_code == 201:
        return resp.json().get("id") or resp.headers.get("Location") or None
    elif resp.status_code == 409:
        users_resp = requests.get(f"{API_BASE_URL}/users", headers=headers, timeout=TIMEOUT)
        users_resp.raise_for_status()
        for u in users_resp.json():
            if u.get("username") == username and u.get("nik") == nik:
                return u.get("id")
        raise Exception("Conflict on create user but no existing user found")
    else:
        resp.raise_for_status()

def test_users_management_update_user_role_endpoint():
    access_token = login_and_get_jwt()
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    unique_suffix = str(uuid.uuid4())[:8]
    test_username = f"testuser_{unique_suffix}"
    test_nik = f"NIK{unique_suffix}"
    initial_role = "employee"
    password = "TestPass123!"

    user_id = None
    try:
        user_id = create_user(headers, test_username, test_nik, initial_role, password)

        valid_roles = ["administrator", "employee", "dapur", "delivery"]

        for role in valid_roles:
            resp = requests.patch(
                f"{API_BASE_URL}/users/{user_id}/role",
                headers=headers,
                json={"role": role},
                timeout=TIMEOUT,
            )
            assert resp.status_code == 200, f"Failed to update role to {role}, status: {resp.status_code}"

            get_resp = requests.get(
                f"{API_BASE_URL}/users/{user_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert get_resp.status_code == 200, f"Failed to get user after role update to {role}"
            user_data = get_resp.json()
            assert user_data.get("role") == role, f"Role not updated correctly, expected {role}, got {user_data.get('role')}"

        # Enforce RBAC by using employee token
        requests.patch(f"{API_BASE_URL}/users/{user_id}/role", headers=headers, json={"role": "employee"}, timeout=TIMEOUT).raise_for_status()

        login_resp = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"nik": test_nik, "password": password},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, "Failed to login with employee user for RBAC test"
        employee_access_token = login_resp.json()["accessToken"]
        employee_headers = {"Authorization": f"Bearer {employee_access_token}", "Content-Type": "application/json"}

        update_resp = requests.patch(
            f"{API_BASE_URL}/users/{user_id}/role",
            headers=employee_headers,
            json={"role": "administrator"},
            timeout=TIMEOUT,
        )
        assert update_resp.status_code in (401, 403), f"Expected RBAC to forbid role update, got status {update_resp.status_code}"

    finally:
        pass  # No delete_user as delete endpoint is not defined in PRD

test_users_management_update_user_role_endpoint()
