import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Videocam,
  VideocamOff,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useProctoring } from '../contexts/ProctoringContext';
import VideoProctoring from '../components/VideoProctoring';
import AlertPanel from '../components/AlertPanel';

const Interview = () => {
  const { 
    currentSession, 
    isProctoring, 
    startProctoring, 
    stopProctoring, 
    alerts,
    dismissAlert 
  } = useProctoring();
  
  const [candidateName, setCandidateName] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStartProctoring = async () => {
    if (!candidateName.trim()) {
      setError('Candidate name is required');
      return;
    }

    setLoading(true);
    setError('');

    const result = await startProctoring(candidateName, interviewerName);
    
    if (result.success) {
      setSuccess('Proctoring session started successfully');
      setShowStartDialog(false);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleStopProctoring = async () => {
    setLoading(true);
    setError('');

    const result = await stopProctoring();
    
    if (result.success) {
      setSuccess('Proctoring session stopped successfully');
      setCandidateName('');
      setInterviewerName('');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Interview Proctoring
      </Typography>

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Session Status */}
      {currentSession && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<Videocam />}
        >
          <Typography variant="h6">
            Active Session: {currentSession.candidateName}
          </Typography>
          <Typography variant="body2">
            Started: {new Date(currentSession.startTime).toLocaleString()}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Video Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Video Feed
              </Typography>
              <Chip
                icon={isProctoring ? <CheckCircle /> : <Error />}
                label={isProctoring ? 'Proctoring Active' : 'Not Proctoring'}
                color={isProctoring ? 'success' : 'error'}
              />
            </Box>

            {isProctoring ? (
              <VideoProctoring />
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="400px"
                bgcolor="grey.100"
                borderRadius={2}
              >
                <VideocamOff sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Active Session
                </Typography>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  Start a proctoring session to begin monitoring
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Controls and Alerts */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Session Controls */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Controls
                </Typography>
                
                {!isProctoring ? (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => setShowStartDialog(true)}
                    fullWidth
                    size="large"
                  >
                    Start Proctoring
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleStopProctoring}
                    fullWidth
                    size="large"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Stop Proctoring'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Real-time Alerts */}
            <AlertPanel alerts={alerts} onDismiss={dismissAlert} />

            {/* Session Info */}
            {currentSession && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="body2">
                      <strong>Candidate:</strong> {currentSession.candidateName}
                    </Typography>
                    {currentSession.interviewerName && (
                      <Typography variant="body2">
                        <strong>Interviewer:</strong> {currentSession.interviewerName}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Start Time:</strong> {new Date(currentSession.startTime).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {currentSession.status}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Start Session Dialog */}
      <Dialog 
        open={showStartDialog} 
        onClose={() => setShowStartDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start Proctoring Session</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Candidate Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              fullWidth
              required
              placeholder="Enter candidate's full name"
            />
            <TextField
              label="Interviewer Name (Optional)"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              fullWidth
              placeholder="Enter interviewer's name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStartDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStartProctoring}
            variant="contained"
            disabled={loading || !candidateName.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {loading ? 'Starting...' : 'Start Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Interview;
