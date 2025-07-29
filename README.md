# Feedback Management System

A full-stack application for managing feedback with a Django backend and React frontend. Now fully containerized using Docker.

## Project Structure

- `feedback_mgmt/` - Django backend application
  - `core/` - Main Django app with models, views, and API endpoints
  - `feedback_mgmt/` - Django project settings
  - `manage.py` - Django management script
  - `Dockerfile` - Backend Docker configuration

- `feedback_mgmt/feedback-frontend/` - React frontend application
  - `src/` - Source code for the React application
  - `public/` - Public assets
  - `Dockerfile` - Frontend Docker configuration

- `docker-compose.yml` - Docker Compose file to manage multi-container setup
- `requirements.txt` - Python dependencies

## Setup Instructions

### Using Docker (Recommended)

Make sure Docker is installed on your system.

1. Navigate to the root project directory:
cd feedback_mgmt


2. Build and start all services:
docker-compose up --build


3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

4. Stop services:
docker-compose down


---

### Manual Setup (Without Docker)

#### Backend (Django)

1. Navigate to the backend directory:
cd feedback_mgmt


2. Create and activate a virtual environment:
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate


3. Install dependencies:
pip install -r requirements.txt


4. Run migrations:
python manage.py migrate


5. Start the development server:
python manage.py runserver


#### Frontend (React)

1. Navigate to the frontend directory:
cd feedback_mgmt/feedback-frontend


2. Install dependencies:
npm install


3. Start the development server:
npm start


## Features

- User authentication and authorization (JWT-based)
- CRUD operations for feedback management
- Interactive Kanban-style boards
- RESTful API for all operations
- Role-based permissions (admin, contributor)

## Technologies Used

- **Backend**: Django, Django REST Framework
- **Frontend**: React, React Router, Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (Docker production)
- **DevOps**: Docker, Docker Compose
