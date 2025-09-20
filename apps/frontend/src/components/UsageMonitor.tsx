import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  AlertTitle,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  TextField,
  Divider
} from '@mui/material';
import {
  Storage as StorageIcon,
  VideoLibrary as VideoIcon,
  LiveTv as LiveIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Upgrade as UpgradeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimits } from '../hooks/usePlanLimits';

interface UsageData {
  plan: {
    name: string;
    limits: {
      storage: { limit: number; unit: string; unlimited: boolean };
      bandwidth: { limit: number; unit: string; unlimited: boolean };
      videos: { limit: number; unlimited: boolean };
      users: { limit: number };
      liveStreamingHours: { limit: number; unit: string };
      viewingHours: { limit: number; unit: string };
      maxConcurrentViewers: { limit: number };
    };
  };
  usage: {
    storage: { used: number; percentage: number; unit: string };
    videos: { used: number; percentage: number };
    liveStreamingHours: { used: number; percentage: number; unit: string };
    bandwidth: { used: number; unit: string };
  };
  alerts: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    percentage: number;
  }>;
  hasAlerts: boolean;
  timestamp: string;
}

interface NotificationSettings {
  emailAlerts: boolean;
  thresholds: {
    storage: number;
    videos: number;
    liveStreaming: number;
  };
  frequency: 'daily' | 'weekly' | 'monthly';
}

const UsageMonitor: React.FC = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    thresholds: { storage: 80, videos: 90, liveStreaming: 85 },
    frequency: 'daily'
  });

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usage/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      setUsageData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading usage data');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    try {
      const response = await fetch('/api/usage/notifications/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      setNotificationSettings(settings);
      setSettingsOpen(false);
    } catch (err) {
      console.error('Error updating notification settings:', err);
    }
  };

  useEffect(() => {
    fetchUsageData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'primary';
  };

  const getAlertIcon = (severity: 'warning' | 'critical') => {
    return severity === 'critical' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />;
  };

  const formatBytes = (bytes: number, unit: string = 'GB') => {
    return `${bytes.toFixed(2)} ${unit}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading usage data...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
          <Button onClick={fetchUsageData} sx={{ mt: 1 }}>Retry</Button>
        </Alert>
      </Box>
    );
  }

  if (!usageData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No usage data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Usage Monitor
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsageData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Plan Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Current Plan: {usageData.plan.name.charAt(0).toUpperCase() + usageData.plan.name.slice(1)}
            </Typography>
            <Button
              variant="contained"
              startIcon={<UpgradeIcon />}
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade Plan
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {usageData.hasAlerts && (
        <Box sx={{ mb: 3 }}>
          {usageData.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity}
              icon={getAlertIcon(alert.severity)}
              sx={{ mb: 1 }}
            >
              <AlertTitle>
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
              </AlertTitle>
              {alert.message} ({alert.percentage}% used)
            </Alert>
          ))}
        </Box>
      )}

      {/* Usage Cards */}
      <Grid container spacing={3}>
        {/* Storage Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Storage</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatBytes(usageData.usage.storage.used, usageData.usage.storage.unit)} of{' '}
                {usageData.plan.limits.storage.unlimited 
                  ? 'Unlimited' 
                  : formatBytes(usageData.plan.limits.storage.limit, usageData.plan.limits.storage.unit)
                }
              </Typography>
              {!usageData.plan.limits.storage.unlimited && (
                <LinearProgress
                  variant="determinate"
                  value={usageData.usage.storage.percentage}
                  color={getProgressColor(usageData.usage.storage.percentage)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {usageData.usage.storage.percentage.toFixed(1)}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Videos Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideoIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Videos</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {usageData.usage.videos.used} of{' '}
                {usageData.plan.limits.videos.unlimited 
                  ? 'Unlimited' 
                  : usageData.plan.limits.videos.limit
                } videos
              </Typography>
              {!usageData.plan.limits.videos.unlimited && (
                <LinearProgress
                  variant="determinate"
                  value={usageData.usage.videos.percentage}
                  color={getProgressColor(usageData.usage.videos.percentage)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {usageData.usage.videos.percentage.toFixed(1)}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Streaming Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LiveIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Live Streaming</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {usageData.usage.liveStreamingHours.used} of {usageData.plan.limits.liveStreamingHours.limit} hours this month
              </Typography>
              <LinearProgress
                variant="determinate"
                value={usageData.usage.liveStreamingHours.percentage}
                color={getProgressColor(usageData.usage.liveStreamingHours.percentage)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {usageData.usage.liveStreamingHours.percentage.toFixed(1)}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bandwidth Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Bandwidth</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatBytes(usageData.usage.bandwidth.used, usageData.usage.bandwidth.unit)} this month
              </Typography>
              {!usageData.plan.limits.bandwidth.unlimited && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Limit: {formatBytes(usageData.plan.limits.bandwidth.limit, usageData.plan.limits.bandwidth.unit)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.emailAlerts}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailAlerts: e.target.checked
                  })}
                />
              }
              label="Email Alerts"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Alert Thresholds (%)
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="Storage"
                  type="number"
                  size="small"
                  value={notificationSettings.thresholds.storage}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    thresholds: {
                      ...notificationSettings.thresholds,
                      storage: parseInt(e.target.value)
                    }
                  })}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Videos"
                  type="number"
                  size="small"
                  value={notificationSettings.thresholds.videos}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    thresholds: {
                      ...notificationSettings.thresholds,
                      videos: parseInt(e.target.value)
                    }
                  })}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Live Streaming"
                  type="number"
                  size="small"
                  value={notificationSettings.thresholds.liveStreaming}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    thresholds: {
                      ...notificationSettings.thresholds,
                      liveStreaming: parseInt(e.target.value)
                    }
                  })}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => updateNotificationSettings(notificationSettings)}
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsageMonitor;