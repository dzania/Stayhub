import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


class TestBookingsCRUD:
    """Test booking CRUD operations"""
    
    def test_create_booking_success(self, client: TestClient, auth_headers, test_listing, test_booking_data):
        """Test successful booking creation"""
        response = client.post("/bookings/", json=test_booking_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["listing_id"] == test_booking_data["listing_id"]
        assert data["guest_count"] == test_booking_data["guest_count"]
        assert data["status"] == "pending"
        assert "total_price" in data
        assert "id" in data
        assert "created_at" in data
    
    def test_create_booking_unauthorized(self, client: TestClient, test_booking_data):
        """Test booking creation without authentication"""
        response = client.post("/bookings/", json=test_booking_data)
        
        assert response.status_code == 401
    
    def test_create_booking_nonexistent_listing(self, client: TestClient, auth_headers):
        """Test booking creation for non-existent listing"""
        future_date = datetime.now() + timedelta(days=7)
        booking_data = {
            "listing_id": 99999,
            "check_in_date": future_date.isoformat(),
            "check_out_date": (future_date + timedelta(days=3)).isoformat(),
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 404
        assert "Listing not found" in response.json()["detail"]
    
    def test_create_booking_host_own_listing(self, client: TestClient, host_auth_headers, test_listing):
        """Test host trying to book their own listing"""
        future_date = datetime.now() + timedelta(days=7)
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": future_date.isoformat(),
            "check_out_date": (future_date + timedelta(days=3)).isoformat(),
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=booking_data, headers=host_auth_headers)
        
        assert response.status_code == 400
        assert "Cannot book your own listing" in response.json()["detail"]
    
    def test_create_booking_exceeds_capacity(self, client: TestClient, auth_headers, test_listing):
        """Test booking with more guests than listing capacity"""
        future_date = datetime.now() + timedelta(days=7)
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": future_date.isoformat(),
            "check_out_date": (future_date + timedelta(days=3)).isoformat(),
            "guest_count": test_listing.max_guests + 1  # Exceed capacity
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Guest count exceeds maximum capacity" in response.json()["detail"]
    
    def test_create_booking_invalid_dates(self, client: TestClient, auth_headers, test_listing):
        """Test booking with check-out before check-in"""
        future_date = datetime.now() + timedelta(days=7)
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": future_date.isoformat(),
            "check_out_date": (future_date - timedelta(days=1)).isoformat(),  # Before check-in
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Check-out date must be after check-in date" in response.json()["detail"]
    
    def test_create_booking_past_dates(self, client: TestClient, auth_headers, test_listing):
        """Test booking with dates in the past"""
        past_date = datetime.now() - timedelta(days=1)
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": past_date.isoformat(),
            "check_out_date": (past_date + timedelta(days=2)).isoformat(),
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Check-in date cannot be in the past" in response.json()["detail"]
    
    def test_get_user_bookings(self, client: TestClient, auth_headers):
        """Test getting user's bookings"""
        response = client.get("/bookings/my-bookings", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_host_bookings(self, client: TestClient, host_auth_headers):
        """Test getting host's incoming bookings"""
        response = client.get("/bookings/host/incoming", headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestBookingStatus:
    """Test booking status management"""
    
    @pytest.fixture
    def test_booking(self, db_session, test_user, test_listing):
        """Create a test booking"""
        from app import models
        
        future_date = datetime.now() + timedelta(days=7)
        booking = models.Booking(
            listing_id=test_listing.id,
            customer_id=test_user.id,
            check_in_date=future_date,
            check_out_date=future_date + timedelta(days=3),
            guest_count=2,
            total_price=360.0,
            status="pending"
        )
        db_session.add(booking)
        db_session.commit()
        db_session.refresh(booking)
        return booking
    
    def test_update_booking_status_by_host(self, client: TestClient, host_auth_headers, test_booking):
        """Test host updating booking status"""
        update_data = {"status": "confirmed"}
        
        response = client.put(f"/bookings/{test_booking.id}/status",
                            json=update_data,
                            headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
    
    def test_update_booking_status_unauthorized(self, client: TestClient, test_booking):
        """Test updating booking status without authentication"""
        update_data = {"status": "confirmed"}
        
        response = client.put(f"/bookings/{test_booking.id}/status", json=update_data)
        
        assert response.status_code == 401
    
    def test_update_booking_status_not_host(self, client: TestClient, db_session, test_booking):
        """Test non-host user trying to update booking status (should be different from the host)"""
        # Create a different user who is not the customer or host
        from app import models
        from app.auth import get_password_hash, create_access_token
        
        different_user = models.User(
            email="different@example.com",
            username="differentuser",
            hashed_password=get_password_hash("password123"),
            first_name="Different",
            last_name="User",
            is_host=False
        )
        db_session.add(different_user)
        db_session.commit()
        db_session.refresh(different_user)
        
        # Create auth headers for this different user
        token = create_access_token(data={"sub": different_user.email})
        different_user_headers = {"Authorization": f"Bearer {token}"}
        
        update_data = {"status": "confirmed"}
        
        response = client.put(f"/bookings/{test_booking.id}/status",
                            json=update_data,
                            headers=different_user_headers)
        
        assert response.status_code == 403
        assert "Not authorized to update this booking" in response.json()["detail"]
    
    def test_customer_can_only_cancel(self, client: TestClient, auth_headers, test_booking):
        """Test that customers can only cancel bookings, not change status to other values"""
        update_data = {"status": "confirmed"}  # Customer trying to confirm
        
        response = client.put(f"/bookings/{test_booking.id}/status",
                            json=update_data,
                            headers=auth_headers)
        
        assert response.status_code == 403
        assert "Customers can only cancel bookings" in response.json()["detail"]
    
    def test_customer_cancel_booking(self, client: TestClient, auth_headers, test_booking):
        """Test customer canceling their own booking"""
        response = client.delete(f"/bookings/{test_booking.id}", headers=auth_headers)
        
        assert response.status_code == 200
        assert "cancelled successfully" in response.json()["detail"]
    
    def test_cancel_booking_unauthorized(self, client: TestClient, test_booking):
        """Test canceling booking without authentication"""
        response = client.delete(f"/bookings/{test_booking.id}")
        
        assert response.status_code == 401
    
    def test_cancel_booking_not_customer(self, client: TestClient, host_auth_headers, test_booking):
        """Test non-customer trying to cancel booking"""
        response = client.delete(f"/bookings/{test_booking.id}", headers=host_auth_headers)
        
        assert response.status_code == 403
        assert "Not authorized to cancel this booking" in response.json()["detail"]


class TestBookingValidation:
    """Test booking validation and business rules"""
    
    def test_booking_price_calculation(self, client: TestClient, auth_headers, test_listing, test_booking_data):
        """Test that booking price is calculated correctly"""
        response = client.post("/bookings/", json=test_booking_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Calculate expected price (3 nights * price_per_night)
        check_in = datetime.fromisoformat(test_booking_data["check_in_date"])
        check_out = datetime.fromisoformat(test_booking_data["check_out_date"])
        nights = (check_out.date() - check_in.date()).days
        expected_price = nights * test_listing.price_per_night
        
        assert data["total_price"] == expected_price
    
    def test_booking_with_invalid_dates(self, client: TestClient, auth_headers, test_listing):
        """Test booking with invalid date data"""
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": "invalid-date",
            "check_out_date": "also-invalid",
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 422
    
    def test_booking_with_invalid_guest_count(self, client: TestClient, auth_headers, test_listing):
        """Test booking with invalid guest count"""
        future_date = datetime.now() + timedelta(days=7)
        booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": future_date.isoformat(),
            "check_out_date": (future_date + timedelta(days=3)).isoformat(),
            "guest_count": 0  # Invalid guest count
        }
        
        response = client.post("/bookings/", json=booking_data, headers=auth_headers)
        
        assert response.status_code == 422
    
    def test_get_nonexistent_booking(self, client: TestClient, auth_headers):
        """Test getting a non-existent booking"""
        response = client.get("/bookings/99999", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Booking not found" in response.json()["detail"]
    
    def test_update_nonexistent_booking_status(self, client: TestClient, host_auth_headers):
        """Test updating status of non-existent booking"""
        update_data = {"status": "confirmed"}
        
        response = client.put("/bookings/99999/status",
                            json=update_data,
                            headers=host_auth_headers)
        
        assert response.status_code == 404
        assert "Booking not found" in response.json()["detail"]
    
    def test_booking_availability_check(self, client: TestClient, auth_headers, db_session, test_listing, test_user):
        """Test that availability checking works for conflicting dates"""
        from app import models
        
        # Create an existing confirmed booking
        future_date = datetime.now() + timedelta(days=30)
        existing_booking = models.Booking(
            listing_id=test_listing.id,
            customer_id=test_user.id,
            check_in_date=future_date,
            check_out_date=future_date + timedelta(days=3),
            guest_count=2,
            total_price=360.0,
            status="confirmed"
        )
        db_session.add(existing_booking)
        db_session.commit()
        
        # Try to create a conflicting booking
        conflicting_booking_data = {
            "listing_id": test_listing.id,
            "check_in_date": (future_date + timedelta(days=1)).isoformat(),  # Overlaps
            "check_out_date": (future_date + timedelta(days=4)).isoformat(),
            "guest_count": 2
        }
        
        response = client.post("/bookings/", json=conflicting_booking_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "not available for selected dates" in response.json()["detail"] 