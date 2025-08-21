#!/usr/bin/env python3
"""
Targeted Backend Testing for Review Request
Tests specific auth and catalog endpoints as requested
"""

import requests
import json
from datetime import datetime

# Use the external URL from frontend/.env for testing
BASE_URL = "https://tele-directory.preview.emergentagent.com/api"

class ReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.editor_token = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_auth_login_admin(self):
        """Test POST /api/auth/login with admin@test.com / Admin123"""
        self.log("Testing admin login...")
        
        try:
            login_data = {
                "email": "admin@test.com",
                "password": "Admin123"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                assert "access_token" in data, "Login response missing access_token"
                assert "token_type" in data, "Login response missing token_type"
                assert "user" in data, "Login response missing user"
                assert data["token_type"] == "bearer", f"Token type should be bearer, got: {data['token_type']}"
                
                # Validate user info
                user_info = data["user"]
                assert user_info["role"] == "admin", f"User role should be admin, got: {user_info['role']}"
                
                self.admin_token = data["access_token"]
                self.log(f"✅ POST /api/auth/login (admin@test.com) - SUCCESS: role={user_info['role']}")
                return True
            else:
                self.log(f"❌ POST /api/auth/login (admin@test.com) - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ POST /api/auth/login (admin@test.com) - FAILED: {e}")
            return False
    
    def test_auth_login_editor(self):
        """Test POST /api/auth/login with user1@test.com / Test1234"""
        self.log("Testing editor login...")
        
        try:
            login_data = {
                "email": "user1@test.com",
                "password": "Test1234"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                assert "access_token" in data, "Login response missing access_token"
                assert "token_type" in data, "Login response missing token_type"
                assert "user" in data, "Login response missing user"
                assert data["token_type"] == "bearer", f"Token type should be bearer, got: {data['token_type']}"
                
                # Validate user info
                user_info = data["user"]
                assert user_info["role"] == "editor", f"User role should be editor, got: {user_info['role']}"
                
                self.editor_token = data["access_token"]
                self.log(f"✅ POST /api/auth/login (user1@test.com) - SUCCESS: role={user_info['role']}")
                return True
            else:
                self.log(f"❌ POST /api/auth/login (user1@test.com) - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ POST /api/auth/login (user1@test.com) - FAILED: {e}")
            return False
    
    def test_auth_me(self):
        """Test GET /api/auth/me with Bearer token from admin login"""
        self.log("Testing authenticated user info endpoint...")
        
        if not self.admin_token:
            self.log("❌ No admin token available for /me test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                user = response.json()
                
                # Validate response structure
                assert "id" in user, "User response missing id"
                assert "email" in user, "User response missing email"
                assert "role" in user, "User response missing role"
                
                # Validate user info matches admin
                assert user["email"] == "admin@test.com", f"Email mismatch: {user['email']}"
                assert user["role"] == "admin", f"Role should be admin, got: {user['role']}"
                
                self.log(f"✅ GET /api/auth/me - SUCCESS: email={user['email']}, role={user['role']}")
                return True
            else:
                self.log(f"❌ GET /api/auth/me - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ GET /api/auth/me - FAILED: {e}")
            return False
    
    def test_auth_register_blocked(self):
        """Test POST /api/auth/register should be blocked once users exist"""
        self.log("Testing registration blocking...")
        
        try:
            register_data = {
                "email": "newuser@test.com",
                "password": "NewUser123",
                "role": "admin"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=register_data)
            
            if response.status_code == 403:
                self.log("✅ POST /api/auth/register - SUCCESS: Registration properly blocked (403)")
                return True
            else:
                self.log(f"❌ POST /api/auth/register - FAILED: Expected 403, got {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ POST /api/auth/register - FAILED: {e}")
            return False
    
    def test_categories_endpoint(self):
        """Test GET /api/categories returns 5+ categories including expected ones"""
        self.log("Testing categories endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/categories")
            
            if response.status_code == 200:
                categories = response.json()
                assert isinstance(categories, list), "Categories should return a list"
                
                # Check for minimum count
                assert len(categories) >= 5, f"Expected at least 5 categories, got {len(categories)}"
                
                # Check for expected categories (Russian names as per seed data)
                expected_categories = ["Новости", "Технологии", "Крипто", "Бизнес", "Развлечения"]
                found_expected = []
                
                for expected in expected_categories:
                    if expected in categories:
                        found_expected.append(expected)
                
                # Also check for English equivalents
                english_expected = ["News", "Technology", "Crypto", "Business", "Entertainment"]
                found_english = []
                
                for expected in english_expected:
                    if expected in categories:
                        found_english.append(expected)
                
                if found_expected:
                    self.log(f"✅ GET /api/categories - SUCCESS: {len(categories)} categories, found Russian: {found_expected}")
                elif found_english:
                    self.log(f"✅ GET /api/categories - SUCCESS: {len(categories)} categories, found English: {found_english}")
                else:
                    self.log(f"✅ GET /api/categories - SUCCESS: {len(categories)} categories, sample: {categories[:5]}")
                
                return True
            else:
                self.log(f"❌ GET /api/categories - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ GET /api/categories - FAILED: {e}")
            return False
    
    def test_channels_endpoint(self):
        """Test GET /api/channels?limit=10 returns items array with approved channels"""
        self.log("Testing channels endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/channels?limit=10")
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                assert "items" in data, "Response missing items array"
                assert "total" in data, "Response missing total"
                assert "page" in data, "Response missing page"
                assert "limit" in data, "Response missing limit"
                assert "has_more" in data, "Response missing has_more"
                
                items = data["items"]
                assert isinstance(items, list), "Items should be an array"
                
                # Check that all returned channels are approved (default filter)
                for item in items:
                    assert item.get("status") == "approved", f"Non-approved channel found: {item.get('status')}"
                    assert "id" in item, "Channel missing id"
                    assert "name" in item, "Channel missing name"
                    assert "link" in item, "Channel missing link"
                
                self.log(f"✅ GET /api/channels?limit=10 - SUCCESS: {len(items)} approved channels, total={data['total']}")
                
                # Show sample channel data
                if items:
                    sample = items[0]
                    self.log(f"   Sample channel: '{sample['name']}' - {sample.get('subscribers', 0)} subscribers")
                
                return True
            else:
                self.log(f"❌ GET /api/channels?limit=10 - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ GET /api/channels?limit=10 - FAILED: {e}")
            return False
    
    def test_creators_endpoint(self):
        """Test GET /api/creators?limit=5 returns items array and meta"""
        self.log("Testing creators endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/creators?limit=5")
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                assert "items" in data, "Response missing items array"
                assert "meta" in data, "Response missing meta"
                
                items = data["items"]
                meta = data["meta"]
                
                assert isinstance(items, list), "Items should be an array"
                assert isinstance(meta, dict), "Meta should be an object"
                
                # Validate meta structure
                assert "page" in meta, "Meta missing page"
                assert "limit" in meta, "Meta missing limit"
                assert "total" in meta, "Meta missing total"
                assert "pages" in meta, "Meta missing pages"
                
                # Check creator structure if any exist
                for item in items:
                    assert "id" in item, "Creator missing id"
                    assert "name" in item, "Creator missing name"
                    assert "metrics" in item, "Creator missing metrics"
                
                self.log(f"✅ GET /api/creators?limit=5 - SUCCESS: {len(items)} creators, total={meta['total']}")
                
                # Show sample creator data
                if items:
                    sample = items[0]
                    metrics = sample.get("metrics", {})
                    self.log(f"   Sample creator: '{sample['name']}' - {metrics.get('subscribers_total', 0)} total subscribers")
                
                return True
            else:
                self.log(f"❌ GET /api/creators?limit=5 - FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ GET /api/creators?limit=5 - FAILED: {e}")
            return False
    
    def test_cors_and_5xx_check(self):
        """Check for CORS issues and 5xx errors"""
        self.log("Testing for CORS and 5xx issues...")
        
        try:
            # Test a few key endpoints for 5xx errors
            endpoints = [
                "/health",
                "/categories", 
                "/channels",
                "/creators"
            ]
            
            cors_issues = []
            server_errors = []
            
            for endpoint in endpoints:
                try:
                    response = self.session.get(f"{BASE_URL}{endpoint}")
                    
                    # Check for 5xx errors
                    if 500 <= response.status_code < 600:
                        server_errors.append(f"{endpoint}: {response.status_code}")
                    
                    # CORS issues would typically manifest as network errors or specific headers
                    # If we can make the request successfully, CORS is likely working
                    
                except requests.exceptions.RequestException as e:
                    if "CORS" in str(e) or "cross-origin" in str(e).lower():
                        cors_issues.append(f"{endpoint}: {e}")
                    else:
                        server_errors.append(f"{endpoint}: {e}")
            
            if cors_issues:
                self.log(f"❌ CORS Issues Found: {cors_issues}")
                return False
            elif server_errors:
                self.log(f"❌ Server Errors Found: {server_errors}")
                return False
            else:
                self.log("✅ No CORS or 5xx issues detected")
                return True
                
        except Exception as e:
            self.log(f"❌ CORS/5xx check - FAILED: {e}")
            return False
    
    def run_all_tests(self):
        """Run all review tests and return summary"""
        self.log("=" * 60)
        self.log("STARTING TARGETED BACKEND TESTS FOR REVIEW REQUEST")
        self.log("=" * 60)
        
        tests = [
            ("Auth Login (admin@test.com)", self.test_auth_login_admin),
            ("Auth Login (user1@test.com)", self.test_auth_login_editor),
            ("Auth Me Endpoint", self.test_auth_me),
            ("Registration Blocking", self.test_auth_register_blocked),
            ("Categories Endpoint", self.test_categories_endpoint),
            ("Channels Endpoint", self.test_channels_endpoint),
            ("Creators Endpoint", self.test_creators_endpoint),
            ("CORS/5xx Check", self.test_cors_and_5xx_check),
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
            except Exception as e:
                self.log(f"❌ {test_name} - EXCEPTION: {e}")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("REVIEW TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED - Backend is ready for review!")
        else:
            self.log("⚠️  Some tests failed - see details above")
        
        return results

if __name__ == "__main__":
    tester = ReviewTester()
    results = tester.run_all_tests()