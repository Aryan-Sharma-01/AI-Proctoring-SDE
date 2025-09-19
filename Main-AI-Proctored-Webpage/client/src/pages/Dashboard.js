import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  VideoCall,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProctoring } from '../contexts/ProctoringContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentSession, isProctoring } = useProctoring();
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalEvents: 0,
    suspiciousEvents: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sessionsResponse, eventsResponse] = await Promise.all([
        fetch('/api/proctoring/sessions?limit=5'),
        fetch('/api/events?limit=10')
      ]);

      const sessionsData = await sessionsResponse.json();
      const eventsData = await eventsResponse.json();

      if (sessionsData.success) {
        setRecentSessions(sessionsData.sessions);
        setStats(prev => ({
          ...prev,
          totalSessions: sessionsData.pagination.total,
          activeSessions: sessionsData.sessions.filter(s => s.status === 'active').length
        }));
      }

      if (eventsData.success) {
        setStats(prev => ({
          ...prev,
          totalEvents: eventsData.pagination.total,
          suspiciousEvents: eventsData.events.filter(e => e.severity === 'high' || e.severity === 'critical').length
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'completed': return <Assessment />;
      case 'terminated': return <Error />;
      default: return <VideoCall />;
    }
  };

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
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalSessions}
                  </Typography>
                </Box>
                <VideoCall color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sessions
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.activeSessions}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Events
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalEvents}
                  </Typography>
                </Box>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Suspicious Events
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.suspiciousEvents}
                  </Typography>
                </Box>
                <Warning color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Session Alert */}
      {isProctoring && currentSession && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/interview')}>
              View Session
            </Button>
          }
        >
          Proctoring session is currently active for {currentSession.candidateName}
        </Alert>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<VideoCall />}
                  onClick={() => navigate('/interview')}
                  size="large"
                >
                  Start Interview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => navigate('/reports')}
                  size="large"
                >
                  View Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" />
                <Typography>All systems operational</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
                <CheckCircle color="success" />
                <Typography>Database connected</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
                <CheckCircle color="success" />
                <Typography>Detection models loaded</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Sessions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Sessions
          </Typography>
          {recentSessions.length === 0 ? (
            <Typography color="textSecondary">
              No sessions found. Start a new interview to begin proctoring.
            </Typography>
          ) : (
            <Box>
              {recentSessions.map((session) => (
                <Box
                  key={session.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={2}
                  borderBottom="1px solid"
                  borderColor="divider"
                  sx={{ '&:last-child': { borderBottom: 'none' } }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {session.candidateName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {session.interviewerName && `Interviewer: ${session.interviewerName}`}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(session.startTime).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      icon={getStatusIcon(session.status)}
                      label={session.status}
                      color={getStatusColor(session.status)}
                      size="small"
                    />
                    {session.integrityScore && (
                      <Box minWidth={100}>
                        <Typography variant="body2" color="textSecondary">
                          Integrity: {session.integrityScore.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={session.integrityScore}
                          color={session.integrityScore >= 80 ? 'success' : session.integrityScore >= 60 ? 'warning' : 'error'}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;
