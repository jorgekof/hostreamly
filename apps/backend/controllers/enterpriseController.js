const db = require('../config/database');
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class EnterpriseController {
  // SLA Monitoring
  async getSLAMetrics(req, res) {
    try {
      const { userId } = req.user;
      const { period = '30d', metric_type = 'all' } = req.query;
      
      // Check if user has Enterprise plan
      const [userRows] = await db.execute(
        'SELECT plan FROM users WHERE id = ?',
        [userId]
      );
      
      if (!userRows[0] || userRows[0].plan !== 'Enterprise') {
        return res.status(403).json({
          error: 'SLA monitoring is only available for Enterprise plans'
        });
      }
      
      const cacheKey = `sla_metrics:${userId}:${period}:${metric_type}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const periodDays = this.parsePeriod(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      // Get SLA metrics
      const metrics = {
        uptime: await this.calculateUptime(userId, startDate),
        performance: await this.calculatePerformance(userId, startDate),
        availability: await this.calculateAvailability(userId, startDate),
        response_time: await this.calculateResponseTime(userId, startDate),
        error_rate: await this.calculateErrorRate(userId, startDate),
        sla_compliance: await this.calculateSLACompliance(userId, startDate)
      };
      
      // Filter by metric type if specified
      if (metric_type !== 'all') {
        const filteredMetrics = {};
        if (metrics[metric_type]) {
          filteredMetrics[metric_type] = metrics[metric_type];
        }
        metrics = filteredMetrics;
      }
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(metrics));
      
      res.json({
        success: true,
        data: metrics,
        period,
        generated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting SLA metrics:', error);
      res.status(500).json({ error: 'Failed to get SLA metrics' });
    }
  }
  
  async getSLAAlerts(req, res) {
    try {
      const { userId } = req.user;
      const { status = 'all', severity = 'all', limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT sa.*, sam.name as metric_name, sam.threshold_value, sam.threshold_operator
        FROM sla_alerts sa
        JOIN sla_alert_metrics sam ON sa.metric_id = sam.id
        WHERE sa.user_id = ?
      `;
      const params = [userId];
      
      if (status !== 'all') {
        query += ' AND sa.status = ?';
        params.push(status);
      }
      
      if (severity !== 'all') {
        query += ' AND sa.severity = ?';
        params.push(severity);
      }
      
      query += ' ORDER BY sa.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [alerts] = await db.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM sla_alerts WHERE user_id = ?';
      const countParams = [userId];
      
      if (status !== 'all') {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (severity !== 'all') {
        countQuery += ' AND severity = ?';
        countParams.push(severity);
      }
      
      const [countRows] = await db.execute(countQuery, countParams);
      
      res.json({
        success: true,
        data: alerts,
        pagination: {
          total: countRows[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countRows[0].total > parseInt(offset) + parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting SLA alerts:', error);
      res.status(500).json({ error: 'Failed to get SLA alerts' });
    }
  }
  
  async createSLAAlert(req, res) {
    try {
      const { userId } = req.user;
      const { metric_id, threshold_value, threshold_operator, severity, notification_channels } = req.body;
      
      const alertId = uuidv4();
      
      await db.execute(`
        INSERT INTO sla_alerts (
          id, user_id, metric_id, threshold_value, threshold_operator, 
          severity, notification_channels, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
      `, [
        alertId, userId, metric_id, threshold_value, threshold_operator,
        severity, JSON.stringify(notification_channels)
      ]);
      
      res.status(201).json({
        success: true,
        data: { id: alertId },
        message: 'SLA alert created successfully'
      });
      
    } catch (error) {
      console.error('Error creating SLA alert:', error);
      res.status(500).json({ error: 'Failed to create SLA alert' });
    }
  }
  
  // Account Management
  async getAccountOverview(req, res) {
    try {
      const { userId } = req.user;
      
      const cacheKey = `account_overview:${userId}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Get user details
      const [userRows] = await db.execute(`
        SELECT u.*, up.* FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `, [userId]);
      
      if (!userRows[0]) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userRows[0];
      
      // Get usage statistics
      const [usageRows] = await db.execute(`
        SELECT 
          SUM(storage_used) as total_storage,
          SUM(bandwidth_used) as total_bandwidth,
          COUNT(DISTINCT video_id) as total_videos,
          COUNT(DISTINCT livestream_id) as total_livestreams
        FROM (
          SELECT storage_used, bandwidth_used, id as video_id, NULL as livestream_id
          FROM videos WHERE user_id = ?
          UNION ALL
          SELECT 0 as storage_used, bandwidth_used, NULL as video_id, id as livestream_id
          FROM livestreams WHERE user_id = ?
        ) combined
      `, [userId, userId]);
      
      // Get billing information
      const [billingRows] = await db.execute(`
        SELECT * FROM billing_info WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `, [userId]);
      
      // Get recent activity
      const [activityRows] = await db.execute(`
        SELECT * FROM user_activity_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [userId]);
      
      // Get team members (if applicable)
      const [teamRows] = await db.execute(`
        SELECT tm.*, u.email, u.first_name, u.last_name
        FROM team_members tm
        JOIN users u ON tm.member_user_id = u.id
        WHERE tm.owner_user_id = ? AND tm.status = 'active'
      `, [userId]);
      
      const overview = {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          plan: user.plan,
          status: user.status,
          created_at: user.created_at,
          last_login: user.last_login,
          company_name: user.company_name,
          phone: user.phone,
          timezone: user.timezone
        },
        usage: {
          storage: {
            used: usageRows[0]?.total_storage || 0,
            limit: this.getStorageLimit(user.plan),
            percentage: this.calculateUsagePercentage(usageRows[0]?.total_storage || 0, this.getStorageLimit(user.plan))
          },
          bandwidth: {
            used: usageRows[0]?.total_bandwidth || 0,
            limit: this.getBandwidthLimit(user.plan),
            percentage: this.calculateUsagePercentage(usageRows[0]?.total_bandwidth || 0, this.getBandwidthLimit(user.plan))
          },
          videos: usageRows[0]?.total_videos || 0,
          livestreams: usageRows[0]?.total_livestreams || 0
        },
        billing: billingRows[0] || null,
        recent_activity: activityRows,
        team_members: teamRows,
        account_health: await this.calculateAccountHealth(userId)
      };
      
      // Cache for 10 minutes
      await redis.setex(cacheKey, 600, JSON.stringify(overview));
      
      res.json({
        success: true,
        data: overview
      });
      
    } catch (error) {
      console.error('Error getting account overview:', error);
      res.status(500).json({ error: 'Failed to get account overview' });
    }
  }
  
  async getTeamMembers(req, res) {
    try {
      const { userId } = req.user;
      const { status = 'all', role = 'all', limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT tm.*, u.email, u.first_name, u.last_name, u.last_login,
               up.avatar_url, up.phone, up.timezone
        FROM team_members tm
        JOIN users u ON tm.member_user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE tm.owner_user_id = ?
      `;
      const params = [userId];
      
      if (status !== 'all') {
        query += ' AND tm.status = ?';
        params.push(status);
      }
      
      if (role !== 'all') {
        query += ' AND tm.role = ?';
        params.push(role);
      }
      
      query += ' ORDER BY tm.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [members] = await db.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM team_members WHERE owner_user_id = ?';
      const countParams = [userId];
      
      if (status !== 'all') {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (role !== 'all') {
        countQuery += ' AND role = ?';
        countParams.push(role);
      }
      
      const [countRows] = await db.execute(countQuery, countParams);
      
      res.json({
        success: true,
        data: members,
        pagination: {
          total: countRows[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countRows[0].total > parseInt(offset) + parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting team members:', error);
      res.status(500).json({ error: 'Failed to get team members' });
    }
  }
  
  async inviteTeamMember(req, res) {
    try {
      const { userId } = req.user;
      const { email, role, permissions } = req.body;
      
      // Check if user already exists
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      let memberUserId;
      
      if (existingUser[0]) {
        memberUserId = existingUser[0].id;
        
        // Check if already a team member
        const [existingMember] = await db.execute(
          'SELECT id FROM team_members WHERE owner_user_id = ? AND member_user_id = ?',
          [userId, memberUserId]
        );
        
        if (existingMember[0]) {
          return res.status(400).json({ error: 'User is already a team member' });
        }
      } else {
        // Create pending user
        memberUserId = uuidv4();
        await db.execute(`
          INSERT INTO users (id, email, status, plan, created_at)
          VALUES (?, ?, 'pending', 'Basic', NOW())
        `, [memberUserId, email]);
      }
      
      const inviteId = uuidv4();
      const inviteToken = uuidv4();
      
      // Create team member invitation
      await db.execute(`
        INSERT INTO team_members (
          id, owner_user_id, member_user_id, role, permissions,
          status, invite_token, invited_at, created_at
        ) VALUES (?, ?, ?, ?, ?, 'invited', ?, NOW(), NOW())
      `, [
        inviteId, userId, memberUserId, role, JSON.stringify(permissions), inviteToken
      ]);
      
      // Send invitation email
      await this.sendTeamInvitationEmail(email, inviteToken, role);
      
      res.status(201).json({
        success: true,
        data: { id: inviteId, invite_token: inviteToken },
        message: 'Team member invitation sent successfully'
      });
      
    } catch (error) {
      console.error('Error inviting team member:', error);
      res.status(500).json({ error: 'Failed to invite team member' });
    }
  }
  
  async updateTeamMember(req, res) {
    try {
      const { userId } = req.user;
      const { memberId } = req.params;
      const { role, permissions, status } = req.body;
      
      // Verify ownership
      const [memberRows] = await db.execute(
        'SELECT * FROM team_members WHERE id = ? AND owner_user_id = ?',
        [memberId, userId]
      );
      
      if (!memberRows[0]) {
        return res.status(404).json({ error: 'Team member not found' });
      }
      
      const updates = [];
      const params = [];
      
      if (role) {
        updates.push('role = ?');
        params.push(role);
      }
      
      if (permissions) {
        updates.push('permissions = ?');
        params.push(JSON.stringify(permissions));
      }
      
      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }
      
      updates.push('updated_at = NOW()');
      params.push(memberId, userId);
      
      await db.execute(`
        UPDATE team_members 
        SET ${updates.join(', ')}
        WHERE id = ? AND owner_user_id = ?
      `, params);
      
      res.json({
        success: true,
        message: 'Team member updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating team member:', error);
      res.status(500).json({ error: 'Failed to update team member' });
    }
  }
  
  async removeTeamMember(req, res) {
    try {
      const { userId } = req.user;
      const { memberId } = req.params;
      
      // Verify ownership and get member details
      const [memberRows] = await db.execute(
        'SELECT * FROM team_members WHERE id = ? AND owner_user_id = ?',
        [memberId, userId]
      );
      
      if (!memberRows[0]) {
        return res.status(404).json({ error: 'Team member not found' });
      }
      
      // Remove team member
      await db.execute(
        'DELETE FROM team_members WHERE id = ? AND owner_user_id = ?',
        [memberId, userId]
      );
      
      // Log activity
      await this.logUserActivity(userId, 'team_member_removed', {
        member_id: memberId,
        member_user_id: memberRows[0].member_user_id
      });
      
      res.json({
        success: true,
        message: 'Team member removed successfully'
      });
      
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  }
  
  // Enterprise Reports
  async generateEnterpriseReport(req, res) {
    try {
      const { userId } = req.user;
      const { report_type, period, format = 'json', include_charts = false } = req.body;
      
      const reportId = uuidv4();
      const periodDays = this.parsePeriod(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      let reportData;
      
      switch (report_type) {
        case 'sla_compliance':
          reportData = await this.generateSLAComplianceReport(userId, startDate);
          break;
        case 'account_usage':
          reportData = await this.generateAccountUsageReport(userId, startDate);
          break;
        case 'team_activity':
          reportData = await this.generateTeamActivityReport(userId, startDate);
          break;
        case 'security_audit':
          reportData = await this.generateSecurityAuditReport(userId, startDate);
          break;
        case 'performance_analysis':
          reportData = await this.generatePerformanceAnalysisReport(userId, startDate);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }
      
      // Save report to database
      await db.execute(`
        INSERT INTO enterprise_reports (
          id, user_id, report_type, period, format, data, 
          include_charts, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
      `, [
        reportId, userId, report_type, period, format, 
        JSON.stringify(reportData), include_charts
      ]);
      
      // Generate file if requested
      let fileUrl = null;
      if (format !== 'json') {
        fileUrl = await this.generateReportFile(reportId, reportData, format, include_charts);
      }
      
      res.json({
        success: true,
        data: {
          report_id: reportId,
          report_type,
          period,
          format,
          file_url: fileUrl,
          data: format === 'json' ? reportData : null,
          generated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Error generating enterprise report:', error);
      res.status(500).json({ error: 'Failed to generate enterprise report' });
    }
  }
  
  // Helper Methods
  parsePeriod(period) {
    const match = period.match(/(\d+)([dwmy])/i);
    if (!match) return 30;
    
    const [, num, unit] = match;
    const multipliers = { d: 1, w: 7, m: 30, y: 365 };
    return parseInt(num) * (multipliers[unit.toLowerCase()] || 1);
  }
  
  async calculateUptime(userId, startDate) {
    // Implementation for uptime calculation
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as successful_checks
      FROM uptime_checks 
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate]);
    
    const { total_checks, successful_checks } = rows[0] || { total_checks: 0, successful_checks: 0 };
    return {
      percentage: total_checks > 0 ? (successful_checks / total_checks) * 100 : 100,
      total_checks,
      successful_checks,
      failed_checks: total_checks - successful_checks
    };
  }
  
  async calculatePerformance(userId, startDate) {
    // Implementation for performance calculation
    const [rows] = await db.execute(`
      SELECT 
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time
      FROM performance_metrics 
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate]);
    
    return rows[0] || {
      avg_response_time: 0,
      min_response_time: 0,
      max_response_time: 0,
      p95_response_time: 0
    };
  }
  
  async calculateAvailability(userId, startDate) {
    // Implementation for availability calculation
    const [rows] = await db.execute(`
      SELECT 
        SUM(CASE WHEN available = 1 THEN duration_minutes ELSE 0 END) as available_minutes,
        SUM(duration_minutes) as total_minutes
      FROM availability_logs 
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate]);
    
    const { available_minutes, total_minutes } = rows[0] || { available_minutes: 0, total_minutes: 0 };
    return {
      percentage: total_minutes > 0 ? (available_minutes / total_minutes) * 100 : 100,
      available_minutes,
      unavailable_minutes: total_minutes - available_minutes,
      total_minutes
    };
  }
  
  async calculateResponseTime(userId, startDate) {
    // Implementation for response time calculation
    const [rows] = await db.execute(`
      SELECT 
        AVG(response_time_ms) as avg_response_time,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as median_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time
      FROM api_response_times 
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate]);
    
    return rows[0] || {
      avg_response_time: 0,
      median_response_time: 0,
      p95_response_time: 0,
      p99_response_time: 0
    };
  }
  
  async calculateErrorRate(userId, startDate) {
    // Implementation for error rate calculation
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_requests
      FROM api_logs 
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate]);
    
    const { total_requests, error_requests } = rows[0] || { total_requests: 0, error_requests: 0 };
    return {
      percentage: total_requests > 0 ? (error_requests / total_requests) * 100 : 0,
      total_requests,
      error_requests,
      success_requests: total_requests - error_requests
    };
  }
  
  async calculateSLACompliance(userId, startDate) {
    // Implementation for SLA compliance calculation
    const uptime = await this.calculateUptime(userId, startDate);
    const performance = await this.calculatePerformance(userId, startDate);
    const availability = await this.calculateAvailability(userId, startDate);
    const errorRate = await this.calculateErrorRate(userId, startDate);
    
    // Define SLA thresholds
    const slaThresholds = {
      uptime: 99.9,
      availability: 99.9,
      response_time: 200, // ms
      error_rate: 0.1 // %
    };
    
    const compliance = {
      uptime: uptime.percentage >= slaThresholds.uptime,
      availability: availability.percentage >= slaThresholds.availability,
      response_time: performance.avg_response_time <= slaThresholds.response_time,
      error_rate: errorRate.percentage <= slaThresholds.error_rate
    };
    
    const totalMetrics = Object.keys(compliance).length;
    const compliantMetrics = Object.values(compliance).filter(Boolean).length;
    
    return {
      overall_compliance: (compliantMetrics / totalMetrics) * 100,
      individual_compliance: compliance,
      thresholds: slaThresholds,
      compliant_metrics: compliantMetrics,
      total_metrics: totalMetrics
    };
  }
  
  getStorageLimit(plan) {
    const limits = {
      'Basic': 10 * 1024 * 1024 * 1024, // 10GB
      'Professional': 100 * 1024 * 1024 * 1024, // 100GB
      'Enterprise': 1000 * 1024 * 1024 * 1024 // 1TB
    };
    return limits[plan] || limits['Basic'];
  }
  
  getBandwidthLimit(plan) {
    const limits = {
      'Basic': 100 * 1024 * 1024 * 1024, // 100GB
      'Professional': 1000 * 1024 * 1024 * 1024, // 1TB
      'Enterprise': 10000 * 1024 * 1024 * 1024 // 10TB
    };
    return limits[plan] || limits['Basic'];
  }
  
  calculateUsagePercentage(used, limit) {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  }
  
  async calculateAccountHealth(userId) {
    // Implementation for account health calculation
    const [rows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM videos WHERE user_id = ? AND status = 'active') as active_videos,
        (SELECT COUNT(*) FROM videos WHERE user_id = ? AND status = 'error') as error_videos,
        (SELECT COUNT(*) FROM livestreams WHERE user_id = ? AND status = 'active') as active_streams,
        (SELECT AVG(rating) FROM video_ratings vr JOIN videos v ON vr.video_id = v.id WHERE v.user_id = ?) as avg_rating,
        (SELECT COUNT(*) FROM api_logs WHERE user_id = ? AND status_code >= 400 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_errors
    `, [userId, userId, userId, userId, userId]);
    
    const stats = rows[0] || {};
    
    let score = 100;
    
    // Deduct points for errors
    if (stats.error_videos > 0) score -= Math.min(stats.error_videos * 5, 20);
    if (stats.recent_errors > 10) score -= Math.min((stats.recent_errors - 10) * 2, 30);
    
    // Add points for good metrics
    if (stats.avg_rating > 4) score += 5;
    if (stats.active_videos > 10) score += 5;
    
    return {
      score: Math.max(score, 0),
      status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor',
      metrics: stats
    };
  }
  
  async sendTeamInvitationEmail(email, inviteToken, role) {
    // Implementation for sending team invitation email
    const transporter = nodemailer.createTransporter({
      // Email configuration
    });
    
    const inviteUrl = `${process.env.FRONTEND_URL}/team/accept-invite?token=${inviteToken}`;
    
    await transporter.sendMail({
      to: email,
      subject: 'Team Invitation - Hostreamly Media',
      html: `
        <h2>You've been invited to join a team!</h2>
        <p>You've been invited to join as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
      `
    });
  }
  
  async logUserActivity(userId, action, details = {}) {
    await db.execute(`
      INSERT INTO user_activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [uuidv4(), userId, action, JSON.stringify(details)]);
  }
  
  async generateSLAComplianceReport(userId, startDate) {
    // Implementation for SLA compliance report generation
    const slaMetrics = await this.calculateSLACompliance(userId, startDate);
    
    return {
      report_type: 'sla_compliance',
      period: { start: startDate, end: new Date() },
      summary: slaMetrics,
      detailed_metrics: {
        uptime: await this.calculateUptime(userId, startDate),
        performance: await this.calculatePerformance(userId, startDate),
        availability: await this.calculateAvailability(userId, startDate),
        error_rate: await this.calculateErrorRate(userId, startDate)
      }
    };
  }
  
  async generateAccountUsageReport(userId, startDate) {
    // Implementation for account usage report generation
    const [usageRows] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(storage_used) as daily_storage,
        SUM(bandwidth_used) as daily_bandwidth,
        COUNT(DISTINCT video_id) as daily_videos
      FROM (
        SELECT created_at, storage_used, bandwidth_used, id as video_id
        FROM videos WHERE user_id = ? AND created_at >= ?
        UNION ALL
        SELECT created_at, 0 as storage_used, bandwidth_used, NULL as video_id
        FROM livestreams WHERE user_id = ? AND created_at >= ?
      ) combined
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId, startDate, userId, startDate]);
    
    return {
      report_type: 'account_usage',
      period: { start: startDate, end: new Date() },
      daily_usage: usageRows,
      totals: {
        storage: usageRows.reduce((sum, row) => sum + (row.daily_storage || 0), 0),
        bandwidth: usageRows.reduce((sum, row) => sum + (row.daily_bandwidth || 0), 0),
        videos: usageRows.reduce((sum, row) => sum + (row.daily_videos || 0), 0)
      }
    };
  }
  
  async generateTeamActivityReport(userId, startDate) {
    // Implementation for team activity report generation
    const [activityRows] = await db.execute(`
      SELECT 
        tm.member_user_id,
        u.email,
        u.first_name,
        u.last_name,
        tm.role,
        COUNT(ual.id) as total_activities,
        MAX(ual.created_at) as last_activity
      FROM team_members tm
      JOIN users u ON tm.member_user_id = u.id
      LEFT JOIN user_activity_logs ual ON tm.member_user_id = ual.user_id AND ual.created_at >= ?
      WHERE tm.owner_user_id = ? AND tm.status = 'active'
      GROUP BY tm.member_user_id, u.email, u.first_name, u.last_name, tm.role
    `, [startDate, userId]);
    
    return {
      report_type: 'team_activity',
      period: { start: startDate, end: new Date() },
      team_members: activityRows,
      summary: {
        total_members: activityRows.length,
        active_members: activityRows.filter(member => member.total_activities > 0).length,
        total_activities: activityRows.reduce((sum, member) => sum + member.total_activities, 0)
      }
    };
  }
  
  async generateSecurityAuditReport(userId, startDate) {
    // Implementation for security audit report generation
    const [securityRows] = await db.execute(`
      SELECT 
        action,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM security_logs 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY action
    `, [userId, startDate]);
    
    return {
      report_type: 'security_audit',
      period: { start: startDate, end: new Date() },
      security_events: securityRows,
      summary: {
        total_events: securityRows.reduce((sum, event) => sum + event.count, 0),
        event_types: securityRows.length,
        high_risk_events: securityRows.filter(event => 
          ['failed_login', 'suspicious_activity', 'unauthorized_access'].includes(event.action)
        ).reduce((sum, event) => sum + event.count, 0)
      }
    };
  }
  
  async generatePerformanceAnalysisReport(userId, startDate) {
    // Implementation for performance analysis report generation
    const [performanceRows] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        AVG(response_time_ms) as avg_response_time,
        MIN(response_time_ms) as min_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(*) as total_requests
      FROM api_logs 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId, startDate]);
    
    return {
      report_type: 'performance_analysis',
      period: { start: startDate, end: new Date() },
      daily_performance: performanceRows,
      summary: {
        avg_response_time: performanceRows.reduce((sum, row) => sum + row.avg_response_time, 0) / performanceRows.length,
        total_requests: performanceRows.reduce((sum, row) => sum + row.total_requests, 0),
        best_day: performanceRows.reduce((best, row) => 
          !best || row.avg_response_time < best.avg_response_time ? row : best, null
        ),
        worst_day: performanceRows.reduce((worst, row) => 
          !worst || row.avg_response_time > worst.avg_response_time ? row : worst, null
        )
      }
    };
  }
  
  async generateReportFile(reportId, reportData, format, includeCharts) {
    const fileName = `enterprise_report_${reportId}.${format}`;
    const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);
    
    switch (format) {
      case 'excel':
        await this.generateExcelReport(filePath, reportData, includeCharts);
        break;
      case 'pdf':
        await this.generatePDFReport(filePath, reportData, includeCharts);
        break;
      case 'csv':
        await this.generateCSVReport(filePath, reportData);
        break;
    }
    
    return `/reports/${fileName}`;
  }
  
  async generateExcelReport(filePath, reportData, includeCharts) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Enterprise Report');
    
    // Add report data to worksheet
    worksheet.addRow(['Report Type', reportData.report_type]);
    worksheet.addRow(['Period Start', reportData.period.start]);
    worksheet.addRow(['Period End', reportData.period.end]);
    worksheet.addRow([]);
    
    // Add summary data
    if (reportData.summary) {
      worksheet.addRow(['Summary']);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        worksheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
      });
    }
    
    await workbook.xlsx.writeFile(filePath);
  }
  
  async generatePDFReport(filePath, reportData, includeCharts) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20).text('Enterprise Report', 100, 100);
    doc.fontSize(12).text(`Report Type: ${reportData.report_type}`, 100, 140);
    doc.text(`Period: ${reportData.period.start} to ${reportData.period.end}`, 100, 160);
    
    // Add summary data
    if (reportData.summary) {
      doc.text('Summary:', 100, 200);
      let yPosition = 220;
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`, 100, yPosition);
        yPosition += 20;
      });
    }
    
    doc.end();
  }
  
  async generateCSVReport(filePath, reportData) {
    let csvContent = 'Report Type,Period Start,Period End\n';
    csvContent += `${reportData.report_type},${reportData.period.start},${reportData.period.end}\n\n`;
    
    if (reportData.summary) {
      csvContent += 'Summary\n';
      Object.entries(reportData.summary).forEach(([key, value]) => {
        csvContent += `${key},${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
      });
    }
    
    await fs.writeFile(filePath, csvContent);
  }
}

module.exports = new EnterpriseController();