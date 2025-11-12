"""
Monitoring API Endpoints
Provides access to application metrics and monitoring data
"""

from flask import Blueprint, jsonify, request, g
from functools import wraps
from src.services.monitoring import monitoring_service
from src.models.user import User
import os

monitoring_bp = Blueprint('monitoring', __name__)

def get_current_user():
    """Get current user from token"""
    # Assuming user is already loaded into g.user by an authentication middleware
    # If not, we'll try to verify the token here as a fallback
    if hasattr(g, 'user') and g.user:
        return g.user
        
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        # NOTE: User.verify_token needs to be implemented in src.models.user
        # Assuming it is implemented and works correctly
        user = User.verify_token(token)
        if user:
            # Set user in g for other middlewares/endpoints
            g.user = user
            g.user_id = user.id
            return user
    return None

def admin_required(f):
    """Decorator to require admin access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        if user.role not in ["admin", "main_admin"]:
            return jsonify({"error": "Admin access required"}), 403
        
        return f(user, *args, **kwargs)
    return decorated_function


@monitoring_bp.route('/api/monitoring/dashboard', methods=['GET'])
@admin_required
def get_monitoring_dashboard(current_user):
    """Get comprehensive monitoring dashboard"""
    try:
        metrics = monitoring_service.get_dashboard_metrics()
        return jsonify({
            "success": True,
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/endpoints', methods=['GET'])
@admin_required
def get_endpoint_metrics(current_user):
    """Get metrics for all endpoints"""
    try:
        metrics = monitoring_service.get_endpoint_metrics()
        return jsonify({
            "success": True,
            "endpoints": metrics
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/requests', methods=['GET'])
@admin_required
def get_recent_requests(current_user):
    """Get recent requests"""
    try:
        limit = request.args.get('limit', 100, type=int)
        requests = monitoring_service.get_recent_requests(limit)
        
        return jsonify({
            "success": True,
            "requests": requests,
            "total": len(requests)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/errors', methods=['GET'])
@admin_required
def get_recent_errors(current_user):
    """Get recent errors"""
    try:
        limit = request.args.get('limit', 50, type=int)
        errors = monitoring_service.get_recent_errors(limit)
        
        return jsonify({
            "success": True,
            "errors": errors,
            "total": len(errors)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/system', methods=['GET'])
@admin_required
def get_system_metrics(current_user):
    """Get current system metrics"""
    try:
        metrics = monitoring_service.get_system_metrics()
        return jsonify({
            "success": True,
            "system": metrics
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/timeseries', methods=['GET'])
@admin_required
def get_timeseries_data(current_user):
    """Get time series data for charts"""
    try:
        metric = request.args.get('metric', 'requests')
        hours = request.args.get('hours', 24, type=int)
        
        data = monitoring_service.get_time_series_data(metric, hours)
        
        return jsonify({
            "success": True,
            "metric": metric,
            "hours": hours,
            "data": data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitoring_bp.route('/api/monitoring/health', methods=['GET'])
def health_check():
    """Public health check endpoint"""
    try:
        metrics = monitoring_service.get_system_metrics()
        
        # Determine health status
        health_status = "healthy"
        issues = []
        
        if metrics.get('cpu', {}).get('percent', 0) > 90:
            health_status = "degraded"
            issues.append("High CPU usage")
        
        if metrics.get('memory', {}).get('percent', 0) > 90:
            health_status = "degraded"
            issues.append("High memory usage")
        
        if metrics.get('disk', {}).get('percent', 0) > 90:
            health_status = "degraded"
            issues.append("High disk usage")
        
        # Get uptime from monitoring service
        uptime_hours = monitoring_service.get_dashboard_metrics()["overview"]["uptime_hours"]
        
        return jsonify({
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_hours": uptime_hours,
            "issues": issues,
            "metrics": {
                "cpu_percent": metrics.get('cpu', {}).get('percent', 0),
                "memory_percent": metrics.get('memory', {}).get('percent', 0),
                "disk_percent": metrics.get('disk', {}).get('percent', 0)
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 503
