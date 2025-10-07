import requests
from requests.auth import HTTPBasicAuth
import json

BASE_URL = "http://localhost:3000/api"
USERNAME = "ADM001"
PASSWORD = "admin123"
TIMEOUT = 30

def login():
    url = f"{BASE_URL}/auth/login"
    payload = {
        "nik": USERNAME,
        "password": PASSWORD
    }
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    # Assert full LoginResponse schema
    assert "accessToken" in data and "refreshToken" in data and "user" in data
    user = data["user"]
    assert "id" in user and "username" in user and "role" in user and "createdAt" in user
    return data["accessToken"], user["id"]

def create_user(token):
    url = f"{BASE_URL}/users"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    import uuid
    unique_nik = f"testnik_{uuid.uuid4().hex[:8]}"
    user_data = {
        "nik": unique_nik,
        "password": "TestPass123!",
        "role": "employee"
    }
    response = requests.post(url, json=user_data, headers=headers, timeout=TIMEOUT)
    if response.status_code == 201:
        created_user = response.json()
        assert "id" in created_user
        return created_user["id"]
    elif response.status_code == 409:
        raise RuntimeError("Conflict on creating user, username might exist")
    else:
        response.raise_for_status()

def delete_user(token, user_id):
    url = f"{BASE_URL}/users/{user_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    if response.status_code not in (200, 204):
        response.raise_for_status()

def update_user_profile_successfully():
    access_token, user_id = login()

    new_user_id = None
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        new_user_id = create_user(access_token)

        profile_update_payload = {
            "username": "updated_testuser",
            "fullname": "Updated Test User",
            "email": "updated_testuser@example.com",
            "phone": "08123456789"
        }

        url = f"{BASE_URL}/users/{new_user_id}/profile"
        response = requests.patch(url, json=profile_update_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        resp_json = response.json()
        for key, val in profile_update_payload.items():
            assert key in resp_json and resp_json[key] == val

    finally:
        if new_user_id:
            delete_user(access_token, new_user_id)

update_user_profile_successfully()
