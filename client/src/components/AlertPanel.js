import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  Close,
  ExpandMore,
  ExpandLess,
  Phone,
  Book,
  Devices,
  VisibilityOff,
  PersonOff,
  MultipleFaces,
  WbSunny
} from '@mui/icons-material';
import { useState } from 'react';

const AlertPanel = ({ alerts, onDismiss }) => {
  const [expanded, setExpanded] = useState(true);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'phone_detected':
        return <Phone color="error" />;
      case 'book_detected':
        return <Book color="error" />;
      case 'device_detected':
        return <Devices color="error" />;
      case 'focus_lost':
        return <VisibilityOff color="warning" />;
      case 'face_absent':
        return <PersonOff color="error" />;
      case 'multiple_faces':
        return <MultipleFaces color="error" />;
      case 'drowsiness_detected':
        return <WbSunny color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const recentAlerts = alerts.slice(0, 10); // Show only last 10 alerts

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Real-time Alerts
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          {recentAlerts.length === 0 ? (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="textSecondary">
                No alerts at the moment
              </Typography>
            </Box>
          ) : (
            <List dense>
              {recentAlerts.map((alert, index) => (
                <React.Fragment key={alert.id || index}>
                  <ListItem
                    sx={{
                      py: 1,
                      px: 0,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getEventIcon(alert.eventType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {alert.eventType.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Chip
                            icon={getSeverityIcon(alert.severity)}
                            label={alert.severity}
                            size="small"
                            color={getSeverityColor(alert.severity)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(alert.timestamp)}
                          </Typography>
                          {alert.description && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {alert.description}
                            </Typography>
                          )}
                          {alert.confidence && (
                            <Typography variant="caption" color="textSecondary">
                              Confidence: {(alert.confidence * 100).toFixed(0)}%
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={() => onDismiss(alert.id)}
                      sx={{ ml: 1 }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < recentAlerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Collapse>

        {alerts.length > 10 && (
          <Box textAlign="center" mt={1}>
            <Typography variant="caption" color="textSecondary">
              Showing last 10 of {alerts.length} alerts
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertPanel;
