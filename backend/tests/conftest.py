import pytest
import asyncio
from typing import Generator, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import tempfile
import os

from app.main import app
from app.database import get_db, Base
from app import models
from app.auth import get_password_hash, create_access_token

# Test database URL - using SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def test_user_data():
    """Test user data"""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+1234567890",
        "is_host": False
    }


@pytest.fixture
def test_host_data():
    """Test host data"""
    return {
        "email": "host@example.com",
        "username": "testhost",
        "password": "hostpassword123",
        "first_name": "Test",
        "last_name": "Host",
        "phone": "+1234567891",
        "is_host": True
    }


@pytest.fixture
def test_user(db_session, test_user_data):
    """Create a test user in the database"""
    user = models.User(
        email=test_user_data["email"],
        username=test_user_data["username"],
        hashed_password=get_password_hash(test_user_data["password"]),
        first_name=test_user_data["first_name"],
        last_name=test_user_data["last_name"],
        phone=test_user_data["phone"],
        is_host=test_user_data["is_host"]
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_host(db_session, test_host_data):
    """Create a test host in the database"""
    host = models.User(
        email=test_host_data["email"],
        username=test_host_data["username"],
        hashed_password=get_password_hash(test_host_data["password"]),
        first_name=test_host_data["first_name"],
        last_name=test_host_data["last_name"],
        phone=test_host_data["phone"],
        is_host=test_host_data["is_host"]
    )
    db_session.add(host)
    db_session.commit()
    db_session.refresh(host)
    return host


@pytest.fixture
def user_token(test_user):
    """Create an access token for test user"""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def host_token(test_host):
    """Create an access token for test host"""
    return create_access_token(data={"sub": test_host.email})


@pytest.fixture
def auth_headers(user_token):
    """Create authorization headers for test user"""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def host_auth_headers(host_token):
    """Create authorization headers for test host"""
    return {"Authorization": f"Bearer {host_token}"}


@pytest.fixture
def test_listing_data():
    """Test listing data"""
    return {
        "title": "Beautiful Test Apartment",
        "description": "A lovely test apartment in the heart of the city",
        "price_per_night": 120.0,
        "location": "Test City, TC",
        "address": "123 Test Street, Test City, TC 12345",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "max_guests": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": ["WiFi", "Kitchen", "Air conditioning"]
    }


@pytest.fixture
def test_listing(db_session, test_host, test_listing_data):
    """Create a test listing in the database"""
    listing = models.Listing(
        **test_listing_data,
        host_id=test_host.id
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)
    return listing


@pytest.fixture
def test_booking_data(test_listing):
    """Test booking data"""
    from datetime import datetime, timedelta
    future_date = datetime.now() + timedelta(days=7)
    return {
        "listing_id": test_listing.id,
        "check_in_date": future_date.isoformat(),
        "check_out_date": (future_date + timedelta(days=3)).isoformat(),
        "guest_count": 2,
        "special_requests": "Please provide extra towels"
    }


@pytest.fixture
def completed_booking(db_session, test_user, test_listing):
    """Create a completed booking for review testing"""
    from app import models
    from datetime import datetime, timedelta
    booking = models.Booking(
        listing_id=test_listing.id,
        customer_id=test_user.id,
        check_in_date=datetime.now() - timedelta(days=10),
        check_out_date=datetime.now() - timedelta(days=7),
        guest_count=2,
        total_price=360.0,
        status="completed"
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)
    return booking


@pytest.fixture
def temp_upload_dir():
    """Create a temporary directory for file uploads during tests"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


# Mock S3 service for testing
@pytest.fixture
def mock_s3_service(monkeypatch):
    """Mock S3 service for testing"""
    class MockS3Service:
        async def upload_image(self, file, user_id, listing_id=None, optimize=True):
            return {
                'key': f'test/image_{user_id}_{listing_id or "user"}.jpg',
                'url': f'http://test-bucket.s3.amazonaws.com/test/image_{user_id}_{listing_id or "user"}.jpg',
                'size': 1024,
                'content_type': 'image/jpeg',
                'filename': file.filename if hasattr(file, 'filename') else 'test.jpg'
            }
        
        async def upload_multiple_images(self, files, user_id, listing_id=None, max_files=10):
            results = []
            for i, file in enumerate(files[:max_files]):
                results.append(await self.upload_image(file, user_id, listing_id))
            return results
        
        def delete_image(self, file_key):
            return True
        
        def delete_multiple_images(self, file_keys):
            return {'deleted': len(file_keys), 'failed': 0}
    
    mock_service = MockS3Service()
    monkeypatch.setattr("app.services.s3_service.s3_service", mock_service)
    return mock_service 