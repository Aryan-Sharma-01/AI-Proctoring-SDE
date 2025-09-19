import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  MoreVert,
  Download,
  Visibility,
  Assessment,
  GetApp,
  Refresh
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proctoring/sessions?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, sessionId) => {
    setAnchorEl(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSessionId(null);
  };

  const handleViewReport = async () => {
    if (!selectedSessionId) return;
    
    try {
      const response = await fetch(`/api/reports/${selectedSessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.report);
        setShowReportDialog(true);
      } else {
        setError('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to fetch report');
    }
    
    handleMenuClose();
  };

  const handleDownloadPDF = async () => {
    if (!selectedSessionId) return;
    
    try {
      const response = await fetch(`/api/reports/${selectedSessionId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proctoring-report-${selectedSessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF');
    }
    
    handleMenuClose();
  };

  const handleDownloadCSV = async () => {
    if (!selectedSessionId) return;
    
    try {
      const response = await fetch(`/api/reports/${selectedSessionId}/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proctoring-report-${selectedSessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setError('Failed to download CSV');
    }
    
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const getIntegrityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Chart data for statistics
  const chartData = sessions.map(session => ({
    name: session.candidateName,
    integrity: session.integrityScore || 0,
    focus: session.focusScore || 0,
    events: session.totalEvents || 0
  }));

  const eventTypeData = reportData ? Object.entries(reportData.eventBreakdown || {}).map(([type, count]) => ({
    name: type.replace(/_/g, ' ').toUpperCase(),
    value: count
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Proctoring Reports
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchSessions}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integrity Scores Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="integrity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Types Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Proctoring Sessions
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Interviewer</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Integrity Score</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {session.candidateName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {session.interviewerName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(session.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        color={getStatusColor(session.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {session.integrityScore ? `${session.integrityScore.toFixed(1)}%` : 'N/A'}
                        </Typography>
                        {session.integrityScore && (
                          <LinearProgress
                            variant="determinate"
                            value={session.integrityScore}
                            color={getIntegrityColor(session.integrityScore)}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.totalEvents || 0} total
                      </Typography>
                      <Typography variant="caption" color="error">
                        {session.suspiciousEvents || 0} suspicious
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, session.id)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewReport}>
          <Visibility sx={{ mr: 1 }} />
          View Report
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <GetApp sx={{ mr: 1 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleDownloadCSV}>
          <Download sx={{ mr: 1 }} />
          Download CSV
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Proctoring Report - {reportData?.session?.candidateName}
        </DialogTitle>
        <DialogContent>
          {reportData && (
            <Box>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Statistics" />
                <Tab label="Events" />
              </Tabs>

              {tabValue === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h6">Session Information</Typography>
                      <Typography>Candidate: {reportData.session.candidateName}</Typography>
                      <Typography>Interviewer: {reportData.session.interviewerName || 'N/A'}</Typography>
                      <Typography>Start Time: {new Date(reportData.session.startTime).toLocaleString()}</Typography>
                      <Typography>Duration: {Math.floor(reportData.session.duration / 60)}m {reportData.session.duration % 60}s</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">Scores</Typography>
                      <Typography>Focus Score: {reportData.scores.focusScore}%</Typography>
                      <Typography>Integrity Score: {reportData.scores.integrityScore}%</Typography>
                      <Typography>Focus Percentage: {reportData.scores.focusPercentage}%</Typography>
                    </Grid>
                  </Grid>
                  
                  <Box mt={3}>
                    <Typography variant="h6">Recommendations</Typography>
                    {reportData.summary.recommendations.map((rec, index) => (
                      <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6">Event Statistics</Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {Object.entries(reportData.statistics).map(([key, value]) => (
                      <Grid item xs={6} sm={4} key={key}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6">{value}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6">Event Timeline</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.events.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={event.type}
                                size="small"
                                color={event.severity === 'high' ? 'error' : event.severity === 'medium' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={event.severity}
                                size="small"
                                color={event.severity === 'high' ? 'error' : event.severity === 'medium' ? 'warning' : 'info'}
                              />
                            </TableCell>
                            <TableCell>{event.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>
            Close
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="contained"
            startIcon={<GetApp />}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reports;
