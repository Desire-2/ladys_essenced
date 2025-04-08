# The Lady's Essence - Project Documentation

## Overview
This document provides a comprehensive overview of The Lady's Essence platform, a health application targeting women in rural/underserved areas, focusing on menstrual health tracking, pregnancy care, and family health management.

## Project Structure

### Frontend (Next.js)
- `/ladys_essence/frontend/` - Next.js application
  - `/src/app/` - Pages and routes
  - `/src/contexts/` - React context providers for state management
  - `/src/api/` - API client for backend communication
  - `/public/` - Static assets

### Backend (Flask)
- `/ladys_essence/backend/` - Flask application
  - `/app/models/` - SQLAlchemy database models
  - `/app/routes/` - API endpoints
  - `/app/config/` - Application configuration

### Deployment
- `Dockerfile.frontend` - Docker configuration for frontend
- `Dockerfile.backend` - Docker configuration for backend
- `docker-compose.yml` - Orchestration for both services
- `start_app.sh` - Development startup script

## Features

### User Authentication
- Registration for parents and adolescents
- Secure login with JWT authentication
- Profile management

### Cycle Tracking
- Period logging with symptoms
- Cycle prediction
- Historical data visualization

### Meal Logging
- Nutritional tracking
- Meal categorization
- Dietary recommendations

### Appointment Management
- Schedule health appointments
- Status tracking
- Reminders

### Notification System
- Health reminders
- Appointment alerts
- Educational content updates

### Educational Content
- Health articles
- Categorized resources
- Search functionality

### Parent-Child Management
- Family health monitoring
- Child account management
- Privacy controls

## Technical Implementation

### Frontend
- Next.js for server-side rendering
- React Context API for state management
- Axios for API communication
- Responsive design for all devices

### Backend
- Flask RESTful API
- SQLAlchemy ORM for database models
- JWT for authentication
- CORS for cross-origin requests

### Database Schema
- Users (Parents and Adolescents)
- Cycle Logs
- Meal Logs
- Appointments
- Notifications
- Content (Categories and Items)
- Parent-Child Relationships

## Deployment Instructions

### Development
1. Clone the repository
2. Install dependencies:
   - Backend: `cd backend && pip install -r requirements.txt`
   - Frontend: `cd frontend && npm install`
3. Run the development servers:
   - Use `./start_app.sh` to run both servers

### Production
1. Ensure Docker and Docker Compose are installed
2. Build and start the containers:
   ```
   docker-compose up -d
   ```
3. Access the application:
   - Frontend: http://your-server-ip:3000
   - Backend API: http://your-server-ip:5000/api

## Future Enhancements
1. Email notification integration
2. Mobile application development
3. Offline functionality
4. Advanced analytics dashboard
5. Telehealth integration
6. Community forums
