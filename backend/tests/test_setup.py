import pytest
from fastapi.testclient import TestClient


class TestSetup:
    """Test that the basic test setup is working"""
    
    def test_client_creation(self, client: TestClient):
        """Test that the test client is created successfully"""
        assert client is not None
    
    def test_database_connection(self, db_session):
        """Test that the test database connection works"""
        assert db_session is not None
    
    def test_fixtures_work(self, test_user_data, test_host_data, test_listing_data):
        """Test that the test fixtures are working"""
        assert test_user_data["email"] == "test@example.com"
        assert test_host_data["is_host"] is True
        assert test_listing_data["title"] == "Beautiful Test Apartment"
    
    def test_mock_s3_service(self, mock_s3_service):
        """Test that the mock S3 service is working"""
        assert mock_s3_service is not None
        # Test the mock service has the expected methods
        assert hasattr(mock_s3_service, 'upload_image')
        assert hasattr(mock_s3_service, 'delete_image') 