# StayHub Backend Test Suite

This directory contains comprehensive tests for the StayHub backend API.

## Test Structure

```
tests/
├── __init__.py          # Package marker
├── conftest.py          # Pytest configuration and fixtures
├── test_setup.py        # Basic setup verification tests
├── test_auth.py         # Authentication endpoint tests
├── test_listings.py     # Listings CRUD and image upload tests
├── test_bookings.py     # Booking management tests
├── test_reviews.py      # Review system tests
└── README.md           # This file
```

## Running Tests

### Prerequisites

1. Install test dependencies (already in requirements.txt):
   ```bash
   pip install pytest pytest-asyncio httpx pytest-mock
   ```

2. Make sure you're in the backend directory:
   ```bash
   cd backend
   ```

### Running All Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage (if coverage is installed)
pytest --cov=app --cov-report=html
```

### Running Specific Test Categories

```bash
# Run only authentication tests
pytest tests/test_auth.py

# Run only listing tests
pytest tests/test_listings.py

# Run only booking tests
pytest tests/test_bookings.py

# Run only review tests
pytest tests/test_reviews.py

# Run setup verification tests
pytest tests/test_setup.py
```

### Running Tests by Markers

```bash
# Run only fast tests (exclude slow ones)
pytest -m "not slow"

# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit
```

### Useful Pytest Options

```bash
# Stop on first failure
pytest -x

# Show local variables in tracebacks
pytest -l

# Run in parallel (if pytest-xdist is installed)
pytest -n auto

# Show test durations
pytest --durations=10

# Run specific test method
pytest tests/test_auth.py::TestAuthRegistration::test_register_new_user_success
```

## Test Features

### Database Testing
- Uses SQLite in-memory database for fast, isolated tests
- Each test gets a fresh database instance
- Automatic cleanup after each test

### Authentication Testing
- Comprehensive coverage of registration, login, and profile management
- Tests for invalid inputs, duplicate data, and edge cases
- Authorization and permission testing

### API Endpoint Testing
- Full CRUD operations for all main entities
- Input validation and error handling
- Authentication and authorization checks
- Business logic validation

### Image Upload Testing
- Mock S3 service for testing without real AWS calls
- File upload simulation with various file types
- Error handling for invalid files and permissions

### Fixture System
- Reusable test data and objects
- Consistent test environment setup
- Dependency injection for database sessions and clients

## Test Data

The test suite uses predefined test data:

- **Test User**: `test@example.com` (regular user)
- **Test Host**: `host@example.com` (host user)
- **Test Listing**: "Beautiful Test Apartment" in Test City
- **Test Bookings**: Various date ranges and statuses
- **Test Reviews**: Different ratings and comments

## Mocking Strategy

- **S3 Service**: Mocked to avoid real AWS calls and costs
- **Database**: Uses SQLite instead of PostgreSQL for speed
- **Email Service**: Would be mocked if implemented
- **External APIs**: Mocked to ensure deterministic tests

## Best Practices Followed

1. **Isolation**: Each test is independent and doesn't affect others
2. **Clarity**: Test names clearly describe what is being tested
3. **Coverage**: Tests cover happy paths, edge cases, and error conditions
4. **Speed**: Tests run quickly using in-memory database and mocks
5. **Maintainability**: DRY principle with shared fixtures and utilities

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run tests
  run: |
    cd backend
    pytest --cov=app --cov-report=xml
```

## Adding New Tests

When adding new endpoints or features:

1. Add test cases to the appropriate test file
2. Update fixtures in `conftest.py` if needed
3. Add new test markers to `pytest.ini` if needed
4. Follow the existing naming and structure conventions

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure you're running tests from the `backend` directory
2. **Database Errors**: Check that SQLAlchemy models are properly configured
3. **Fixture Errors**: Verify that all required fixtures are defined in `conftest.py`
4. **Authentication Errors**: Ensure JWT tokens are properly generated in fixtures

### Debug Mode

Run tests with Python's debugger:

```bash
pytest --pdb
```

Or add breakpoints in your code:

```python
import pdb; pdb.set_trace()
``` 