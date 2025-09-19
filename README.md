# Video Proctoring System

A comprehensive video proctoring system designed for online interviews that detects focus levels and identifies unauthorized items in real-time.

## 🎯 Features

- **Real-time Focus Detection**: Monitors eye movement and face presence
- **Object Detection**: Identifies phones, books, notes, and electronic devices
- **Event Logging**: Comprehensive logging with timestamps
- **Proctoring Reports**: Detailed integrity reports with scoring
- **Real-time Alerts**: Live notifications for suspicious activities
- **Drowsiness Detection**: Advanced eye closure monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Modern web browser with camera access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd video-proctoring-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE proctoring_system;
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Edit server/.env with your MySQL credentials
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=proctoring_system
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
video-proctoring-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── hooks/          # Custom React hooks
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   └── routes/            # API routes
├── database/              # Database schemas
└── docs/                  # Documentation
```

## 🔧 API Endpoints

### Proctoring
- `POST /api/proctoring/start` - Start proctoring session
- `POST /api/proctoring/stop` - Stop proctoring session
- `GET /api/proctoring/sessions` - Get all sessions
- `GET /api/proctoring/sessions/:id` - Get specific session

### Events
- `POST /api/events` - Log proctoring event
- `GET /api/events/session/:sessionId` - Get events for session

### Reports
- `GET /api/reports/:sessionId` - Generate proctoring report
- `GET /api/reports/:sessionId/pdf` - Download PDF report

## 🎮 Usage

1. **Start Interview Session**
   - Navigate to the interview page
   - Allow camera and microphone access
   - Click "Start Proctoring"

2. **Monitor Real-time**
   - View live detection alerts
   - Monitor focus levels
   - Track suspicious activities

3. **Generate Reports**
   - Access the reports section
   - View detailed session analysis
   - Download PDF reports

## 🛠️ Technology Stack

### Frontend
- React 18
- TensorFlow.js
- MediaPipe
- OpenCV.js
- Material-UI

### Backend
- Node.js
- Express.js
- MySQL
- Socket.io
- Multer

### Computer Vision
- MediaPipe for face/eye detection
- TensorFlow.js for object detection
- Custom algorithms for focus analysis

## 📊 Detection Algorithms

### Focus Detection
- Eye gaze tracking using MediaPipe
- Face presence monitoring
- Multiple face detection
- Drowsiness detection

### Object Detection
- YOLO-based object recognition
- Custom trained models for interview-specific items
- Real-time classification

## 🚀 Deployment

### Using Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy backend and frontend separately

### Using Vercel
1. Import project to Vercel
2. Configure build settings
3. Deploy with automatic CI/CD

## 📈 Performance

- Real-time processing with <100ms latency
- Optimized for 30fps video processing
- Efficient memory management
- Scalable architecture

## 🔒 Privacy & Security

- Local video processing (no cloud storage)
- Encrypted data transmission
- GDPR compliant logging
- Secure session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: This system is designed for educational and professional interview purposes. Ensure compliance with local privacy laws and regulations.
