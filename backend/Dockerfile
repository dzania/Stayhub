FROM python:3.11

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install Poetry
RUN pip install poetry

# Set work directory
WORKDIR /app

# Copy Poetry files
COPY pyproject.toml poetry.lock* /app/

# Configure poetry: Don't create virtual environment, install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev

# Copy project
COPY . /app/

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 