# Deployment Guide

This guide covers deploying the Video Proctoring System to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Render (Recommended)

#### Backend Deployment
1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up for a free account

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` folder as root directory
   - Configure:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=proctoring_system
   JWT_SECRET=your-jwt-secret
   CORS_ORIGIN=https://your-frontend-url
   ```

4. **Database Setup**
   - Use Render's PostgreSQL or external MySQL
   - Run the database schema from `database/schema.sql`

#### Frontend Deployment
1. **Deploy Frontend**
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Select the `client` folder
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`

2. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url
   ```

### Option 2: Vercel

#### Backend (Serverless Functions)
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Backend**
   ```bash
   cd server
   vercel
   ```

3. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard

#### Frontend
1. **Deploy Frontend**
   ```bash
   cd client
   vercel
   ```

2. **Configure Environment Variables**
   - Add `REACT_APP_API_URL` pointing to your backend

### Option 3: Railway

1. **Connect GitHub Repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Deploy Services**
   - Deploy backend from `server` folder
   - Deploy frontend from `client` folder
   - Add PostgreSQL database

3. **Configure Environment Variables**
   - Add all required environment variables

## 🗄️ Database Setup

### MySQL (Production)
```sql
-- Create database
CREATE DATABASE proctoring_system;

-- Create user
CREATE USER 'proctoring_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON proctoring_system.* TO 'proctoring_user'@'%';
FLUSH PRIVILEGES;

-- Run schema
mysql -u proctoring_user -p proctoring_system < database/schema.sql
```

### PostgreSQL (Alternative)
1. Convert MySQL schema to PostgreSQL
2. Update database configuration in `server/config/database.js`
3. Install `pg` package: `npm install pg`

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=proctoring_system

# Server
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

## 🚀 Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Set up monitoring

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Monitor database performance

## 📊 Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple backend instances
- Implement Redis for session storage
- Use CDN for static assets
- Consider microservices architecture

### Database Scaling
- Use read replicas for reporting
- Implement database connection pooling
- Consider sharding for large datasets
- Set up database monitoring

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN environment variable
   - Ensure frontend URL is correct

2. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is running

3. **Build Failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Check for missing environment variables

4. **Video Detection Not Working**
   - Ensure HTTPS is enabled (required for camera access)
   - Check browser permissions
   - Verify model files are accessible

### Logs
- Backend logs: Check your hosting platform's log viewer
- Frontend logs: Check browser console
- Database logs: Check MySQL/PostgreSQL logs

## 📈 Performance Optimization

### Backend
- Enable compression middleware
- Implement caching for static data
- Optimize database queries
- Use connection pooling

### Frontend
- Enable code splitting
- Optimize bundle size
- Use lazy loading
- Implement service worker

### Database
- Add appropriate indexes
- Optimize queries
- Use connection pooling
- Consider read replicas

## 🔐 Security Best Practices

1. **Authentication**
   - Use strong passwords
   - Implement JWT token expiration
   - Add refresh token mechanism

2. **Data Protection**
   - Encrypt sensitive data
   - Use HTTPS everywhere
   - Implement input validation

3. **Access Control**
   - Implement role-based access
   - Add API rate limiting
   - Use CORS properly

4. **Monitoring**
   - Log security events
   - Monitor for suspicious activity
   - Set up alerts

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check network configuration

For additional help, refer to the main README.md or create an issue in the repository.
