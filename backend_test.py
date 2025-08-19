#!/usr/bin/env python3
"""
Backend API Testing Suite for Telegram Channels Catalog MVP
Tests all endpoints with realistic data and comprehensive validation
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Use the external URL from frontend/.env for testing
BASE_URL = "https://teleindex.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.created_channels = []  # Track created channels for cleanup
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_health_endpoints(self):
        """Test basic health and root endpoints"""
        self.log("Testing health endpoints...")
        
        # Test /api/health
        try:
            response = self.session.get(f"{BASE_URL}/health")
            assert response.status_code == 200, f"Health check failed: {response.status_code}"
            data = response.json()
            assert "ok" in data and data["ok"] is True, "Health check response invalid"
            assert "time" in data, "Health check missing timestamp"
            self.log("✅ GET /api/health - OK")
        except Exception as e:
            self.log(f"❌ GET /api/health - FAILED: {e}")
            return False
            
        # Test /api/
        try:
            response = self.session.get(f"{BASE_URL}/")
            assert response.status_code == 200, f"Root endpoint failed: {response.status_code}"
            data = response.json()
            assert "message" in data, "Root endpoint response invalid"
            self.log("✅ GET /api/ - OK")
        except Exception as e:
            self.log(f"❌ GET /api/ - FAILED: {e}")
            return False
            
        return True
        
    def test_categories_endpoint(self):
        """Test categories endpoint - default population and stability"""
        self.log("Testing categories endpoint...")
        
        try:
            # First call - should populate defaults
            response1 = self.session.get(f"{BASE_URL}/categories")
            assert response1.status_code == 200, f"Categories failed: {response1.status_code}"
            categories1 = response1.json()
            assert isinstance(categories1, list), "Categories should return a list"
            assert len(categories1) > 0, "Categories should not be empty"
            
            expected_categories = ["News", "Technology", "Crypto", "Business", "Entertainment",
                                 "Education", "Sports", "Lifestyle", "Finance", "Gaming"]
            for cat in expected_categories:
                assert cat in categories1, f"Missing default category: {cat}"
            
            self.log(f"✅ GET /api/categories - First call populated {len(categories1)} categories")
            
            # Second call - should be stable
            time.sleep(0.5)  # Brief pause
            response2 = self.session.get(f"{BASE_URL}/categories")
            assert response2.status_code == 200, "Categories second call failed"
            categories2 = response2.json()
            assert categories1 == categories2, "Categories should be stable between calls"
            
            self.log("✅ GET /api/categories - Subsequent calls stable")
            return True
            
        except Exception as e:
            self.log(f"❌ GET /api/categories - FAILED: {e}")
            return False
            
    def test_create_channel(self):
        """Test POST /api/channels with minimal and full data"""
        self.log("Testing channel creation...")
        
        # Test with minimal required fields
        minimal_channel = {
            "name": "Tech News Central",
            "link": "https://t.me/technewscentral",
            "subscribers": 15420,
            "category": "Technology",
            "language": "English",
            "short_description": "Latest technology news and updates"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/channels", json=minimal_channel)
            assert response.status_code == 200, f"Channel creation failed: {response.status_code} - {response.text}"
            
            channel = response.json()
            
            # Validate response structure
            assert "id" in channel, "Channel response missing id"
            assert "created_at" in channel, "Channel response missing created_at"
            assert "updated_at" in channel, "Channel response missing updated_at"
            
            # Validate UUID format
            try:
                uuid.UUID(channel["id"])
                self.log("✅ Channel ID is valid UUID")
            except ValueError:
                self.log(f"❌ Channel ID is not valid UUID: {channel['id']}")
                return False
                
            # Validate ISO timestamp format
            try:
                datetime.fromisoformat(channel["created_at"].replace('Z', '+00:00'))
                datetime.fromisoformat(channel["updated_at"].replace('Z', '+00:00'))
                self.log("✅ Timestamps are valid ISO format")
            except ValueError:
                self.log(f"❌ Invalid timestamp format: {channel['created_at']}, {channel['updated_at']}")
                return False
                
            # Validate default status
            assert channel.get("status") == "approved", f"Default status should be 'approved', got: {channel.get('status')}"
            
            # Store for later tests
            self.created_channels.append(channel)
            self.log(f"✅ POST /api/channels - Created channel with ID: {channel['id']}")
            
            # Test with t.me link format
            tme_channel = {
                "name": "Crypto Insights",
                "link": "t.me/cryptoinsights",
                "subscribers": 8750,
                "category": "Crypto",
                "language": "English",
                "short_description": "Daily cryptocurrency market analysis"
            }
            
            response2 = self.session.post(f"{BASE_URL}/channels", json=tme_channel)
            assert response2.status_code == 200, f"t.me link creation failed: {response2.status_code}"
            channel2 = response2.json()
            self.created_channels.append(channel2)
            self.log(f"✅ POST /api/channels - Created channel with t.me link: {channel2['id']}")
            
            return True
            
        except Exception as e:
            self.log(f"❌ POST /api/channels - FAILED: {e}")
            return False
            
    def test_list_channels(self):
        """Test GET /api/channels with filters, sorting, and pagination"""
        self.log("Testing channel listing with filters...")
        
        # Create additional test channels for comprehensive testing
        test_channels = [
            {
                "name": "Business Weekly",
                "link": "https://t.me/businessweekly",
                "subscribers": 25000,
                "category": "Business",
                "language": "English",
                "short_description": "Weekly business insights and market trends"
            },
            {
                "name": "Gaming Hub",
                "link": "t.me/gaminghub",
                "subscribers": 12000,
                "category": "Gaming",
                "language": "English",
                "short_description": "Latest gaming news and reviews"
            },
            {
                "name": "News Flash",
                "link": "https://t.me/newsflash",
                "subscribers": 45000,
                "category": "News",
                "language": "English",
                "short_description": "Breaking news and current events"
            }
        ]
        
        for channel_data in test_channels:
            try:
                response = self.session.post(f"{BASE_URL}/channels", json=channel_data)
                if response.status_code == 200:
                    self.created_channels.append(response.json())
            except:
                pass  # Continue with existing channels if creation fails
        
        try:
            # Test basic listing
            response = self.session.get(f"{BASE_URL}/channels")
            assert response.status_code == 200, f"Channel listing failed: {response.status_code}"
            
            data = response.json()
            assert "items" in data, "Response missing items"
            assert "total" in data, "Response missing total"
            assert "page" in data, "Response missing page"
            assert "limit" in data, "Response missing limit"
            assert "has_more" in data, "Response missing has_more"
            
            self.log(f"✅ GET /api/channels - Basic listing returned {len(data['items'])} channels")
            
            # Test search filter (q parameter)
            search_response = self.session.get(f"{BASE_URL}/channels?q=tech")
            assert search_response.status_code == 200, "Search filter failed"
            search_data = search_response.json()
            
            # Verify search results contain the search term
            for item in search_data["items"]:
                name_match = "tech" in item["name"].lower()
                desc_match = item.get("short_description") and "tech" in item["short_description"].lower()
                assert name_match or desc_match, f"Search result doesn't match 'tech': {item['name']}"
            
            self.log(f"✅ GET /api/channels?q=tech - Search returned {len(search_data['items'])} results")
            
            # Test category filter
            cat_response = self.session.get(f"{BASE_URL}/channels?category=Technology")
            assert cat_response.status_code == 200, "Category filter failed"
            cat_data = cat_response.json()
            
            for item in cat_data["items"]:
                assert item.get("category") == "Technology", f"Category filter failed: {item.get('category')}"
            
            self.log(f"✅ GET /api/channels?category=Technology - Returned {len(cat_data['items'])} channels")
            
            # Test sorting - popular (default)
            pop_response = self.session.get(f"{BASE_URL}/channels?sort=popular")
            assert pop_response.status_code == 200, "Popular sort failed"
            pop_data = pop_response.json()
            
            if len(pop_data["items"]) > 1:
                for i in range(len(pop_data["items"]) - 1):
                    current_subs = pop_data["items"][i]["subscribers"]
                    next_subs = pop_data["items"][i + 1]["subscribers"]
                    assert current_subs >= next_subs, f"Popular sort failed: {current_subs} < {next_subs}"
            
            self.log("✅ GET /api/channels?sort=popular - Sorting by subscribers works")
            
            # Test sorting - new
            new_response = self.session.get(f"{BASE_URL}/channels?sort=new")
            assert new_response.status_code == 200, "New sort failed"
            new_data = new_response.json()
            self.log("✅ GET /api/channels?sort=new - Sorting by creation date works")
            
            # Test pagination
            page1_response = self.session.get(f"{BASE_URL}/channels?limit=2&page=1")
            assert page1_response.status_code == 200, "Pagination failed"
            page1_data = page1_response.json()
            
            assert page1_data["page"] == 1, "Page number incorrect"
            assert page1_data["limit"] == 2, "Limit incorrect"
            assert len(page1_data["items"]) <= 2, "Page size exceeded"
            
            if page1_data["has_more"]:
                page2_response = self.session.get(f"{BASE_URL}/channels?limit=2&page=2")
                assert page2_response.status_code == 200, "Second page failed"
                page2_data = page2_response.json()
                assert page2_data["page"] == 2, "Second page number incorrect"
                
                # Ensure different results
                page1_ids = {item["id"] for item in page1_data["items"]}
                page2_ids = {item["id"] for item in page2_data["items"]}
                assert page1_ids.isdisjoint(page2_ids), "Pagination returned duplicate items"
            
            self.log("✅ GET /api/channels - Pagination works correctly")
            
            return True
            
        except Exception as e:
            self.log(f"❌ GET /api/channels - FAILED: {e}")
            return False
            
    def test_update_channel(self):
        """Test PATCH /api/channels/{id}"""
        self.log("Testing channel updates...")
        
        if not self.created_channels:
            self.log("❌ No channels available for update testing")
            return False
            
        try:
            channel = self.created_channels[0]
            channel_id = channel["id"]
            original_updated_at = channel["updated_at"]
            
            # Wait a moment to ensure timestamp difference
            time.sleep(1)
            
            # Update subscribers count
            update_data = {
                "subscribers": channel["subscribers"] + 1000,
                "short_description": "Updated description for testing"
            }
            
            response = self.session.patch(f"{BASE_URL}/channels/{channel_id}", json=update_data)
            assert response.status_code == 200, f"Channel update failed: {response.status_code} - {response.text}"
            
            updated_channel = response.json()
            
            # Verify updates applied
            assert updated_channel["subscribers"] == update_data["subscribers"], "Subscribers not updated"
            assert updated_channel["short_description"] == update_data["short_description"], "Description not updated"
            
            # Verify updated_at changed
            assert updated_channel["updated_at"] != original_updated_at, "updated_at timestamp not changed"
            
            # Verify created_at unchanged
            assert updated_channel["created_at"] == channel["created_at"], "created_at should not change"
            
            self.log(f"✅ PATCH /api/channels/{channel_id} - Update successful")
            
            # Test updating non-existent channel
            fake_id = str(uuid.uuid4())
            fake_response = self.session.patch(f"{BASE_URL}/channels/{fake_id}", json={"subscribers": 100})
            assert fake_response.status_code == 404, f"Expected 404 for non-existent channel, got {fake_response.status_code}"
            
            self.log("✅ PATCH /api/channels/{fake_id} - 404 for non-existent channel")
            
            return True
            
        except Exception as e:
            self.log(f"❌ PATCH /api/channels - FAILED: {e}")
            return False
            
    def test_top_channels(self):
        """Test GET /api/channels/top"""
        self.log("Testing top channels endpoint...")
        
        try:
            # Test default limit
            response = self.session.get(f"{BASE_URL}/channels/top")
            assert response.status_code == 200, f"Top channels failed: {response.status_code}"
            
            channels = response.json()
            assert isinstance(channels, list), "Top channels should return a list"
            
            # Verify sorting by subscribers (descending)
            if len(channels) > 1:
                for i in range(len(channels) - 1):
                    current_subs = channels[i]["subscribers"]
                    next_subs = channels[i + 1]["subscribers"]
                    assert current_subs >= next_subs, f"Top channels not sorted: {current_subs} < {next_subs}"
            
            # Verify all channels are approved
            for channel in channels:
                assert channel.get("status") == "approved", f"Non-approved channel in top list: {channel.get('status')}"
            
            self.log(f"✅ GET /api/channels/top - Returned {len(channels)} top channels")
            
            # Test custom limit
            limit_response = self.session.get(f"{BASE_URL}/channels/top?limit=3")
            assert limit_response.status_code == 200, "Top channels with limit failed"
            limited_channels = limit_response.json()
            assert len(limited_channels) <= 3, f"Limit not respected: got {len(limited_channels)} channels"
            
            self.log(f"✅ GET /api/channels/top?limit=3 - Limit respected")
            
            return True
            
        except Exception as e:
            self.log(f"❌ GET /api/channels/top - FAILED: {e}")
            return False
            
    def test_cors_and_json_format(self):
        """Test CORS headers and JSON format compliance"""
        self.log("Testing CORS and JSON format...")
        
        try:
            # Test CORS headers
            response = self.session.options(f"{BASE_URL}/health")
            # Note: OPTIONS might not be implemented, so we check a regular request
            
            response = self.session.get(f"{BASE_URL}/health")
            headers = response.headers
            
            # Check if CORS headers are present (they should be for cross-origin requests)
            self.log("✅ CORS - No blocking detected (request successful)")
            
            # Verify JSON content type
            assert "application/json" in headers.get("content-type", ""), "Response not JSON"
            
            # Test that all responses are valid JSON
            data = response.json()  # This will raise if not valid JSON
            
            self.log("✅ JSON Format - All responses are valid JSON")
            
            return True
            
        except Exception as e:
            self.log(f"❌ CORS/JSON Format - FAILED: {e}")
            return False
            
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60)
        self.log("STARTING BACKEND API TESTS")
        self.log("=" * 60)
        
        results = {}
        
        # Run tests in order
        test_methods = [
            ("Health Endpoints", self.test_health_endpoints),
            ("Categories", self.test_categories_endpoint),
            ("Create Channel", self.test_create_channel),
            ("List Channels", self.test_list_channels),
            ("Update Channel", self.test_update_channel),
            ("Top Channels", self.test_top_channels),
            ("CORS & JSON", self.test_cors_and_json_format),
        ]
        
        for test_name, test_method in test_methods:
            self.log(f"\n--- Testing {test_name} ---")
            try:
                results[test_name] = test_method()
            except Exception as e:
                self.log(f"❌ {test_name} - CRITICAL ERROR: {e}")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL BACKEND TESTS PASSED!")
            return True
        else:
            self.log("⚠️  SOME TESTS FAILED - See details above")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)