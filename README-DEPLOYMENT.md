# Lady's Essence - Menstrual Health Platform

A comprehensive digital platform for menstrual health education, cycle tracking, and healthcare access, featuring both web interface and USSD accessibility.

## Features

### 🌐 Web Platform
- **Cycle Tracking**: Personal menstrual cycle monitoring with predictions
- **Educational Content**: Comprehensive menstrual health information
- **Appointment Booking**: Healthcare provider appointments
- **Meal Logging**: Nutrition tracking during menstrual cycles
- **Notifications**: Personalized health reminders

### 📱 USSD Accessibility
- **Universal Access**: Works on any mobile phone
- **Offline Capability**: No internet required
- **Multi-language Support**: Accessible to diverse populations
- **SMS Integration**: Health tips and reminders via SMS

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT tokens
- **API**: RESTful endpoints
- **Deployment**: Docker, Gunicorn

### Frontend
- **Framework**: Next.js (React)
- **Styling**: CSS Modules
- **State Management**: Context API
- **Build Tool**: Next.js built-in

## Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ladys_essenced
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Run the Backend**
   ```bash
   cd backend
   python run.py
   ```

5. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - USSD Endpoint: http://localhost:5000/api/ussd

## Production Deployment

### Using Docker Compose (Recommended)

1. **Prepare Environment**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your production values
   ```

2. **Deploy**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment

1. **Build Docker Images**
   ```bash
   docker-compose build
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Run Database Migrations**
   ```bash
   docker-compose exec backend python -m flask db upgrade
   ```

## Environment Variables

### Required Production Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname
DB_PASSWORD=your-secure-password

# Security
JWT_SECRET_KEY=your-jwt-secret-256-bits-minimum
SECRET_KEY=your-flask-secret-256-bits-minimum

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### Cycle Tracking
- `GET /api/cycle-logs` - Get cycle logs
- `POST /api/cycle-logs` - Create cycle log
- `PUT /api/cycle-logs/{id}` - Update cycle log

### USSD
- `POST /api/ussd` - USSD gateway endpoint

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Book appointment

## USSD Usage

### Access Codes
- **Main Menu**: `*123#` (or your configured shortcode)
- **Quick Cycle Log**: `*123*1#`
- **View Next Period**: `*123*2#`

### USSD Flow
1. **Registration**: New users complete profile setup
2. **Main Menu**: Access to all features
3. **Cycle Tracking**: Log periods and symptoms
4. **Health Info**: Educational content
5. **Appointments**: Book healthcare visits

## Development

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
flask db upgrade

# Start development server
python run.py
```

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Migrations

```bash
# Create new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Downgrade (if needed)
flask db downgrade
```

## Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### USSD Testing
Use the provided test scripts:
```bash
python test_ussd_flow.py
```

## Security Considerations

### Production Security
- Use strong, unique secret keys (minimum 256 bits)
- Enable HTTPS/TLS in production
- Restrict CORS origins to your domain only
- Use PostgreSQL for production (not SQLite)
- Regular security updates for dependencies
- Implement rate limiting
- Use environment variables for all secrets

### Database Security
- Regular backups
- Encrypted connections
- Restricted database user permissions
- Regular security patches

## Monitoring and Logging

### Health Checks
- Backend: `GET /` - Health status
- Database: Built-in Docker health checks
- Frontend: Next.js health endpoint

### Logs
```bash
# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.

---

**Lady's Essence** - Empowering women through accessible menstrual health technology.
