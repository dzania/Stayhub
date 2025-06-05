import pytest
from fastapi.testclient import TestClient


class TestReviewsAPI:
    """Test review functionality that matches our actual API"""
    
    def test_get_listing_reviews_with_nonexistent_listing(self, client: TestClient):
        """Test getting reviews for non-existent listing"""
        response = client.get("/reviews/listing/99999")
        
        assert response.status_code == 404
        assert "Listing not found" in response.json()["detail"]
    
    def test_get_listing_reviews_with_existing_listing(self, client: TestClient, test_listing):
        """Test getting reviews for existing listing (should return empty list)"""
        response = client.get(f"/reviews/listing/{test_listing.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0  # New listing has no reviews
    
    def test_create_review_without_authentication(self, client: TestClient, test_listing):
        """Test creating review without authentication"""
        review_data = {
            "listing_id": test_listing.id,
            "rating": 5,
            "comment": "Great place!"
        }
        
        response = client.post("/reviews/", json=review_data)
        
        assert response.status_code == 401
    
    def test_create_review_without_completed_booking(self, client: TestClient, auth_headers, test_listing):
        """Test creating review without having a completed booking"""
        review_data = {
            "listing_id": test_listing.id,
            "rating": 5,
            "comment": "Great place!"
        }
        
        response = client.post("/reviews/", json=review_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "You can only review listings you have booked and completed" in response.json()["detail"]
    
    def test_create_review_with_invalid_rating(self, client: TestClient, db_session, test_listing):
        """Test creating review with invalid rating"""
        # Create a user with a completed booking so we can test rating validation
        from app import models
        from app.auth import get_password_hash, create_access_token
        from datetime import datetime, timedelta
        
        # Create a user
        user = models.User(
            email="reviewer@example.com",
            username="reviewer",
            hashed_password=get_password_hash("password123"),
            first_name="Review",
            last_name="User",
            is_host=False
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Create a completed booking for this user
        past_date = datetime.now() - timedelta(days=10)
        booking = models.Booking(
            listing_id=test_listing.id,
            customer_id=user.id,
            check_in_date=past_date,
            check_out_date=past_date + timedelta(days=3),
            guest_count=2,
            total_price=360.0,
            status="completed"
        )
        db_session.add(booking)
        db_session.commit()
        
        # Create auth headers for this user
        token = create_access_token(data={"sub": user.email})
        user_headers = {"Authorization": f"Bearer {token}"}
        
        review_data = {
            "listing_id": test_listing.id,
            "rating": 6,  # Invalid rating > 5
            "comment": "Great place!"
        }
        
        response = client.post("/reviews/", json=review_data, headers=user_headers)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_create_review_with_zero_rating(self, client: TestClient, db_session, test_listing):
        """Test creating review with zero rating"""
        # Create a user with a completed booking
        from app import models
        from app.auth import get_password_hash, create_access_token
        from datetime import datetime, timedelta
        
        user = models.User(
            email="reviewer2@example.com",
            username="reviewer2",
            hashed_password=get_password_hash("password123"),
            first_name="Review",
            last_name="User2",
            is_host=False
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Create a completed booking
        past_date = datetime.now() - timedelta(days=10)
        booking = models.Booking(
            listing_id=test_listing.id,
            customer_id=user.id,
            check_in_date=past_date,
            check_out_date=past_date + timedelta(days=3),
            guest_count=2,
            total_price=360.0,
            status="completed"
        )
        db_session.add(booking)
        db_session.commit()
        
        # Create auth headers
        token = create_access_token(data={"sub": user.email})
        user_headers = {"Authorization": f"Bearer {token}"}
        
        review_data = {
            "listing_id": test_listing.id,
            "rating": 0,  # Invalid rating < 1
            "comment": "Zero rating test"
        }
        
        response = client.post("/reviews/", json=review_data, headers=user_headers)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_create_review_for_nonexistent_listing(self, client: TestClient, auth_headers):
        """Test creating review for non-existent listing"""
        review_data = {
            "listing_id": 99999,
            "rating": 5,
            "comment": "Great place!"
        }
        
        response = client.post("/reviews/", json=review_data, headers=auth_headers)
        
        assert response.status_code == 404
        assert "Listing not found" in response.json()["detail"]
    
    def test_get_host_reviews_for_nonexistent_host(self, client: TestClient):
        """Test getting reviews for non-existent host"""
        response = client.get("/reviews/host/99999")
        
        assert response.status_code == 404
        assert "Host not found" in response.json()["detail"]
    
    def test_get_host_reviews_for_non_host_user(self, client: TestClient, test_user):
        """Test getting reviews for user who is not a host"""
        response = client.get(f"/reviews/host/{test_user.id}")
        
        assert response.status_code == 404
        assert "Host not found" in response.json()["detail"]
    
    def test_get_host_reviews_for_actual_host(self, client: TestClient, test_host):
        """Test getting reviews for actual host"""
        response = client.get(f"/reviews/host/{test_host.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0  # New host has no reviews
    
    def test_update_nonexistent_review(self, client: TestClient, auth_headers):
        """Test updating non-existent review"""
        update_data = {
            "rating": 5,
            "comment": "Updated comment"
        }
        
        response = client.put("/reviews/99999", json=update_data, headers=auth_headers)
        
        assert response.status_code == 404
        assert "Review not found" in response.json()["detail"]
    
    def test_delete_nonexistent_review(self, client: TestClient, auth_headers):
        """Test deleting non-existent review"""
        response = client.delete("/reviews/99999", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Review not found" in response.json()["detail"]


class TestReviewsWithCompletedBooking:
    """Test reviews with actual completed booking setup"""
    
    @pytest.fixture
    def completed_booking_with_review_setup(self, db_session, test_user, test_listing):
        """Create a completed booking so we can test review creation"""
        from app import models
        from datetime import datetime, timedelta
        
        # Create a completed booking
        past_date = datetime.now() - timedelta(days=10)
        booking = models.Booking(
            listing_id=test_listing.id,
            customer_id=test_user.id,
            check_in_date=past_date,
            check_out_date=past_date + timedelta(days=3),
            guest_count=2,
            total_price=360.0,
            status="completed"
        )
        db_session.add(booking)
        db_session.commit()
        db_session.refresh(booking)
        return booking
    
    def test_create_review_with_completed_booking(self, client: TestClient, auth_headers, 
                                                test_listing, completed_booking_with_review_setup):
        """Test creating review after completing a booking"""
        review_data = {
            "listing_id": test_listing.id,
            "rating": 5,
            "comment": "Amazing place! Highly recommended."
        }
        
        response = client.post("/reviews/", json=review_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["listing_id"] == test_listing.id
        assert data["rating"] == 5
        assert data["comment"] == "Amazing place! Highly recommended."
        assert "id" in data
        assert "created_at" in data 