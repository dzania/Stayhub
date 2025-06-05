# 🗄️ Database Migrations Setup

## ✅ What's Included

Your backend now has a complete **Alembic migration system** with:

### 📁 Migration Files
- `backend/alembic.ini` - Alembic configuration
- `backend/alembic/env.py` - Migration environment setup
- `backend/alembic/versions/001_initial_migration.py` - Initial database schema
- `backend/requirements.txt` - **Includes alembic==1.12.1**

### 🚀 Startup Scripts
- `backend/start.sh` - **Production**: Runs migrations + starts app
- `backend/start-dev.sh` - **Development**: Runs migrations + starts app with hot reload
- `backend/migrate.py` - **Manual migration management**

### 🐳 Docker Integration
- **Automatic migrations** on container startup
- Database connection waiting
- **Both Dockerfiles updated** to include migration support

## 🔧 How It Works

### 1. **Automatic Migrations (Recommended)**
When you run Docker Compose, migrations run automatically:

```bash
# Development
docker-compose up

# Production  
docker-compose -f docker-compose.prod.yml up
```

**What happens:**
1. ⏳ Waits for database to be ready
2. 🔄 Runs `alembic upgrade head` 
3. ✅ Starts your FastAPI app
4. 🎯 Your database is ready!

### 2. **Manual Migration Management**

```bash
# Inside backend directory or container
python migrate.py upgrade     # Run pending migrations
python migrate.py current     # Show current migration
python migrate.py history     # Show all migrations
python migrate.py revision    # Create new migration
python migrate.py downgrade   # Rollback one migration
```

### 3. **Creating New Migrations**

When you change your models in `backend/app/models.py`:

```bash
# Inside backend container
docker-compose exec backend python migrate.py revision
# Enter migration description when prompted
```

Or use Alembic directly:
```bash
docker-compose exec backend alembic revision --autogenerate -m "Add new field"
```

## 📊 Database Schema Created

Your initial migration creates these tables:

### 👤 **users**
- id, email, username, password
- first_name, last_name, phone
- is_host, profile_image
- created_at, updated_at

### 🏠 **listings** 
- id, title, description, price_per_night
- location, address, lat/lng coordinates
- max_guests, bedrooms, bathrooms
- amenities (JSON), images (JSON)
- host_id (FK to users), is_active
- created_at, updated_at

### 📅 **bookings**
- id, listing_id (FK), customer_id (FK)
- check_in_date, check_out_date
- total_price, guest_count, status
- special_requests
- created_at, updated_at

### ⭐ **reviews**
- id, listing_id (FK), reviewer_id (FK), host_id (FK)
- rating (1-5), comment
- created_at

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps

# View backend logs
docker-compose logs backend

# Restart services
docker-compose restart
```

### Migration Errors
```bash
# Check migration status
docker-compose exec backend python migrate.py current

# View migration history
docker-compose exec backend python migrate.py history

# Manual migration run
docker-compose exec backend alembic upgrade head
```

### Starting Fresh
```bash
# Reset everything (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose up
```

## 🎯 Free Deployment Ready!

Your migration system works with **all deployment options**:

- ✅ **Railway** - Automatic migrations on deploy
- ✅ **Render** - Migrations in startup script
- ✅ **Google Cloud Run** - Container includes migration logic
- ✅ **Oracle Cloud** - VPS runs migrations automatically
- ✅ **Fly.io** - Migration-enabled containers

**Next steps:** Choose your deployment platform and deploy! 🚀 