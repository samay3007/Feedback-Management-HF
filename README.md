# Feedback Management System

A full-stack application for managing feedback with a Django backend and React frontend.

## Project Structure

- `feedback_mgmt/` - Django backend application
  - `core/` - Main Django app with models, views, and API endpoints
  - `feedback_mgmt/` - Django project settings
  - `manage.py` - Django management script

- `feedback_mgmt/feedback-frontend/` - React frontend application
  - `src/` - Source code for the React application
  - `public/` - Public assets

## Setup Instructions

### Backend (Django)

1. Navigate to the backend directory:
   ```
   cd feedback_mgmt
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Start the development server:
   ```
   python manage.py runserver
   ```

### Frontend (React)

1. Navigate to the frontend directory:
   ```
   cd feedback_mgmt/feedback-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Features

- User authentication and authorization
- CRUD operations for feedback management
- Interactive boards for organizing feedback
- RESTful API for data operations

## Technologies Used

- **Backend**: Django, Django REST Framework
- **Frontend**: React, React Router, CSS
- **Database**: SQLite (development), PostgreSQL (production)