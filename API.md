# API Documentation

This document describes the REST API endpoints for the Video Proctoring System.

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
Currently uses simple username/password authentication. In production, implement JWT tokens.

## Endpoints

### Authentication

#### POST /auth/login
Login to the system.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST /auth/logout
Logout from the system.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Proctoring Sessions

#### POST /proctoring/start
Start a new proctoring session.

**Request Body:**
```json
{
  "candidateName": "John Doe",
  "interviewerName": "Jane Smith",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-here",
    "candidateName": "John Doe",
    "interviewerName": "Jane Smith",
    "startTime": "2024-01-01T00:00:00.000Z",
    "status": "active"
  }
}
```

#### POST /proctoring/stop
Stop an active proctoring session.

**Request Body:**
```json
{
  "sessionId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-here",
    "duration": 3600,
    "endTime": "2024-01-01T01:00:00.000Z",
    "status": "completed"
  }
}
```

#### GET /proctoring/sessions
Get all proctoring sessions with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active, completed, terminated)
- `candidateName` (optional): Filter by candidate name

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid-here",
      "candidateName": "John Doe",
      "interviewerName": "Jane Smith",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T01:00:00.000Z",
      "duration": 3600,
      "status": "completed",
      "focusScore": 85.5,
      "integrityScore": 78.0,
      "totalEvents": 15,
      "suspiciousEvents": 3
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### GET /proctoring/sessions/:id
Get a specific session with all events.

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-here",
    "candidateName": "John Doe",
    "interviewerName": "Jane Smith",
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T01:00:00.000Z",
    "duration": 3600,
    "status": "completed",
    "focusScore": 85.5,
    "integrityScore": 78.0,
    "events": [
      {
        "id": "event-uuid",
        "eventType": "focus_lost",
        "severity": "medium",
        "timestamp": "2024-01-01T00:15:00.000Z",
        "duration": 5000,
        "confidence": 0.8,
        "description": "Looking away from screen for more than 5 seconds"
      }
    ]
  }
}
```

#### PUT /proctoring/sessions/:id/focus-score
Update focus and integrity scores for a session.

**Request Body:**
```json
{
  "focusScore": 85.5,
  "integrityScore": 78.0
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-here",
    "focusScore": 85.5,
    "integrityScore": 78.0
  }
}
```

### Events

#### POST /events
Log a proctoring event.

**Request Body:**
```json
{
  "sessionId": "uuid-here",
  "eventType": "focus_lost",
  "severity": "medium",
  "duration": 5000,
  "confidence": 0.8,
  "description": "Looking away from screen for more than 5 seconds",
  "coordinates": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 200
  },
  "imagePath": "/uploads/screenshot-123.jpg",
  "metadata": {
    "additionalData": "value"
  }
}
```

**Event Types:**
- `focus_lost`: User looking away from screen
- `face_absent`: No face detected
- `multiple_faces`: Multiple faces detected
- `phone_detected`: Mobile phone detected
- `book_detected`: Book or notes detected
- `device_detected`: Electronic device detected
- `drowsiness_detected`: Drowsiness detected
- `eye_closure`: Eyes closed
- `looking_away`: Looking away from camera
- `background_voice`: Background voices detected
- `session_start`: Session started
- `session_end`: Session ended

**Severity Levels:**
- `low`: Minor issue
- `medium`: Moderate concern
- `high`: Significant issue
- `critical`: Major violation

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "event-uuid",
    "eventType": "focus_lost",
    "severity": "medium",
    "timestamp": "2024-01-01T00:15:00.000Z",
    "description": "Looking away from screen for more than 5 seconds"
  }
}
```

#### GET /events/session/:sessionId
Get all events for a specific session.

**Query Parameters:**
- `eventType` (optional): Filter by event type
- `severity` (optional): Filter by severity
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event-uuid",
      "eventType": "focus_lost",
      "severity": "medium",
      "timestamp": "2024-01-01T00:15:00.000Z",
      "duration": 5000,
      "confidence": 0.8,
      "description": "Looking away from screen for more than 5 seconds",
      "coordinates": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 200
      },
      "isResolved": false
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

