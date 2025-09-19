const express = require('express');
const { ProctoringEvent, ProctoringSession } = require('../models');
const router = express.Router();

// Log a proctoring event
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      eventType,
      severity = 'medium',
      duration,
      confidence,
      description,
      coordinates,
      imagePath,
      metadata
    } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'Session ID and event type are required' });
    }

    // Verify session exists
    const session = await ProctoringSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const event = await ProctoringEvent.create({
      sessionId,
      eventType,
      severity,
      timestamp: new Date(),
      duration,
      confidence,
      description,
      coordinates,
      imagePath,
      metadata: metadata || {}
    });

    // Update session counters based on event type
    await updateSessionCounters(session, eventType);

    // Emit real-time event to connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(sessionId).emit('proctoring-alert', {
        eventId: event.id,
        eventType: event.eventType,
        severity: event.severity,
        timestamp: event.timestamp,
        description: event.description,
        confidence: event.confidence
      });
    }

    res.status(201).json({
      success: true,
      event: {
        id: event.id,
        eventType: event.eventType,
        severity: event.severity,
        timestamp: event.timestamp,
        description: event.description
      }
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Get events for a specific session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, severity, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { sessionId };
    if (eventType) whereClause.eventType = eventType;
    if (severity) whereClause.severity = severity;

    const events = await ProctoringEvent.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      events: events.rows,
      pagination: {
        total: events.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(events.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event statistics for a session
router.get('/session/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await ProctoringEvent.findAll({
      where: { sessionId },
      attributes: [
        'eventType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('AVG', require('sequelize').col('confidence')), 'avgConfidence']
      ],
      group: ['eventType']
    });

    const severityStats = await ProctoringEvent.findAll({
      where: { sessionId },
      attributes: [
        'severity',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['severity']
    });

    res.json({
      success: true,
      stats: {
        byType: stats,
        bySeverity: severityStats
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: 'Failed to fetch event statistics' });
  }
});

// Mark event as resolved
router.put('/:eventId/resolve', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await ProctoringEvent.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.update({ isResolved: true });

    res.json({
      success: true,
      event: {
        id: event.id,
        isResolved: event.isResolved
      }
    });
  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({ error: 'Failed to resolve event' });
  }
});

// Helper function to update session counters
async function updateSessionCounters(session, eventType) {
  const updateData = { totalEvents: session.totalEvents + 1 };
  
  switch (eventType) {
    case 'focus_lost':
      updateData.focusLostCount = session.focusLostCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'face_absent':
      updateData.faceAbsentCount = session.faceAbsentCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'multiple_faces':
      updateData.multipleFacesCount = session.multipleFacesCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'phone_detected':
      updateData.phoneDetectedCount = session.phoneDetectedCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'book_detected':
      updateData.bookDetectedCount = session.bookDetectedCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'device_detected':
      updateData.deviceDetectedCount = session.deviceDetectedCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
    case 'drowsiness_detected':
      updateData.drowsinessCount = session.drowsinessCount + 1;
      updateData.suspiciousEvents = session.suspiciousEvents + 1;
      break;
  }

  // Calculate integrity score
  const totalDeductions = (updateData.suspiciousEvents || session.suspiciousEvents) * 2;
  updateData.integrityScore = Math.max(0, 100 - totalDeductions);

  await session.update(updateData);
}

module.exports = router;
