import requests
import uuid

BASE_URL = "http://localhost:3000/api"
AUTH_USERNAME = "ADM001"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

# Function to login and get access token

def get_access_token(username, password):
    login_payload = {
        "nik": username,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    data = response.json()
    assert "accessToken" in data, "Login response missing accessToken"
    return data["accessToken"]


def test_create_user_with_valid_data_and_handle_conflicts():
    access_token = get_access_token(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    # Generate unique username to avoid conflicts for first create
    unique_suffix = str(uuid.uuid4())[:8]
    user_payload = {
        "username": f"testuser_{unique_suffix}",
        "password": "TestPass123!",
        "role": "employee",
        "nik": f"nik{unique_suffix}"
    }

    # Create user function
    def create_user(payload):
        response = requests.post(f"{BASE_URL}/users", json=payload, headers=headers, timeout=TIMEOUT)
        return response

    # Delete user function to cleanup
    def delete_user(user_id):
        # Assume DELETE /users/{id} exists for cleanup (not documented, but needed for cleanup)
        # If not, skip deletion.
        try:
            requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass

    user_id = None

    try:
        # First: Create new user with valid data
        response = create_user(user_payload)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response missing user id"
        user_id = data["id"]

        # Second: Attempt to create user with same username to cause conflict (409)
        conflict_payload = user_payload.copy()
        conflict_response = create_user(conflict_payload)
        assert conflict_response.status_code == 409, f"Expected 409 Conflict on duplicate user creation, got {conflict_response.status_code}"

        # Third: Attempt to create user with same NIK to cause conflict (assuming NIK unique)
        another_unique_username = f"testuser_{str(uuid.uuid4())[:8]}"
        conflict_payload2 = user_payload.copy()
        conflict_payload2["username"] = another_unique_username  # different username
        conflict_response2 = create_user(conflict_payload2)
        # This may succeed or conflict depending on NIK uniqueness enforcement
        # So we test for 409 or success 201 if NIK is not unique
        assert conflict_response2.status_code in (201, 409), f"Expected 201 or 409 on NIK conflict test, got {conflict_response2.status_code}"

        # If second conflict attempt succeeded (201), delete that user too
        if conflict_response2.status_code == 201:
            created_user2 = conflict_response2.json()
            if "id" in created_user2:
                delete_user(created_user2["id"])

    finally:
        if user_id:
            delete_user(user_id)


test_create_user_with_valid_data_and_handle_conflicts()
