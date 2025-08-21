#!/usr/bin/env python3
"""
Catalog Functionality Testing Suite
Tests the catalog functionality with real data as requested in the review
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Use the external URL from frontend/.env for testing
BASE_URL = "https://tele-directory.preview.emergentagent.com/api"

class CatalogTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        
    def set_auth_header(self):
        """Set Authorization header for authenticated requests"""
        if self.access_token:
            self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
    
    def clear_auth_header(self):
        """Clear Authorization header"""
        self.session.headers.pop("Authorization", None)
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def authenticate(self):
        """Authenticate as admin to access admin endpoints"""
        self.log("Authenticating as admin...")
        
        try:
            login_data = {
                "email": "admin@teleindex.com",
                "password": "SecureAdmin123!"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.log("✅ Authentication successful")
                return True
            else:
                self.log(f"❌ Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication error: {e}")
            return False
    
    def test_database_counts(self):
        """Check current number of channels and creators in the database"""
        self.log("Checking database counts...")
        
        try:
            # Get channels count
            channels_response = self.session.get(f"{BASE_URL}/channels?limit=1")
            assert channels_response.status_code == 200, f"Channels count check failed: {channels_response.status_code}"
            
            channels_data = channels_response.json()
            channels_total = channels_data.get("total", 0)
            
            # Get creators count
            creators_response = self.session.get(f"{BASE_URL}/creators?limit=1")
            assert creators_response.status_code == 200, f"Creators count check failed: {creators_response.status_code}"
            
            creators_data = creators_response.json()
            creators_total = creators_data.get("meta", {}).get("total", 0)
            
            self.log(f"✅ Database counts - Channels: {channels_total}, Creators: {creators_total}")
            
            return {
                "channels_total": channels_total,
                "creators_total": creators_total
            }
            
        except Exception as e:
            self.log(f"❌ Database counts check - FAILED: {e}")
            return None
    
    def test_channels_endpoint_real_data(self):
        """Test /api/channels endpoint returns real data"""
        self.log("Testing /api/channels endpoint with real data...")
        
        try:
            response = self.session.get(f"{BASE_URL}/channels")
            assert response.status_code == 200, f"Channels endpoint failed: {response.status_code}"
            
            data = response.json()
            
            # Validate response structure
            assert "items" in data, "Response missing items"
            assert "total" in data, "Response missing total"
            assert "page" in data, "Response missing page"
            assert "limit" in data, "Response missing limit"
            assert "has_more" in data, "Response missing has_more"
            
            channels = data["items"]
            total_channels = data["total"]
            
            self.log(f"✅ GET /api/channels - Returned {len(channels)} channels out of {total_channels} total")
            
            if channels:
                # Validate first channel has real data
                sample_channel = channels[0]
                
                # Check required fields
                required_fields = ["id", "name", "link", "subscribers", "created_at", "updated_at"]
                for field in required_fields:
                    assert field in sample_channel, f"Channel missing required field: {field}"
                
                # Validate UUID format
                try:
                    uuid.UUID(sample_channel["id"])
                    self.log("✅ Channel ID is valid UUID")
                except ValueError:
                    self.log(f"❌ Invalid UUID: {sample_channel['id']}")
                    return False
                
                # Check for real data (not dummy data)
                assert sample_channel["name"] != "testchannel", "Found dummy test data"
                assert sample_channel["subscribers"] > 0, "Channel has no subscribers"
                
                # Log sample channel info
                self.log(f"✅ Sample channel: '{sample_channel['name']}' with {sample_channel['subscribers']:,} subscribers")
                
                # Validate data structure for all channels
                for i, channel in enumerate(channels[:5]):  # Check first 5 channels
                    # Validate metrics
                    if channel.get("er"):
                        assert isinstance(channel["er"], (int, float)), f"ER should be numeric: {channel['er']}"
                    
                    if channel.get("price_rub"):
                        assert isinstance(channel["price_rub"], int), f"Price should be integer: {channel['price_rub']}"
                    
                    if channel.get("cpm_rub"):
                        assert isinstance(channel["cpm_rub"], (int, float)), f"CPM should be numeric: {channel['cpm_rub']}"
                    
                    # Validate status
                    assert channel.get("status") == "approved", f"Public channel should be approved: {channel.get('status')}"
                
                self.log("✅ All channels have valid data structure and metrics")
                
                return True
            else:
                self.log("ℹ️  No channels found in database")
                return True
                
        except Exception as e:
            self.log(f"❌ Channels endpoint real data test - FAILED: {e}")
            return False
    
    def test_category_filtering(self):
        """Test filtering by category - pick one category and verify results"""
        self.log("Testing category filtering...")
        
        try:
            # First get available categories
            categories_response = self.session.get(f"{BASE_URL}/categories")
            assert categories_response.status_code == 200, "Categories fetch failed"
            
            categories = categories_response.json()
            self.log(f"✅ Available categories: {categories}")
            
            if not categories:
                self.log("ℹ️  No categories available for filtering test")
                return True
            
            # Pick first category for testing
            test_category = categories[0]
            self.log(f"Testing with category: {test_category}")
            
            # Test category filter
            filter_response = self.session.get(f"{BASE_URL}/channels?category={test_category}")
            assert filter_response.status_code == 200, f"Category filter failed: {filter_response.status_code}"
            
            filter_data = filter_response.json()
            filtered_channels = filter_data["items"]
            
            self.log(f"✅ Category '{test_category}' filter returned {len(filtered_channels)} channels")
            
            # Validate all returned channels have the correct category
            for channel in filtered_channels:
                assert channel.get("category") == test_category, f"Wrong category: expected '{test_category}', got '{channel.get('category')}'"
            
            self.log(f"✅ All filtered channels have correct category: {test_category}")
            
            # Test with a specific Russian category if available
            if "Новости" in categories:
                news_response = self.session.get(f"{BASE_URL}/channels?category=Новости")
                assert news_response.status_code == 200, "News category filter failed"
                
                news_data = news_response.json()
                news_channels = news_data["items"]
                
                self.log(f"✅ 'Новости' category returned {len(news_channels)} channels")
                
                for channel in news_channels:
                    assert channel.get("category") == "Новости", f"Wrong news category: {channel.get('category')}"
            
            return True
            
        except Exception as e:
            self.log(f"❌ Category filtering test - FAILED: {e}")
            return False
    
    def test_search_functionality(self):
        """Test search functionality - search for 'Новости' and verify results"""
        self.log("Testing search functionality...")
        
        try:
            # Test search for "Новости"
            search_response = self.session.get(f"{BASE_URL}/channels?q=Новости")
            assert search_response.status_code == 200, f"Search failed: {search_response.status_code}"
            
            search_data = search_response.json()
            search_results = search_data["items"]
            
            self.log(f"✅ Search for 'Новости' returned {len(search_results)} results")
            
            # Validate search results contain the search term
            for channel in search_results:
                name_match = "новости" in channel["name"].lower()
                desc_match = (channel.get("short_description") and 
                            "новости" in channel["short_description"].lower())
                seo_match = (channel.get("seo_description") and 
                           "новости" in channel["seo_description"].lower())
                
                assert name_match or desc_match or seo_match, f"Search result doesn't contain 'новости': {channel['name']}"
            
            if search_results:
                sample_result = search_results[0]
                self.log(f"✅ Sample search result: '{sample_result['name']}' - {sample_result.get('short_description', 'No description')}")
            
            # Test search with English term
            tech_response = self.session.get(f"{BASE_URL}/channels?q=tech")
            assert tech_response.status_code == 200, "English search failed"
            
            tech_data = tech_response.json()
            tech_results = tech_data["items"]
            
            self.log(f"✅ Search for 'tech' returned {len(tech_results)} results")
            
            # Test empty search (should return all channels)
            empty_response = self.session.get(f"{BASE_URL}/channels?q=")
            assert empty_response.status_code == 200, "Empty search failed"
            
            empty_data = empty_response.json()
            self.log(f"✅ Empty search returned {len(empty_data['items'])} results")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Search functionality test - FAILED: {e}")
            return False
    
    def test_pagination(self):
        """Test pagination if there are multiple pages"""
        self.log("Testing pagination...")
        
        try:
            # Get first page with small limit
            page1_response = self.session.get(f"{BASE_URL}/channels?limit=5&page=1")
            assert page1_response.status_code == 200, "First page failed"
            
            page1_data = page1_response.json()
            
            # Validate pagination structure
            assert page1_data["page"] == 1, "Page number incorrect"
            assert page1_data["limit"] == 5, "Limit incorrect"
            assert len(page1_data["items"]) <= 5, "Page size exceeded"
            
            total_items = page1_data["total"]
            has_more = page1_data["has_more"]
            
            self.log(f"✅ Page 1: {len(page1_data['items'])} items, total: {total_items}, has_more: {has_more}")
            
            if has_more and total_items > 5:
                # Test second page
                page2_response = self.session.get(f"{BASE_URL}/channels?limit=5&page=2")
                assert page2_response.status_code == 200, "Second page failed"
                
                page2_data = page2_response.json()
                assert page2_data["page"] == 2, "Second page number incorrect"
                
                # Ensure different results
                page1_ids = {item["id"] for item in page1_data["items"]}
                page2_ids = {item["id"] for item in page2_data["items"]}
                assert page1_ids.isdisjoint(page2_ids), "Pagination returned duplicate items"
                
                self.log(f"✅ Page 2: {len(page2_data['items'])} items - no duplicates")
                
                # Test last page calculation
                expected_pages = (total_items + 4) // 5  # Ceiling division
                last_page_response = self.session.get(f"{BASE_URL}/channels?limit=5&page={expected_pages}")
                assert last_page_response.status_code == 200, "Last page failed"
                
                last_page_data = last_page_response.json()
                assert not last_page_data["has_more"], "Last page should not have more items"
                
                self.log(f"✅ Last page ({expected_pages}): {len(last_page_data['items'])} items, has_more: {last_page_data['has_more']}")
            else:
                self.log("ℹ️  Not enough items for multi-page testing")
            
            # Test invalid page (should return empty or error)
            invalid_page_response = self.session.get(f"{BASE_URL}/channels?limit=5&page=9999")
            assert invalid_page_response.status_code == 200, "Invalid page should return 200"
            
            invalid_data = invalid_page_response.json()
            assert len(invalid_data["items"]) == 0, "Invalid page should return empty items"
            
            self.log("✅ Invalid page returns empty results correctly")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Pagination test - FAILED: {e}")
            return False
    
    def test_sorting_functionality(self):
        """Test sorting by different criteria (popular, new, name, price, ER)"""
        self.log("Testing sorting functionality...")
        
        try:
            sort_options = ["popular", "new", "name", "price", "er"]
            
            for sort_option in sort_options:
                response = self.session.get(f"{BASE_URL}/channels?sort={sort_option}&limit=10")
                assert response.status_code == 200, f"Sort by {sort_option} failed: {response.status_code}"
                
                data = response.json()
                channels = data["items"]
                
                if len(channels) > 1:
                    # Validate sorting
                    if sort_option == "popular":
                        # Should be sorted by subscribers descending
                        for i in range(len(channels) - 1):
                            current_subs = channels[i]["subscribers"]
                            next_subs = channels[i + 1]["subscribers"]
                            assert current_subs >= next_subs, f"Popular sort failed: {current_subs} < {next_subs}"
                        
                        self.log(f"✅ Sort by 'popular' - subscribers: {channels[0]['subscribers']:,} → {channels[-1]['subscribers']:,}")
                    
                    elif sort_option == "name":
                        # Should be sorted alphabetically
                        for i in range(len(channels) - 1):
                            current_name = channels[i]["name"].lower()
                            next_name = channels[i + 1]["name"].lower()
                            assert current_name <= next_name, f"Name sort failed: '{current_name}' > '{next_name}'"
                        
                        self.log(f"✅ Sort by 'name' - '{channels[0]['name']}' → '{channels[-1]['name']}'")
                    
                    elif sort_option == "new":
                        # Should be sorted by created_at descending
                        for i in range(len(channels) - 1):
                            current_date = channels[i]["created_at"]
                            next_date = channels[i + 1]["created_at"]
                            assert current_date >= next_date, f"New sort failed: {current_date} < {next_date}"
                        
                        self.log(f"✅ Sort by 'new' - {channels[0]['created_at']} → {channels[-1]['created_at']}")
                    
                    elif sort_option == "price":
                        # Should be sorted by price_rub descending (channels with prices first)
                        priced_channels = [ch for ch in channels if ch.get("price_rub")]
                        if len(priced_channels) > 1:
                            for i in range(len(priced_channels) - 1):
                                current_price = priced_channels[i]["price_rub"]
                                next_price = priced_channels[i + 1]["price_rub"]
                                assert current_price >= next_price, f"Price sort failed: {current_price} < {next_price}"
                            
                            self.log(f"✅ Sort by 'price' - ₽{priced_channels[0]['price_rub']:,} → ₽{priced_channels[-1]['price_rub']:,}")
                        else:
                            self.log("ℹ️  Sort by 'price' - not enough priced channels to validate sorting")
                    
                    elif sort_option == "er":
                        # Should be sorted by ER descending (channels with ER first)
                        er_channels = [ch for ch in channels if ch.get("er")]
                        if len(er_channels) > 1:
                            for i in range(len(er_channels) - 1):
                                current_er = er_channels[i]["er"]
                                next_er = er_channels[i + 1]["er"]
                                assert current_er >= next_er, f"ER sort failed: {current_er} < {next_er}"
                            
                            self.log(f"✅ Sort by 'er' - {er_channels[0]['er']}% → {er_channels[-1]['er']}%")
                        else:
                            self.log("ℹ️  Sort by 'er' - not enough channels with ER to validate sorting")
                
                else:
                    self.log(f"ℹ️  Sort by '{sort_option}' - not enough channels to validate sorting")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Sorting functionality test - FAILED: {e}")
            return False
    
    def test_channel_data_display(self):
        """Verify that channel data shows correctly: subscribers, ER, CPM, prices"""
        self.log("Testing channel data display...")
        
        try:
            response = self.session.get(f"{BASE_URL}/channels?limit=20")
            assert response.status_code == 200, "Channels fetch failed"
            
            data = response.json()
            channels = data["items"]
            
            if not channels:
                self.log("ℹ️  No channels available for data display test")
                return True
            
            # Analyze data completeness
            total_channels = len(channels)
            channels_with_er = sum(1 for ch in channels if ch.get("er"))
            channels_with_price = sum(1 for ch in channels if ch.get("price_rub"))
            channels_with_cpm = sum(1 for ch in channels if ch.get("cpm_rub"))
            channels_with_growth = sum(1 for ch in channels if ch.get("growth_30d"))
            channels_with_last_post = sum(1 for ch in channels if ch.get("last_post_at"))
            
            self.log(f"✅ Data completeness analysis:")
            self.log(f"   - Total channels: {total_channels}")
            self.log(f"   - With ER: {channels_with_er} ({channels_with_er/total_channels*100:.1f}%)")
            self.log(f"   - With price: {channels_with_price} ({channels_with_price/total_channels*100:.1f}%)")
            self.log(f"   - With CPM: {channels_with_cpm} ({channels_with_cpm/total_channels*100:.1f}%)")
            self.log(f"   - With growth: {channels_with_growth} ({channels_with_growth/total_channels*100:.1f}%)")
            self.log(f"   - With last post: {channels_with_last_post} ({channels_with_last_post/total_channels*100:.1f}%)")
            
            # Find channels with complete metrics for detailed validation
            complete_channels = [
                ch for ch in channels 
                if ch.get("er") and ch.get("price_rub") and ch.get("cpm_rub")
            ]
            
            if complete_channels:
                sample_channel = complete_channels[0]
                
                # Validate metric formats
                assert isinstance(sample_channel["subscribers"], int), "Subscribers should be integer"
                assert isinstance(sample_channel["er"], (int, float)), "ER should be numeric"
                assert isinstance(sample_channel["price_rub"], int), "Price should be integer"
                assert isinstance(sample_channel["cpm_rub"], (int, float)), "CPM should be numeric"
                
                # Validate reasonable ranges
                assert sample_channel["subscribers"] >= 0, "Subscribers should be non-negative"
                assert 0 <= sample_channel["er"] <= 100, f"ER should be 0-100%: {sample_channel['er']}"
                assert sample_channel["price_rub"] > 0, "Price should be positive"
                assert sample_channel["cpm_rub"] > 0, "CPM should be positive"
                
                self.log(f"✅ Sample complete channel: '{sample_channel['name']}'")
                self.log(f"   - Subscribers: {sample_channel['subscribers']:,}")
                self.log(f"   - ER: {sample_channel['er']}%")
                self.log(f"   - Price: ₽{sample_channel['price_rub']:,}")
                self.log(f"   - CPM: ₽{sample_channel['cpm_rub']}")
                
                if sample_channel.get("growth_30d"):
                    self.log(f"   - Growth 30d: {sample_channel['growth_30d']}%")
                
                if sample_channel.get("last_post_at"):
                    self.log(f"   - Last post: {sample_channel['last_post_at']}")
            
            # Validate all channels have basic required data
            for channel in channels:
                assert "id" in channel, "Channel missing ID"
                assert "name" in channel, "Channel missing name"
                assert "link" in channel, "Channel missing link"
                assert "subscribers" in channel, "Channel missing subscribers"
                assert "created_at" in channel, "Channel missing created_at"
                assert "updated_at" in channel, "Channel missing updated_at"
                
                # Validate optional fields if present
                if channel.get("avatar_url"):
                    assert channel["avatar_url"].startswith(("http", "https")), "Invalid avatar URL"
                
                if channel.get("category"):
                    assert isinstance(channel["category"], str), "Category should be string"
                
                if channel.get("language"):
                    assert isinstance(channel["language"], str), "Language should be string"
            
            self.log("✅ All channels have valid data structure and required fields")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Channel data display test - FAILED: {e}")
            return False
    
    def test_trending_channels_endpoint(self):
        """Test the trending channels endpoint /api/channels/trending"""
        self.log("Testing trending channels endpoint...")
        
        try:
            response = self.session.get(f"{BASE_URL}/channels/trending")
            assert response.status_code == 200, f"Trending endpoint failed: {response.status_code}"
            
            trending = response.json()
            assert isinstance(trending, list), "Trending should return a list"
            
            self.log(f"✅ GET /api/channels/trending - Returned {len(trending)} trending channels")
            
            if trending:
                # Validate trending channels structure
                for channel in trending:
                    assert "id" in channel, "Trending channel missing ID"
                    assert "name" in channel, "Trending channel missing name"
                    assert "subscribers" in channel, "Trending channel missing subscribers"
                    assert channel.get("status") == "approved", "Trending channel should be approved"
                
                # Check if featured channels are prioritized
                featured_count = sum(1 for ch in trending if ch.get("is_featured"))
                self.log(f"✅ Featured channels in trending: {featured_count}")
                
                # Validate sorting (featured first, then by growth_score/subscribers)
                if len(trending) > 1:
                    # Check if featured channels come first
                    featured_channels = [ch for ch in trending if ch.get("is_featured")]
                    non_featured_channels = [ch for ch in trending if not ch.get("is_featured")]
                    
                    if featured_channels and non_featured_channels:
                        # Featured should come before non-featured
                        first_non_featured_index = next(
                            (i for i, ch in enumerate(trending) if not ch.get("is_featured")), 
                            len(trending)
                        )
                        last_featured_index = next(
                            (len(trending) - 1 - i for i, ch in enumerate(reversed(trending)) if ch.get("is_featured")), 
                            -1
                        )
                        
                        if last_featured_index >= 0 and first_non_featured_index < len(trending):
                            assert last_featured_index < first_non_featured_index, "Featured channels should come first"
                            self.log("✅ Featured channels properly prioritized in trending")
                
                # Log sample trending channels
                for i, channel in enumerate(trending[:3]):
                    featured_badge = " [FEATURED]" if channel.get("is_featured") else ""
                    growth_info = f" (Growth: {channel.get('growth_30d', 'N/A')}%)" if channel.get("growth_30d") else ""
                    self.log(f"   {i+1}. {channel['name']}{featured_badge} - {channel['subscribers']:,} subs{growth_info}")
            
            # Test with custom limit
            limit_response = self.session.get(f"{BASE_URL}/channels/trending?limit=3")
            assert limit_response.status_code == 200, "Trending with limit failed"
            
            limited_trending = limit_response.json()
            assert len(limited_trending) <= 3, f"Trending limit not respected: got {len(limited_trending)}"
            
            self.log(f"✅ GET /api/channels/trending?limit=3 - Limit respected")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Trending channels endpoint test - FAILED: {e}")
            return False
    
    def run_all_tests(self):
        """Run all catalog functionality tests"""
        self.log("=" * 60)
        self.log("STARTING CATALOG FUNCTIONALITY TESTING")
        self.log("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            self.log("❌ Authentication failed - some tests may not work")
        
        test_results = {}
        
        # Run all tests
        tests = [
            ("Database Counts", self.test_database_counts),
            ("Channels Endpoint Real Data", self.test_channels_endpoint_real_data),
            ("Category Filtering", self.test_category_filtering),
            ("Search Functionality", self.test_search_functionality),
            ("Pagination", self.test_pagination),
            ("Sorting Functionality", self.test_sorting_functionality),
            ("Channel Data Display", self.test_channel_data_display),
            ("Trending Channels Endpoint", self.test_trending_channels_endpoint),
        ]
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                result = test_func()
                test_results[test_name] = result
            except Exception as e:
                self.log(f"❌ {test_name} - EXCEPTION: {e}")
                test_results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("CATALOG TESTING SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL CATALOG TESTS PASSED!")
        else:
            self.log("⚠️  Some catalog tests failed - check logs above")
        
        return test_results

if __name__ == "__main__":
    tester = CatalogTester()
    results = tester.run_all_tests()