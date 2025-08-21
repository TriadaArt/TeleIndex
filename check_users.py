#!/usr/bin/env python3
"""
Create test users using admin privileges
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://tele-directory.preview.emergentagent.com/api"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def main():
    session = requests.Session()
    
    # First, login with existing admin to get token
    log("Logging in with existing admin...")
    
    # Try the known admin credentials from the test file
    admin_login = {
        "email": "admin@teleindex.com",
        "password": "SecureAdmin123!"
    }
    
    try:
        response = session.post(f"{BASE_URL}/auth/login", json=admin_login)
        if response.status_code == 200:
            data = response.json()
            token = data["access_token"]
            log(f"✅ Admin login successful")
            
            # Set auth header
            session.headers.update({"Authorization": f"Bearer {token}"})
            
            # Now let's check if we can create users directly in the database
            # Since the registration endpoint blocks multiple users, we need to check
            # if there's another way to create users or if the test users already exist
            
            # Let's try to login with the test users first to see if they exist
            log("Checking if test users already exist...")
            
            test_users = [
                {"email": "testuser@example.com", "password": "Test1234!"},
                {"email": "admin@example.com", "password": "Admin123!"}
            ]
            
            for user_creds in test_users:
                try:
                    login_response = session.post(f"{BASE_URL}/auth/login", json=user_creds)
                    if login_response.status_code == 200:
                        user_data = login_response.json()["user"]
                        log(f"✅ User {user_creds['email']} already exists and can login (ID: {user_data['id']})")
                    else:
                        log(f"❌ User {user_creds['email']} does not exist or cannot login: {login_response.status_code}")
                except Exception as e:
                    log(f"❌ Error checking user {user_creds['email']}: {e}")
            
            # Since we can't create new users via the registration endpoint when admin exists,
            # let's verify the endpoints work with existing admin
            log("\nTesting endpoints with admin credentials...")
            
            # Test categories
            cat_response = session.get(f"{BASE_URL}/categories")
            if cat_response.status_code == 200:
                categories = cat_response.json()
                log(f"✅ Categories: {len(categories)} categories found")
            else:
                log(f"❌ Categories failed: {cat_response.status_code}")
            
            # Test channels
            channels_response = session.get(f"{BASE_URL}/channels")
            if channels_response.status_code == 200:
                channels_data = channels_response.json()
                log(f"✅ Channels: {len(channels_data['items'])} channels found (total: {channels_data['total']})")
            else:
                log(f"❌ Channels failed: {channels_response.status_code}")
            
            # Test creators
            creators_response = session.get(f"{BASE_URL}/creators")
            if creators_response.status_code == 200:
                creators_data = creators_response.json()
                log(f"✅ Creators: {len(creators_data['items'])} creators found (total: {creators_data['meta']['total']})")
            else:
                log(f"❌ Creators failed: {creators_response.status_code}")
                
        else:
            log(f"❌ Admin login failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        log(f"❌ Error: {e}")

if __name__ == "__main__":
    main()