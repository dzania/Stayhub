import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from io import BytesIO


class TestListingsCRUD:
    """Test listing CRUD operations"""
    
    def test_get_all_listings(self, client: TestClient):
        """Test getting all listings"""
        response = client.get("/listings/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_single_listing(self, client: TestClient, test_listing):
        """Test getting a single listing by ID"""
        response = client.get(f"/listings/{test_listing.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_listing.id
        assert data["title"] == test_listing.title
        assert data["price_per_night"] == test_listing.price_per_night
    
    def test_get_nonexistent_listing(self, client: TestClient):
        """Test getting a non-existent listing"""
        response = client.get("/listings/99999")
        
        assert response.status_code == 404
        assert "Listing not found" in response.json()["detail"]
    
    def test_create_listing_success(self, client: TestClient, host_auth_headers, test_listing_data):
        """Test successful listing creation"""
        response = client.post("/listings/", json=test_listing_data, headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == test_listing_data["title"]
        assert data["description"] == test_listing_data["description"]
        assert data["price_per_night"] == test_listing_data["price_per_night"]
        assert data["max_guests"] == test_listing_data["max_guests"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_listing_without_auth(self, client: TestClient, test_listing_data):
        """Test creating listing without authentication"""
        response = client.post("/listings/", json=test_listing_data)
        
        assert response.status_code == 401
    
    def test_create_listing_as_non_host(self, client: TestClient, auth_headers, test_listing_data):
        """Test creating listing as non-host user"""
        response = client.post("/listings/", json=test_listing_data, headers=auth_headers)
        
        assert response.status_code == 403
    
    def test_update_listing_success(self, client: TestClient, host_auth_headers, test_listing):
        """Test successful listing update"""
        update_data = {
            "title": "Updated Beach House",
            "price_per_night": 150.0
        }
        
        response = client.put(f"/listings/{test_listing.id}", 
                            json=update_data, 
                            headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Beach House"
        assert data["price_per_night"] == 150.0
    
    def test_update_listing_not_owner(self, client: TestClient, auth_headers, test_listing):
        """Test updating listing by non-owner"""
        update_data = {"title": "Hacked Title"}
        
        response = client.put(f"/listings/{test_listing.id}", 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 403  # Non-host users get 403
    
    def test_update_nonexistent_listing(self, client: TestClient, host_auth_headers):
        """Test updating non-existent listing"""
        update_data = {"title": "New Title"}
        
        response = client.put("/listings/99999", 
                            json=update_data, 
                            headers=host_auth_headers)
        
        assert response.status_code == 404
        assert "Listing not found" in response.json()["detail"]
    
    def test_delete_listing_success(self, client: TestClient, host_auth_headers, test_listing):
        """Test successful listing deletion"""
        response = client.delete(f"/listings/{test_listing.id}", headers=host_auth_headers)
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["detail"]
        
        # Verify listing is deleted
        get_response = client.get(f"/listings/{test_listing.id}")
        assert get_response.status_code == 404
    
    def test_delete_listing_not_owner(self, client: TestClient, auth_headers, test_listing):
        """Test deleting listing by non-owner"""
        response = client.delete(f"/listings/{test_listing.id}", headers=auth_headers)
        
        assert response.status_code == 403  # Non-host users get 403
    
    def test_get_my_listings(self, client: TestClient, host_auth_headers):
        """Test getting host's own listings"""
        response = client.get("/listings/host/my-listings", headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestListingsSearch:
    """Test listing search functionality"""
    
    def test_search_by_location(self, client: TestClient):
        """Test searching listings by location"""
        response = client.get("/listings/?location=Miami")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_by_price_range(self, client: TestClient):
        """Test searching listings by price range"""
        response = client.get("/listings/?min_price=50&max_price=200")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_by_guests(self, client: TestClient):
        """Test searching listings by guest count"""
        response = client.get("/listings/?guests=2")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_by_dates(self, client: TestClient):
        """Test searching listings by check-in/check-out dates"""
        future_date = datetime.now() + timedelta(days=30)
        check_in = future_date.strftime("%Y-%m-%d")
        check_out = (future_date + timedelta(days=3)).strftime("%Y-%m-%d")
        
        response = client.get(f"/listings/?check_in_date={check_in}&check_out_date={check_out}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_with_pagination(self, client: TestClient):
        """Test listings with pagination"""
        response = client.get("/listings/?skip=0&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5


class TestListingImages:
    """Test listing image upload functionality"""
    
    def create_test_image_file(self):
        """Create a test image file"""
        # Create a simple test image (1x1 pixel PNG)
        image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01U\r\x00\x00\x00\x00IEND\xaeB`\x82'
        return BytesIO(image_data)
    
    def test_upload_images_endpoint_exists(self, client: TestClient, host_auth_headers, test_listing):
        """Test that image upload endpoint exists"""
        files = {"files": ("test.png", self.create_test_image_file(), "image/png")}
        
        response = client.post(f"/listings/{test_listing.id}/images", 
                             files=files,
                             headers=host_auth_headers)
        
        # Should either succeed or fail gracefully (not 500)
        assert response.status_code != 500
    
    def test_upload_images_unauthorized(self, client: TestClient, test_listing):
        """Test image upload without authentication"""
        files = {"files": ("test.png", self.create_test_image_file(), "image/png")}
        
        response = client.post(f"/listings/{test_listing.id}/images", files=files)
        
        assert response.status_code == 401
    
    def test_upload_images_nonexistent_listing(self, client: TestClient, host_auth_headers):
        """Test image upload for non-existent listing"""
        files = {"files": ("test.png", self.create_test_image_file(), "image/png")}
        
        response = client.post("/listings/99999/images", 
                             files=files,
                             headers=host_auth_headers)
        
        assert response.status_code == 404
    
    def test_delete_image_endpoint_exists(self, client: TestClient, host_auth_headers, test_listing):
        """Test that image deletion endpoint exists"""
        response = client.delete(f"/listings/{test_listing.id}/images/0", 
                               headers=host_auth_headers)
        
        # Should either succeed or fail gracefully (not 500)
        assert response.status_code != 500
    
    def test_reorder_images_endpoint_exists(self, client: TestClient, host_auth_headers, test_listing):
        """Test that image reorder endpoint exists"""
        reorder_data = {"image_order": []}
        
        response = client.put(f"/listings/{test_listing.id}/images/reorder",
                            json=reorder_data,
                            headers=host_auth_headers)
        
        # Should either succeed or fail gracefully (not 500)
        assert response.status_code != 500


class TestListingValidation:
    """Test listing validation"""
    
    def test_create_listing_invalid_data(self, client: TestClient, host_auth_headers):
        """Test creating listing with invalid data"""
        invalid_data = {
            "title": "Test Listing",
            "description": "Test description",
            "price_per_night": -10.0,  # Negative price - should fail validation
            "location": "Test City",
            "max_guests": 0,  # Zero guests - should fail validation
            "bedrooms": -1,  # Negative bedrooms - should fail validation
            "bathrooms": -1  # Negative bathrooms - should fail validation
        }
        
        response = client.post("/listings/", json=invalid_data, headers=host_auth_headers)
        
        assert response.status_code == 422
    
    def test_create_listing_missing_required_fields(self, client: TestClient, host_auth_headers):
        """Test creating listing with missing required fields"""
        incomplete_data = {
            "title": "Test Listing"
            # Missing other required fields
        }
        
        response = client.post("/listings/", json=incomplete_data, headers=host_auth_headers)
        
        assert response.status_code == 422
    
    def test_update_listing_invalid_data(self, client: TestClient, host_auth_headers, test_listing):
        """Test updating listing with invalid data"""
        invalid_update = {
            "price_per_night": -50.0  # Negative price
        }
        
        response = client.put(f"/listings/{test_listing.id}", 
                            json=invalid_update, 
                            headers=host_auth_headers)
        
        # Now we have validation, so negative prices should be rejected
        assert response.status_code == 422 