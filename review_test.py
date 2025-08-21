#!/usr/bin/env python3
"""
Review Request Testing Script
Creates test users and verifies basic endpoints as requested
"""

import requests
import json
from datetime import datetime

# Use the external URL from frontend/.env for testing
BASE_URL = "https://tele-directory.preview.emergentagent.com/api"

class ReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_token = None
        self.admin_user_token = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_create_test_users(self):
        """Create the requested test users"""
        self.log("Creating test users as requested...")
        
        # Test user 1: testuser@example.com / Test1234! / admin
        test_user_data = {
            "email": "testuser@example.com",
            "password": "Test1234!",
            "role": "admin"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=test_user_data)
            
            if response.status_code == 200:
                user = response.json()
                self.log(f"✅ Created test user: {user['email']} with ID: {user['id']}")
            elif response.status_code == 403:
                self.log("ℹ️  Test user registration blocked - admin already exists (expected)")
            else:
                self.log(f"❌ Test user creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Test user creation failed: {e}")
            return False
        
        # Test user 2: admin@example.com / Admin123! / admin
        admin_user_data = {
            "email": "admin@example.com", 
            "password": "Admin123!",
            "role": "admin"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=admin_user_data)
            
            if response.status_code == 200:
                user = response.json()
                self.log(f"✅ Created admin user: {user['email']} with ID: {user['id']}")
            elif response.status_code == 403:
                self.log("ℹ️  Admin user registration blocked - admin already exists (expected)")
            else:
                self.log(f"❌ Admin user creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin user creation failed: {e}")
            return False
            
        return True
    
    def test_login_users(self):
        """Test login for both users"""
        self.log("Testing login for both users...")
        
        # Test login for testuser@example.com
        test_login_data = {
            "email": "testuser@example.com",
            "password": "Test1234!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=test_login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_token = data["access_token"]
                user_info = data["user"]
                self.log(f"✅ Test user login successful: {user_info['email']} (ID: {user_info['id']})")
            else:
                self.log(f"❌ Test user login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Test user login failed: {e}")
            return False
        
        # Test login for admin@example.com
        admin_login_data = {
            "email": "admin@example.com",
            "password": "Admin123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=admin_login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_user_token = data["access_token"]
                user_info = data["user"]
                self.log(f"✅ Admin user login successful: {user_info['email']} (ID: {user_info['id']})")
            else:
                self.log(f"❌ Admin user login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin user login failed: {e}")
            return False
            
        return True
    
    def test_categories_endpoint(self):
        """Test /api/categories endpoint"""
        self.log("Testing /api/categories endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/categories")
            
            if response.status_code == 200:
                categories = response.json()
                self.log(f"✅ Categories endpoint working - returned {len(categories)} categories")
                if categories:
                    self.log(f"   Sample categories: {categories[:5]}")
                return True
            else:
                self.log(f"❌ Categories endpoint failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Categories endpoint failed: {e}")
            return False
    
    def test_channels_endpoint(self):
        """Test /api/channels endpoint"""
        self.log("Testing /api/channels endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/channels")
            
            if response.status_code == 200:
                data = response.json()
                channels = data.get("items", [])
                total = data.get("total", 0)
                self.log(f"✅ Channels endpoint working - returned {len(channels)} channels (total: {total})")
                
                if channels:
                    sample_channel = channels[0]
                    self.log(f"   Sample channel: {sample_channel.get('name')} ({sample_channel.get('subscribers')} subscribers)")
                else:
                    self.log("   No channels found - this is acceptable for a fresh system")
                    
                return True
            else:
                self.log(f"❌ Channels endpoint failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Channels endpoint failed: {e}")
            return False
    
    def test_creators_endpoint(self):
        """Test /api/creators endpoint"""
        self.log("Testing /api/creators endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/creators")
            
            if response.status_code == 200:
                data = response.json()
                creators = data.get("items", [])
                meta = data.get("meta", {})
                total = meta.get("total", 0)
                self.log(f"✅ Creators endpoint working - returned {len(creators)} creators (total: {total})")
                
                if creators:
                    sample_creator = creators[0]
                    metrics = sample_creator.get("metrics", {})
                    self.log(f"   Sample creator: {sample_creator.get('name')} ({metrics.get('subscribers_total', 0)} total subscribers)")
                else:
                    self.log("   No creators found - this is acceptable for a fresh system")
                    
                return True
            else:
                self.log(f"❌ Creators endpoint failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Creators endpoint failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all review tests"""
        self.log("=== STARTING REVIEW REQUEST TESTING ===")
        
        tests = [
            ("Create Test Users", self.test_create_test_users),
            ("Login Test Users", self.test_login_users),
            ("Categories Endpoint", self.test_categories_endpoint),
            ("Channels Endpoint", self.test_channels_endpoint),
            ("Creators Endpoint", self.test_creators_endpoint),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                self.log(f"❌ {test_name} - EXCEPTION: {e}")
                results.append((test_name, False))
        
        # Summary
        self.log("\n=== REVIEW TEST SUMMARY ===")
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All review requirements verified successfully!")
        else:
            self.log("⚠️  Some tests failed - see details above")
        
        return passed == total

if __name__ == "__main__":
    tester = ReviewTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)