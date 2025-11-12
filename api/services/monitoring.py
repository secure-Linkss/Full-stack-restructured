"""
Comprehensive Monitoring Service
Tracks application metrics, errors, and performance
"""

import os
import time
import psutil
import traceback
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
import json
import threading
from flask import request, g

class MonitoringService:
    """
    Comprehensive monitoring service for tracking:
    - Request metrics (count, latency, errors)
    - System metrics (CPU, memory, disk)
    - Database metrics (connections, query times)
    - Custom business metrics
    """
    
    def __init__(self):
        self.metrics = defaultdict(lambda: {
            "count": 0,
            "errors": 0,
            "total_time": 0,
            "min_time": float('inf'),
            "max_time": 0,
            "last_error": None,
            "error_details": deque(maxlen=100)
        })
        
        self.request_history = deque(maxlen=1000)
        self.error_history = deque(maxlen=500)
        self.system_metrics_history = deque(maxlen=100)
        
        self.start_time = datetime.utcnow()
        self.lock = threading.Lock()
        
        # Start background metric collection
        self._start_background_collection()
    
    def _start_background_collection(self):
        """Start background thread for system metrics collection"""
        def collect_system_metrics():
            while True:
                try:
                    metrics = self.get_system_metrics()
                    with self.lock:
                        self.system_metrics_history.append({
                            "timestamp": datetime.utcnow().isoformat(),
                            "metrics": metrics
                        })
                    time.sleep(60)  # Collect every minute
                except Exception as e:
                    print(f"Error collecting system metrics: {e}")
                    time.sleep(60)
        
        thread = threading.Thread(target=collect_system_metrics, daemon=True)
        thread.start()
    
    def record_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration: float,
        user_id: Optional[int] = None,
        error: Optional[Exception] = None
    ):
        """Record a request with its metrics"""
        with self.lock:
            key = f"{method}:{endpoint}"
            
            # Update metrics
            self.metrics[key]["count"] += 1
            self.metrics[key]["total_time"] += duration
            self.metrics[key]["min_time"] = min(self.metrics[key]["min_time"], duration)
            self.metrics[key]["max_time"] = max(self.metrics[key]["max_time"], duration)
            
            if status_code >= 400:
                self.metrics[key]["errors"] += 1
            
            if error:
                self.metrics[key]["last_error"] = str(error)
                error_detail = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(error),
                    "traceback": traceback.format_exc(),
                    "endpoint": endpoint,
                    "method": method,
                    "user_id": user_id
                }
                self.metrics[key]["error_details"].append(error_detail)
                self.error_history.append(error_detail)
            
            # Add to request history
            self.request_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "duration": duration,
                "user_id": user_id,
                "error": str(error) if error else None
            })
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        try:
            # Use interval=None for non-blocking call, as we call it in a background thread
            cpu_percent = psutil.cpu_percent(interval=None) 
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count()
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": disk.percent
                },
                "network": self._get_network_stats()
            }
        except Exception as e:
            print(f"Error getting system metrics: {e}")
            return {}
    
    def _get_network_stats(self) -> Dict[str, int]:
        """Get network statistics"""
        try:
            net_io = psutil.net_io_counters()
            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv
            }
        except:
            return {}
    
    def get_endpoint_metrics(self, endpoint: Optional[str] = None) -> Dict[str, Any]:
        """Get metrics for specific endpoint or all endpoints"""
        with self.lock:
            if endpoint:
                return dict(self.metrics.get(endpoint, {}))
            
            # Return all metrics
            result = {}
            for key, metrics in self.metrics.items():
                avg_time = metrics["total_time"] / metrics["count"] if metrics["count"] > 0 else 0
                result[key] = {
                    "count": metrics["count"],
                    "errors": metrics["errors"],
                    "error_rate": metrics["errors"] / metrics["count"] if metrics["count"] > 0 else 0,
                    "avg_time": avg_time,
                    "min_time": metrics["min_time"] if metrics["min_time"] != float('inf') else 0,
                    "max_time": metrics["max_time"],
                    "last_error": metrics["last_error"]
                }
            
            return result
    
    def get_recent_requests(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent requests"""
        with self.lock:
            # Return in reverse chronological order (most recent first)
            return list(self.request_history)[::-1][:limit]
    
    def get_recent_errors(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent errors"""
        with self.lock:
            # Return in reverse chronological order (most recent first)
            return list(self.error_history)[::-1][:limit]
    
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get comprehensive dashboard metrics"""
        with self.lock:
            total_requests = sum(m["count"] for m in self.metrics.values())
            total_errors = sum(m["errors"] for m in self.metrics.values())
            
            # Calculate uptime
            uptime_seconds = (datetime.utcnow() - self.start_time).total_seconds()
            
            # Get recent request stats (last hour)
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_requests = [
                r for r in self.request_history
                if datetime.fromisoformat(r["timestamp"]) > one_hour_ago
            ]
            
            requests_last_hour = len(recent_requests)
            errors_last_hour = sum(1 for r in recent_requests if r["status_code"] >= 400)
            
            # Calculate average response time
            if recent_requests:
                avg_response_time = sum(r["duration"] for r in recent_requests) / len(recent_requests)
            else:
                avg_response_time = 0
            
            # Get system metrics
            system_metrics = self.get_system_metrics()
            
            return {
                "overview": {
                    "total_requests": total_requests,
                    "total_errors": total_errors,
                    "error_rate": total_errors / total_requests if total_requests > 0 else 0,
                    "uptime_seconds": uptime_seconds,
                    "uptime_hours": uptime_seconds / 3600,
                    "start_time": self.start_time.isoformat()
                },
                "recent": {
                    "requests_last_hour": requests_last_hour,
                    "errors_last_hour": errors_last_hour,
                    "avg_response_time": avg_response_time,
                    "requests_per_minute": requests_last_hour / 60 if requests_last_hour > 0 else 0
                },
                "system": system_metrics,
                "top_endpoints": self._get_top_endpoints(),
                "slowest_endpoints": self._get_slowest_endpoints()
            }
    
    def _get_top_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get endpoints with most requests"""
        sorted_endpoints = sorted(
            self.metrics.items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )[:limit]
        
        return [
            {
                "endpoint": endpoint,
                "count": metrics["count"],
                "errors": metrics["errors"],
                "error_rate": metrics["errors"] / metrics["count"] if metrics["count"] > 0 else 0
            }
            for endpoint, metrics in sorted_endpoints
        ]
    
    def _get_slowest_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get slowest endpoints by average response time"""
        endpoints_with_avg = [
            (
                endpoint,
                metrics["total_time"] / metrics["count"] if metrics["count"] > 0 else 0,
                metrics["count"]
            )
            for endpoint, metrics in self.metrics.items()
            if metrics["count"] > 0
        ]
        
        sorted_endpoints = sorted(
            endpoints_with_avg,
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        return [
            {
                "endpoint": endpoint,
                "avg_time": avg_time,
                "count": count
            }
            for endpoint, avg_time, count in sorted_endpoints
        ]
    
    def get_time_series_data(self, metric: str = "requests", hours: int = 24) -> List[Dict[str, Any]]:
        """Get time series data for charts"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        if metric == "requests":
            data = [
                r for r in self.request_history
                if datetime.fromisoformat(r["timestamp"]) > cutoff_time
            ]
            
            # Group by hour
            hourly_data = defaultdict(int)
            for request in data:
                hour = datetime.fromisoformat(request["timestamp"]).replace(
                    minute=0, second=0, microsecond=0
                )
                hourly_data[hour] += 1
            
            return [
                {"timestamp": hour.isoformat(), "value": count}
                for hour, count in sorted(hourly_data.items())
            ]
        
        elif metric == "errors":
            data = [
                r for r in self.request_history
                if datetime.fromisoformat(r["timestamp"]) > cutoff_time and r["status_code"] >= 400
            ]
            
            # Group by hour
            hourly_data = defaultdict(int)
            for request in data:
                hour = datetime.fromisoformat(request["timestamp"]).replace(
                    minute=0, second=0, microsecond=0
                )
                hourly_data[hour] += 1
            
            return [
                {"timestamp": hour.isoformat(), "value": count}
                for hour, count in sorted(hourly_data.items())
            ]
        
        elif metric == "cpu":
            data = [
                d for d in self.system_metrics_history
                if datetime.fromisoformat(d["timestamp"]) > cutoff_time
            ]
            
            return [
                {"timestamp": d["timestamp"], "value": d["metrics"]["cpu"]["percent"]}
                for d in data
            ]
        
        elif metric == "memory":
            data = [
                d for d in self.system_metrics_history
                if datetime.fromisoformat(d["timestamp"]) > cutoff_time
            ]
            
            return [
                {"timestamp": d["timestamp"], "value": d["metrics"]["memory"]["percent"]}
                for d in data
            ]
        
        return []

# Global monitoring service instance
monitoring_service = MonitoringService()

def apply_monitoring(app):
    """Apply monitoring to Flask app"""
    
    @app.before_request
    def before_request_hook():
        """Record start time of the request"""
        g.start_time = time.time()
        g.user_id = None # Initialize user_id for monitoring
        
        # Attempt to get user from request headers if possible (e.g., from auth middleware)
        # This is a placeholder, actual user retrieval should happen in auth middleware
        # For now, we rely on other parts of the app to set g.user
        
    @app.after_request
    def after_request_hook(response):
        """Record request metrics after the request is processed"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # Get endpoint name
            endpoint = request.endpoint
            if not endpoint:
                # Fallback for dynamic routes or blueprints
                endpoint = request.path
            
            # Get user ID if available
            user_id = getattr(g, 'user_id', None)
            if not user_id and hasattr(g, 'user') and g.user:
                user_id = g.user.id
            
            monitoring_service.record_request(
                endpoint=endpoint,
                method=request.method,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id
            )
        
        return response

    @app.teardown_request
    def teardown_request_hook(exception):
        """Record errors that occurred during request processing"""
        if exception:
            # Get endpoint name
            endpoint = request.endpoint
            if not endpoint:
                endpoint = request.path
            
            # Get user ID if available
            user_id = getattr(g, 'user_id', None)
            if not user_id and hasattr(g, 'user') and g.user:
                user_id = g.user.id
                
            # Duration is hard to calculate accurately on teardown, so we use a placeholder
            monitoring_service.record_request(
                endpoint=endpoint,
                method=request.method,
                status_code=500, # Assuming 500 for unhandled exception
                duration=0.0,
                user_id=user_id,
                error=exception
            )
        
        return None

    print("✅ Monitoring service middleware applied")
