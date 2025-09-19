const express = require('express');
const { ProctoringSession, ProctoringEvent } = require('../models');
const router = express.Router();

// Start a new proctoring session
router.post('/start', async (req, res) => {
  try {
    const { candidateName, interviewerName, metadata } = req.body;
    
    if (!candidateName) {
      return res.status(400).json({ error: 'Candidate name is required' });
    }

    const session = await ProctoringSession.create({
      candidateName,
      interviewerName,
      startTime: new Date(),
      metadata: metadata || {}
    });

    // Log session start event
    await ProctoringEvent.create({
      sessionId: session.id,
      eventType: 'session_start',
      timestamp: new Date(),
      description: `Proctoring session started for ${candidateName}`
    });

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        candidateName: session.candidateName,
        interviewerName: session.interviewerName,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error starting proctoring session:', error);
    res.status(500).json({ error: 'Failed to start proctoring session' });
  }
});

// Stop a proctoring session
router.post('/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await ProctoringSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime - session.startTime) / 1000);

    await session.update({
      endTime,
      duration,
      status: 'completed'
    });

    // Log session end event
    await ProctoringEvent.create({
      sessionId: session.id,
      eventType: 'session_end',
      timestamp: endTime,
      description: `Proctoring session completed for ${session.candidateName}`
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        duration,
        endTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error stopping proctoring session:', error);
    res.status(500).json({ error: 'Failed to stop proctoring session' });
  }
});

// Get all proctoring sessions
router.get('/sessions', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, candidateName } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (candidateName) whereClause.candidateName = { [require('sequelize').Op.like]: `%${candidateName}%` };

    const sessions = await ProctoringSession.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: ProctoringEvent,
        as: 'events',
        limit: 5,
        order: [['timestamp', 'DESC']]
      }]
    });

    res.json({
      success: true,
      sessions: sessions.rows,
      pagination: {
        total: sessions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(sessions.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get specific session with events
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await ProctoringSession.findByPk(id, {
      include: [{
        model: ProctoringEvent,
        as: 'events',
        order: [['timestamp', 'ASC']]
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Update session focus score
router.put('/sessions/:id/focus-score', async (req, res) => {
  try {
    const { id } = req.params;
    const { focusScore, integrityScore } = req.body;

    const session = await ProctoringSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.update({
      focusScore: focusScore || session.focusScore,
      integrityScore: integrityScore || session.integrityScore
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        focusScore: session.focusScore,
        integrityScore: session.integrityScore
      }
    });
  } catch (error) {
    console.error('Error updating focus score:', error);
    res.status(500).json({ error: 'Failed to update focus score' });
  }
});

module.exports = router;