#### GET /events/session/:sessionId/stats
Get event statistics for a session.

**Response:**
```json
{
  "success": true,
  "stats": {
    "byType": [
      {
        "eventType": "focus_lost",
        "count": 5,
        "avgConfidence": 0.75
      },
      {
        "eventType": "phone_detected",
        "count": 2,
        "avgConfidence": 0.85
      }
    ],
    "bySeverity": [
      {
        "severity": "medium",
        "count": 8
      },
      {
        "severity": "high",
        "count": 2
      }
    ]
  }
}
```

#### PUT /events/:eventId/resolve
Mark an event as resolved.

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "event-uuid",
    "isResolved": true
  }
}
```

### Reports

#### GET /reports/:sessionId
Generate a proctoring report for a session.

**Query Parameters:**
- `format` (optional): Report format (json, pdf, csv) - default: json

**Response (JSON format):**
```json
{
  "success": true,
  "report": {
    "session": {
      "id": "uuid-here",
      "candidateName": "John Doe",
      "interviewerName": "Jane Smith",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T01:00:00.000Z",
      "duration": 3600,
      "status": "completed"
    },
    "scores": {
      "focusScore": 85.5,
      "integrityScore": 78.0,
      "focusPercentage": 85.5
    },
    "statistics": {
      "totalEvents": 15,
      "suspiciousEvents": 3,
      "focusLostCount": 5,
      "faceAbsentCount": 2,
      "multipleFacesCount": 0,
      "phoneDetectedCount": 1,
      "bookDetectedCount": 0,
      "deviceDetectedCount": 0,
      "drowsinessCount": 1
    },
    "eventBreakdown": {
      "focus_lost": 5,
      "face_absent": 2,
      "phone_detected": 1,
      "drowsiness_detected": 1
    },
    "severityBreakdown": {
      "medium": 8,
      "high": 2
    },
    "events": [
      {
        "id": "event-uuid",
        "type": "focus_lost",
        "severity": "medium",
        "timestamp": "2024-01-01T00:15:00.000Z",
        "duration": 5000,
        "confidence": 0.8,
        "description": "Looking away from screen for more than 5 seconds"
      }
    ],
    "summary": {
      "overallIntegrity": "Fair",
      "recommendations": [
        "Consider improving focus during interviews - multiple instances of looking away detected",
        "Mobile phone usage detected - ensure no unauthorized devices are present"
      ]
    }
  }
}
```

#### GET /reports/:sessionId/pdf
Download PDF report for a session.

**Response:** PDF file download

#### GET /reports/:sessionId/csv
Download CSV report for a session.

**Response:** CSV file download

#### GET /reports
Get summary of all reports.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid-here",
      "candidateName": "John Doe",
      "interviewerName": "Jane Smith",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T01:00:00.000Z",
      "duration": 3600,
      "focusScore": 85.5,
      "integrityScore": 78.0,
      "totalEvents": 15,
      "suspiciousEvents": 3
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15 minutes per IP address.

## WebSocket Events

The system also supports real-time communication via WebSocket:

### Connection
Connect to: `ws://localhost:5000` (development) or `wss://your-domain.com` (production)

### Events

#### join-session
Join a proctoring session to receive real-time updates.

**Payload:**
```json
{
  "sessionId": "uuid-here"
}
```

#### proctoring-event
Emit a proctoring event to the session.

**Payload:**
```json
{
  "sessionId": "uuid-here",
  "eventType": "focus_lost",
  "severity": "medium",
  "description": "Looking away from screen"
}
```

#### proctoring-alert
Receive real-time proctoring alerts.

**Payload:**
```json
{
  "eventId": "event-uuid",
  "eventType": "focus_lost",
  "severity": "medium",
  "timestamp": "2024-01-01T00:15:00.000Z",
  "description": "Looking away from screen for more than 5 seconds",
  "confidence": 0.8
}
```
