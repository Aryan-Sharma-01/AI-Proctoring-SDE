const express = require('express');
const { ProctoringSession, ProctoringEvent } = require('../models');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Generate proctoring report
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    const session = await ProctoringSession.findByPk(sessionId, {
      include: [{
        model: ProctoringEvent,
        as: 'events',
        order: [['timestamp', 'ASC']]
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const report = generateReport(session);

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="proctoring-report-${sessionId}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'csv') {
      const csvPath = await generateCSVReport(report, sessionId);
      res.download(csvPath, `proctoring-report-${sessionId}.csv`);
    } else {
      res.json({
        success: true,
        report
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate PDF report
router.get('/:sessionId/pdf', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ProctoringSession.findByPk(sessionId, {
      include: [{
        model: ProctoringEvent,
        as: 'events',
        order: [['timestamp', 'ASC']]
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const report = generateReport(session);
    const pdfBuffer = await generatePDFReport(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proctoring-report-${sessionId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate CSV report
router.get('/:sessionId/csv', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ProctoringSession.findByPk(sessionId, {
      include: [{
        model: ProctoringEvent,
        as: 'events',
        order: [['timestamp', 'ASC']]
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const report = generateReport(session);
    const csvPath = await generateCSVReport(report, sessionId);

    res.download(csvPath, `proctoring-report-${sessionId}.csv`);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// Get all reports summary
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const sessions = await ProctoringSession.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'candidateName',
        'interviewerName',
        'startTime',
        'endTime',
        'duration',
        'focusScore',
        'integrityScore',
        'totalEvents',
        'suspiciousEvents'
      ]
    });

    res.json({
      success: true,
      reports: sessions.rows,
      pagination: {
        total: sessions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(sessions.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Helper function to generate report data
function generateReport(session) {
  const events = session.events || [];
  const duration = session.duration || 0;
  
  // Calculate statistics
  const eventStats = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {});

  const severityStats = events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {});

  // Calculate focus percentage
  const focusLostDuration = events
    .filter(e => e.eventType === 'focus_lost')
    .reduce((acc, e) => acc + (e.duration || 0), 0);
  
  const focusPercentage = duration > 0 ? Math.max(0, 100 - (focusLostDuration / duration) * 100) : 100;

  return {
    session: {
      id: session.id,
      candidateName: session.candidateName,
      interviewerName: session.interviewerName,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: duration,
      status: session.status
    },
    scores: {
      focusScore: session.focusScore,
      integrityScore: session.integrityScore,
      focusPercentage: Math.round(focusPercentage * 100) / 100
    },
    statistics: {
      totalEvents: session.totalEvents,
      suspiciousEvents: session.suspiciousEvents,
      focusLostCount: session.focusLostCount,
      faceAbsentCount: session.faceAbsentCount,
      multipleFacesCount: session.multipleFacesCount,
      phoneDetectedCount: session.phoneDetectedCount,
      bookDetectedCount: session.bookDetectedCount,
      deviceDetectedCount: session.deviceDetectedCount,
      drowsinessCount: session.drowsinessCount
    },
    eventBreakdown: eventStats,
    severityBreakdown: severityStats,
    events: events.map(event => ({
      id: event.id,
      type: event.eventType,
      severity: event.severity,
      timestamp: event.timestamp,
      duration: event.duration,
      confidence: event.confidence,
      description: event.description
    })),
    summary: {
      overallIntegrity: session.integrityScore >= 80 ? 'Good' : session.integrityScore >= 60 ? 'Fair' : 'Poor',
      recommendations: generateRecommendations(session, eventStats)
    }
  };
}

// Helper function to generate recommendations
function generateRecommendations(session, eventStats) {
  const recommendations = [];
  
  if (session.focusLostCount > 5) {
    recommendations.push('Consider improving focus during interviews - multiple instances of looking away detected');
  }
  
  if (session.phoneDetectedCount > 0) {
    recommendations.push('Mobile phone usage detected - ensure no unauthorized devices are present');
  }
  
  if (session.bookDetectedCount > 0) {
    recommendations.push('Books or notes detected - verify no unauthorized materials are being used');
  }
  
  if (session.multipleFacesCount > 0) {
    recommendations.push('Multiple faces detected - ensure only the candidate is present during the interview');
  }
  
  if (session.drowsinessCount > 3) {
    recommendations.push('Drowsiness detected multiple times - consider scheduling interviews at optimal times');
  }

  if (recommendations.length === 0) {
    recommendations.push('No significant issues detected - good interview conduct');
  }

  return recommendations;
}

// Helper function to generate PDF report
async function generatePDFReport(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(20).text('Proctoring Report', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);

    // Session Information
    doc.fontSize(16).text('Session Information', 50, 120);
    doc.fontSize(10)
      .text(`Candidate: ${report.session.candidateName}`, 50, 150)
      .text(`Interviewer: ${report.session.interviewerName || 'N/A'}`, 50, 165)
      .text(`Start Time: ${new Date(report.session.startTime).toLocaleString()}`, 50, 180)
      .text(`End Time: ${report.session.endTime ? new Date(report.session.endTime).toLocaleString() : 'N/A'}`, 50, 195)
      .text(`Duration: ${Math.floor(report.session.duration / 60)} minutes ${report.session.duration % 60} seconds`, 50, 210);

    // Scores
    doc.fontSize(16).text('Scores', 50, 250);
    doc.fontSize(10)
      .text(`Focus Score: ${report.scores.focusScore}%`, 50, 280)
      .text(`Integrity Score: ${report.scores.integrityScore}%`, 50, 295)
      .text(`Focus Percentage: ${report.scores.focusPercentage}%`, 50, 310);

    // Statistics
    doc.fontSize(16).text('Statistics', 50, 350);
    let yPos = 380;
    Object.entries(report.statistics).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`, 50, yPos);
      yPos += 15;
    });

    // Recommendations
    doc.fontSize(16).text('Recommendations', 50, yPos + 20);
    yPos += 50;
    report.summary.recommendations.forEach(rec => {
      doc.fontSize(10).text(`• ${rec}`, 50, yPos);
      yPos += 15;
    });

    doc.end();
  });
}

// Helper function to generate CSV report
async function generateCSVReport(report, sessionId) {
  const csvWriter = createCsvWriter({
    path: `./uploads/report-${sessionId}.csv`,
    header: [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'eventType', title: 'Event Type' },
      { id: 'severity', title: 'Severity' },
      { id: 'description', title: 'Description' },
      { id: 'confidence', title: 'Confidence' }
    ]
  });

  const records = report.events.map(event => ({
    timestamp: new Date(event.timestamp).toLocaleString(),
    eventType: event.type,
    severity: event.severity,
    description: event.description || '',
    confidence: event.confidence || ''
  }));

  await csvWriter.writeRecords(records);
  return `./uploads/report-${sessionId}.csv`;
}

module.exports = router;
