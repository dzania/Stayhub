# StayHub - Full Stack Application

A modern full-stack StayHub built with FastAPI, PostgreSQL, React, TypeScript, and Material UI.

## 🏗️ Architecture

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **JWT** - JSON Web Tokens for authentication
- **Poetry** - Modern dependency management for Python

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Material UI (MUI)** - Modern React UI library
- **React Query** - Powerful data fetching and caching
- **React Hook Form** - Performant forms with easy validation
- **React Router** - Declarative routing

## 🚀 Features

### User Management
- ✅ User registration and authentication (JWT)
- ✅ Two user roles: Customer and Host
- ✅ User profile management
- ✅ Protected routes

### Listings Management
- ✅ Create, read, update, delete listings (CRUD)
- ✅ Image upload with base64 encoding
- ✅ Search and filter functionality
- ✅ Location-based filtering
- ✅ Price range filtering
- ✅ Guest capacity filtering

### Booking System
- ✅ Create bookings with date validation
- ✅ Availability checking
- ✅ Booking status management
- ✅ Customer and Host dashboards
- ✅ Booking cancellation

### Review System
- ✅ Rate and review listings
- ✅ Average rating calculation
- ✅ Review management

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose (optional but recommended)

### Setup with Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/dzania/Stayhub.git
cd stayhub
```

2. **Start the application with Docker Compose**
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 8000
- Frontend application on port 3000

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install Poetry (if not installed)**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

3. **Install dependencies**
```bash
poetry install
```

4. **Activate virtual environment**
```bash
poetry shell
```

5. **Set up PostgreSQL database**
Make sure PostgreSQL is running and create a database:
```sql
CREATE DATABASE stayhub;
```

6. **Run database migrations**
```bash
alembic upgrade head
```

7. **Start the backend server**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install pnpm (if not installed)**
```bash
npm install -g pnpm
```

3. **Install dependencies**
```bash
pnpm install
```

4. **Start the development server**
```bash
pnpm start
```

The frontend will be available at `http://localhost:3000`

## 🛠️ Development Commands

### Backend Commands
```bash
# Install dependencies
poetry install

# Run server with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black .

# Lint code
flake8

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Frontend Commands
```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm run lint
```

## 📁 Project Structure

```
stayhub/
├── backend/
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── auth.py          # Authentication logic
│   │   ├── database.py      # Database configuration
│   │   ├── config.py        # Application settings
│   │   └── main.py          # FastAPI app instance
│   ├── pyproject.toml       # Poetry dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── constants/       # Application constants
│   │   ├── contexts/        # React contexts
│   │   ├── api/             # API client functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx          # Main App component
│   ├── package.json         # Frontend dependencies
│   └── Dockerfile
├── docker-compose.yml       # Docker services configuration
└── README.md
```

## 🔧 Configuration

### Backend Configuration
Environment variables (set in `backend/app/config.py`):
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time

### Frontend Configuration
Environment variables (create `.env` file in frontend/):
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update user profile

### Listings
- `GET /listings/` - Get all listings (with filters)
- `GET /listings/{id}` - Get listing by ID
- `POST /listings/` - Create listing (Host only)
- `PUT /listings/{id}` - Update listing (Host only)
- `DELETE /listings/{id}` - Delete listing (Host only)
- `POST /listings/{id}/images` - Upload listing images

### Bookings
- `POST /bookings/` - Create booking
- `GET /bookings/my-bookings` - Get user's bookings
- `GET /bookings/host/incoming` - Get host's incoming bookings
- `PUT /bookings/{id}/status` - Update booking status
- `DELETE /bookings/{id}` - Cancel booking

### Reviews
- `POST /reviews/` - Create review
- `GET /reviews/listing/{id}` - Get listing reviews
- `GET /reviews/my-reviews` - Get user's reviews

## 🧪 Testing

### Backend Tests
```bash
cd backend
poetry run pytest
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## 🚀 Deployment

### Using Docker
```bash
docker-compose up --build -d
```

### Manual Deployment
1. Set production environment variables
2. Build frontend: `pnpm build`
3. Set up production database
4. Deploy backend and frontend to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔮 Future Enhancements

- [ ] Advanced search with map integration
- [ ] Real-time messaging between hosts and guests
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Mobile responsive design improvements
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Social login (Google, Facebook)
- [ ] Advanced image processing and optimization
- [ ] Caching layer (Redis) 
