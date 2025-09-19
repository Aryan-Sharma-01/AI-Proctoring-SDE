-- Video Proctoring System Database Schema
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS proctoring_system;
USE proctoring_system;

-- Proctoring Sessions Table
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id VARCHAR(36) PRIMARY KEY,
    candidate_name VARCHAR(255) NOT NULL,
    interviewer_name VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INT, -- in seconds
    status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
    focus_score FLOAT DEFAULT 100.0,
    integrity_score FLOAT DEFAULT 100.0,
    total_events INT DEFAULT 0,
    suspicious_events INT DEFAULT 0,
    focus_lost_count INT DEFAULT 0,
    face_absent_count INT DEFAULT 0,
    multiple_faces_count INT DEFAULT 0,
    phone_detected_count INT DEFAULT 0,
    book_detected_count INT DEFAULT 0,
    device_detected_count INT DEFAULT 0,
    drowsiness_count INT DEFAULT 0,
    video_path VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_candidate_name (candidate_name),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
);

-- Proctoring Events Table
CREATE TABLE IF NOT EXISTS proctoring_events (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    event_type ENUM(
        'focus_lost',
        'face_absent',
        'multiple_faces',
        'phone_detected',
        'book_detected',
        'device_detected',
        'drowsiness_detected',
        'eye_closure',
        'looking_away',
        'background_voice',
        'session_start',
        'session_end'
    ) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    timestamp DATETIME NOT NULL,
    duration INT, -- in milliseconds
    confidence FLOAT, -- 0.0 to 1.0
    description TEXT,
    coordinates JSON, -- For bounding box coordinates
    image_path VARCHAR(500),
    metadata JSON,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity)
);

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'interviewer', 'viewer') DEFAULT 'interviewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@proctoring.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('focus_lost_threshold', '5000', 'Time in milliseconds before focus lost event is triggered'),
('face_absent_threshold', '10000', 'Time in milliseconds before face absent event is triggered'),
('drowsiness_threshold', '0.6', 'Confidence threshold for drowsiness detection'),
('phone_detection_threshold', '0.7', 'Confidence threshold for phone detection'),
('book_detection_threshold', '0.6', 'Confidence threshold for book/notes detection'),
('device_detection_threshold', '0.7', 'Confidence threshold for electronic device detection'),
('integrity_deduction_per_event', '2', 'Points deducted from integrity score per suspicious event'),
('max_session_duration', '7200', 'Maximum session duration in seconds (2 hours)')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Create views for easier reporting
CREATE OR REPLACE VIEW session_summary AS
SELECT 
    s.id,
    s.candidate_name,
    s.interviewer_name,
    s.start_time,
    s.end_time,
    s.duration,
    s.status,
    s.focus_score,
    s.integrity_score,
    s.total_events,
    s.suspicious_events,
    s.focus_lost_count,
    s.face_absent_count,
    s.phone_detected_count,
    s.book_detected_count,
    s.device_detected_count,
    s.drowsiness_count,
    CASE 
        WHEN s.integrity_score >= 80 THEN 'Good'
        WHEN s.integrity_score >= 60 THEN 'Fair'
        ELSE 'Poor'
    END as integrity_rating
FROM proctoring_sessions s;

CREATE OR REPLACE VIEW event_summary AS
SELECT 
    e.id,
    e.session_id,
    s.candidate_name,
    e.event_type,
    e.severity,
    e.timestamp,
    e.duration,
    e.confidence,
    e.description,
    e.is_resolved
FROM proctoring_events e
JOIN proctoring_sessions s ON e.session_id = s.id;

-- Create indexes for better performance
CREATE INDEX idx_sessions_date_range ON proctoring_sessions(start_time, end_time);
CREATE INDEX idx_events_session_timestamp ON proctoring_events(session_id, timestamp);
CREATE INDEX idx_events_type_severity ON proctoring_events(event_type, severity);

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetSessionReport(IN session_id VARCHAR(36))
BEGIN
    SELECT 
        s.*,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'high' OR e.severity = 'critical' THEN 1 END) as critical_events,
        AVG(e.confidence) as avg_confidence
    FROM proctoring_sessions s
    LEFT JOIN proctoring_events e ON s.id = e.session_id
    WHERE s.id = session_id
    GROUP BY s.id;
END //

CREATE PROCEDURE GetEventStatistics(IN session_id VARCHAR(36))
BEGIN
    SELECT 
        event_type,
        severity,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
    FROM proctoring_events
    WHERE session_id = session_id
    GROUP BY event_type, severity
    ORDER BY count DESC;
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON proctoring_system.* TO 'proctoring_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;
