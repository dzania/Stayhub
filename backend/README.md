# StayHub Backend

FastAPI-based backend for the StayHub application.

## Features

- **FastAPI** - Modern, fast web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **JWT Authentication** - Secure user authentication
- **Pydantic** - Data validation using Python type annotations

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL
- Poetry

### Installation

1. **Install dependencies**
```bash
poetry install
```

2. **Activate virtual environment**
```bash
poetry shell
```

3. **Set up environment variables**
Create a `.env` file with:
```
DATABASE_URL=postgresql://username:password@localhost/stayhub
SECRET_KEY=your-secret-key-here
```

4. **Run database migrations**
```bash
alembic upgrade head
```

5. **Start the development server**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

## Development

### Code formatting
```bash
black .
isort .
```

### Linting
```bash
flake8
```

### Running tests
```bash
pytest
```

### Creating migrations
```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
``` 