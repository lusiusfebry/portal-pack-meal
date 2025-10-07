import requests
import uuid

BASE_URL = "http://localhost:3000/api"
AUTH_LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"
USERS_ENDPOINT = f"{BASE_URL}/users"
AUTH_USERNAME = "ADM001"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30


def authenticate():
    try:
        response = requests.post(
            AUTH_LOGIN_ENDPOINT,
            json={"nik": AUTH_USERNAME, "password": AUTH_PASSWORD},
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens.get("accessToken")
        if not access_token:
            raise Exception("Access token not found in login response")
        return access_token
    except Exception as e:
        raise Exception(f"Authentication failed: {e}")


def test_create_user_and_duplicate_conflict():
    access_token = authenticate()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Unique user data generation
    unique_nik = f"testnik-{uuid.uuid4()}"
    unique_username = f"testuser-{uuid.uuid4()}"
    user_payload = {
        "username": unique_username,
        "nik": unique_nik,
        "role": "employee",
        "password": "TestPass123!",
        "departmentId": str(uuid.uuid4())
    }

    created_user_id = None
    try:
        # Create new user - expect 201 Created
        response = requests.post(
            USERS_ENDPOINT, json=user_payload, headers=headers, timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created but got {response.status_code}"
        created_data = response.json()
        created_user_id = created_data.get("id") or created_data.get("userId") or created_data.get("user", {}).get("id")

        # Create the same user again - expect 409 Conflict
        response_dup = requests.post(
            USERS_ENDPOINT, json=user_payload, headers=headers, timeout=TIMEOUT
        )
        assert response_dup.status_code == 409, f"Expected 409 Conflict for duplicate user but got {response_dup.status_code}"
    finally:
        if created_user_id:
            try:
                # Clean up: delete created user after test
                delete_response = requests.delete(
                    f"{USERS_ENDPOINT}/{created_user_id}",
                    headers=headers,
                    timeout=TIMEOUT,
                )
                # Deletion might respond with 200 or 204 depending on implementation
                assert delete_response.status_code in (200, 204), f"User deletion failed with status {delete_response.status_code}"
            except Exception:
                pass


test_create_user_and_duplicate_conflict()
