import pytest
from fastapi.testclient import TestClient


class TestAuthRegistration:
    """Test user registration functionality"""
    
    def test_register_new_user_success(self, client: TestClient, test_user_data):
        """Test successful user registration"""
        response = client.post("/auth/register", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert data["first_name"] == test_user_data["first_name"]
        assert data["is_host"] == test_user_data["is_host"]
        assert "hashed_password" not in data  # Password should not be returned
    
    def test_register_duplicate_email(self, client: TestClient, test_user_data, test_user):
        """Test registration with existing email"""
        response = client.post("/auth/register", json=test_user_data)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    def test_register_duplicate_username(self, client: TestClient, test_user_data, test_user):
        """Test registration with existing username"""
        user_data = test_user_data.copy()
        user_data["email"] = "different@example.com"  # Different email, same username
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]
    
    def test_register_invalid_email(self, client: TestClient, test_user_data):
        """Test registration with invalid email"""
        user_data = test_user_data.copy()
        user_data["email"] = "invalid-email"
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_register_missing_required_fields(self, client: TestClient):
        """Test registration with missing required fields"""
        incomplete_data = {
            "email": "test@example.com",
            "username": "testuser"
            # Missing password, first_name, last_name
        }
        
        response = client.post("/auth/register", json=incomplete_data)
        
        assert response.status_code == 422


class TestAuthLogin:
    """Test user login functionality"""
    
    def test_login_success(self, client: TestClient, test_user_data, test_user):
        """Test successful login"""
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client: TestClient, test_user_data, test_user):
        """Test login with wrong password"""
        login_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "somepassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_invalid_email_format(self, client: TestClient):
        """Test login with invalid email format"""
        login_data = {
            "email": "invalid-email",
            "password": "somepassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 422


class TestAuthMe:
    """Test current user endpoint functionality"""
    
    def test_get_current_user_success(self, client: TestClient, auth_headers, test_user):
        """Test getting current user with valid token"""
        response = client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
    
    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token"""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_update_user_profile_success(self, client: TestClient, auth_headers, test_user):
        """Test updating user profile"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "+9876543210"
        }
        
        response = client.put("/auth/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["phone"] == "+9876543210"
    
    def test_update_user_profile_unauthorized(self, client: TestClient):
        """Test updating user profile without authentication"""
        update_data = {"first_name": "Updated"}
        
        response = client.put("/auth/me", json=update_data)
        
        assert response.status_code == 401


class TestAuthHost:
    """Test host-specific functionality"""
    
    def test_host_can_access_protected_endpoints(self, client: TestClient, host_auth_headers, test_host):
        """Test that hosts can access host-protected endpoints"""
        # This would test accessing host-only endpoints like creating listings
        # We'll test this more in the listings tests
        response = client.get("/auth/me", headers=host_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_host"] is True
    
    def test_regular_user_host_status(self, client: TestClient, auth_headers, test_user):
        """Test that regular users have correct host status"""
        response = client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_host"] is False 