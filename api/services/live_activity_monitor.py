"""
SUPER ADVANCED LIVE ACTIVITY MONITORING SYSTEM
Real-time activity streams, behavioral analysis, and intelligent alerting
"""

import time
import json
import threading
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Optional, Callable
import statistics
import asyncio
from dataclasses import dataclass, asdict
from enum import Enum
import queue
import uuid

class ActivityType(Enum):
    CLICK = "click"
    CONVERSION = "conversion"
    SECURITY_VIOLATION = "security_violation"
    QUANTUM_REDIRECT = "quantum_redirect"
    CAMPAIGN_EVENT = "campaign_event"
    GEOGRAPHIC_EVENT = "geographic_event"
    SYSTEM_EVENT = "system_event"
    USER_ACTION = "user_action"

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ActivityEvent:
    id: str
    timestamp: datetime
    activity_type: ActivityType
    user_id: Optional[int]
    ip_address: str
    user_agent: str
    data: Dict
    severity: AlertSeverity = AlertSeverity.LOW
    processed: bool = False
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'activity_type': self.activity_type.value,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'data': self.data,
            'severity': self.severity.value,
            'processed': self.processed
        }

@dataclass
class Alert:
    id: str
    timestamp: datetime
    severity: AlertSeverity
    title: str
    message: str
    activity_events: List[str]  # Event IDs
    auto_resolved: bool = False
    acknowledged: bool = False
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'severity': self.severity.value,
            'title': self.title,
            'message': self.message,
            'activity_events': self.activity_events,
            'auto_resolved': self.auto_resolved,
            'acknowledged': self.acknowledged
        }

class SuperAdvancedLiveActivityMonitor:
    def __init__(self):
        # Real-time activity storage
        self.activity_stream = deque(maxlen=10000)  # Last 10k events
        self.activity_index = {}  # Fast lookup by ID
        
        # Alert system
        self.alerts = deque(maxlen=1000)  # Last 1k alerts
        self.alert_index = {}
        
        # Real-time analytics
        self.real_time_metrics = {
            'events_per_second': deque(maxlen=300),  # 5 minutes of data
            'activity_by_type': defaultdict(int),
            'geographic_activity': defaultdict(int),
            'security_events': deque(maxlen=1000),
            'performance_metrics': defaultdict(list)
        }
        
        # Behavioral analysis
        self.user_sessions = defaultdict(lambda: {
            'events': deque(maxlen=100),
            'start_time': None,
            'last_activity': None,
            'behavior_score': 0,
            'anomaly_flags': []
        })
        
        # Pattern detection
        self.pattern_detectors = {
            'rapid_clicking': self._detect_rapid_clicking,
            'geographic_anomaly': self._detect_geographic_anomaly,
            'bot_behavior': self._detect_bot_behavior,
            'security_breach': self._detect_security_breach,
            'performance_degradation': self._detect_performance_degradation
        }
        
        # Event processing queue
        self.event_queue = queue.Queue()
        self.processing_thread = None
        self.is_running = False
        
        # Subscribers for real-time updates
        self.subscribers = {}
        
        # Advanced configuration
        self.config = {
            'rapid_click_threshold': 5,  # clicks per second
            'rapid_click_window': 10,    # seconds
            'geographic_anomaly_distance': 1000,  # km
            'bot_behavior_score_threshold': 80,
            'performance_alert_threshold': 1000,  # ms
            'auto_alert_resolution_time': 300,  # seconds
        }
        
        self.start_monitoring()

    def start_monitoring(self):
        """Start the real-time monitoring system"""
        if not self.is_running:
            self.is_running = True
            self.processing_thread = threading.Thread(target=self._process_events, daemon=True)
            self.processing_thread.start()

    def stop_monitoring(self):
        """Stop the monitoring system"""
        self.is_running = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5)

    def log_activity(self, activity_type: ActivityType, user_id: Optional[int], 
                    ip_address: str, user_agent: str, data: Dict) -> str:
        """Log a new activity event"""
        event = ActivityEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            activity_type=activity_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            data=data
        )
        
        # Add to queue for processing
        self.event_queue.put(event)
        
        return event.id

    def _process_events(self):
        """Background thread for processing events"""
        while self.is_running:
            try:
                # Process events from queue
                event = self.event_queue.get(timeout=1)
                self._process_single_event(event)
                self.event_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error processing event: {e}")

    def _process_single_event(self, event: ActivityEvent):
        """Process a single activity event"""
        # Add to activity stream
        self.activity_stream.append(event)
        self.activity_index[event.id] = event
        
        # Update real-time metrics
        self._update_real_time_metrics(event)
        
        # Update user session tracking
        self._update_user_session(event)
        
        # Run pattern detection
        self._run_pattern_detection(event)
        
        # Notify subscribers
        self._notify_subscribers('new_activity', event.to_dict())
        
        # Mark as processed
        event.processed = True

    def _update_real_time_metrics(self, event: ActivityEvent):
        """Update real-time metrics with new event"""
        current_time = time.time()
        
        # Events per second tracking
        self.real_time_metrics['events_per_second'].append(current_time)
        
        # Activity by type
        self.real_time_metrics['activity_by_type'][event.activity_type.value] += 1
        
        # Geographic activity
        country = event.data.get('country', 'Unknown')
        self.real_time_metrics['geographic_activity'][country] += 1
        
        # Security events
        if event.activity_type == ActivityType.SECURITY_VIOLATION:
            self.real_time_metrics['security_events'].append(event)
        
        # Performance metrics
        processing_time = event.data.get('processing_time_ms', 0)
        if processing_time > 0:
            self.real_time_metrics['performance_metrics']['processing_time'].append(processing_time)

    def _update_user_session(self, event: ActivityEvent):
        """Update user session tracking"""
        session_key = f"{event.ip_address}_{event.user_agent[:50]}"
        session = self.user_sessions[session_key]
        
        # Initialize session if new
        if session['start_time'] is None:
            session['start_time'] = event.timestamp
        
        # Add event to session
        session['events'].append(event)
        session['last_activity'] = event.timestamp
        
        # Calculate behavior score
        session['behavior_score'] = self._calculate_behavior_score(session['events'])

    def _calculate_behavior_score(self, events: deque) -> float:
        """Calculate behavioral anomaly score (0-100, higher = more suspicious)"""
        if len(events) < 2:
            return 0
        
        score = 0
        
        # Check click velocity
        recent_events = [e for e in events if e.activity_type == ActivityType.CLICK]
        if len(recent_events) >= 3:
            time_diffs = []
            for i in range(1, len(recent_events)):
                diff = (recent_events[i].timestamp - recent_events[i-1].timestamp).total_seconds()
                time_diffs.append(diff)
            
            avg_time_diff = statistics.mean(time_diffs)
            if avg_time_diff < 1:  # Less than 1 second between clicks
                score += 30
            elif avg_time_diff < 2:
                score += 15
        
        # Check user agent consistency
        user_agents = set(e.user_agent for e in events)
        if len(user_agents) > 1:
            score += 25  # Multiple user agents from same session
        
        # Check geographic consistency
        countries = set(e.data.get('country', 'Unknown') for e in events)
        if len(countries) > 1:
            score += 20  # Multiple countries in same session
        
        # Check conversion patterns
        conversions = [e for e in events if e.activity_type == ActivityType.CONVERSION]
        clicks = [e for e in events if e.activity_type == ActivityType.CLICK]
        
        if len(conversions) > 0 and len(clicks) > 0:
            conversion_rate = len(conversions) / len(clicks)
            if conversion_rate > 0.5:  # Very high conversion rate
                score += 15
        
        return min(score, 100)

    def _run_pattern_detection(self, event: ActivityEvent):
        """Run all pattern detectors on the new event"""
        for detector_name, detector_func in self.pattern_detectors.items():
            try:
                alert = detector_func(event)
                if alert:
                    self._create_alert(alert)
            except Exception as e:
                print(f"Error in pattern detector {detector_name}: {e}")

    def _detect_rapid_clicking(self, event: ActivityEvent) -> Optional[Dict]:
        """Detect rapid clicking patterns"""
        if event.activity_type != ActivityType.CLICK:
            return None
        
        # Get recent clicks from same IP
        recent_clicks = [
            e for e in self.activity_stream
            if e.activity_type == ActivityType.CLICK
            and e.ip_address == event.ip_address
            and (event.timestamp - e.timestamp).total_seconds() <= self.config['rapid_click_window']
        ]
        
        if len(recent_clicks) >= self.config['rapid_click_threshold']:
            return {
                'severity': AlertSeverity.HIGH,
                'title': 'Rapid Clicking Detected',
                'message': f'IP {event.ip_address} made {len(recent_clicks)} clicks in {self.config["rapid_click_window"]} seconds',
                'events': [e.id for e in recent_clicks]
            }
        
        return None

    def _detect_geographic_anomaly(self, event: ActivityEvent) -> Optional[Dict]:
        """Detect impossible geographic movements"""
        if not event.data.get('country'):
            return None
        
        # Get recent events from same session
        session_key = f"{event.ip_address}_{event.user_agent[:50]}"
        session_events = list(self.user_sessions[session_key]['events'])
        
        if len(session_events) < 2:
            return None
        
        # Check for country changes in short time
        for prev_event in reversed(session_events[:-1]):
            if prev_event.data.get('country') and prev_event.data['country'] != event.data['country']:
                time_diff = (event.timestamp - prev_event.timestamp).total_seconds()
                if time_diff < 3600:  # Less than 1 hour
                    return {
                        'severity': AlertSeverity.MEDIUM,
                        'title': 'Geographic Anomaly Detected',
                        'message': f'User moved from {prev_event.data["country"]} to {event.data["country"]} in {time_diff/60:.1f} minutes',
                        'events': [prev_event.id, event.id]
                    }
                break
        
        return None

    def _detect_bot_behavior(self, event: ActivityEvent) -> Optional[Dict]:
        """Detect bot-like behavior patterns"""
        session_key = f"{event.ip_address}_{event.user_agent[:50]}"
        session = self.user_sessions[session_key]
        
        if session['behavior_score'] >= self.config['bot_behavior_score_threshold']:
            return {
                'severity': AlertSeverity.HIGH,
                'title': 'Bot Behavior Detected',
                'message': f'Session from {event.ip_address} has behavior score of {session["behavior_score"]}/100',
                'events': [e.id for e in list(session['events'])[-5:]]  # Last 5 events
            }
        
        return None

    def _detect_security_breach(self, event: ActivityEvent) -> Optional[Dict]:
        """Detect potential security breaches"""
        if event.activity_type == ActivityType.SECURITY_VIOLATION:
            violation_type = event.data.get('violation_type', 'unknown')
            
            # Count recent violations from same IP
            recent_violations = [
                e for e in self.real_time_metrics['security_events']
                if e.ip_address == event.ip_address
                and (event.timestamp - e.timestamp).total_seconds() <= 300  # 5 minutes
            ]
            
            if len(recent_violations) >= 3:
                return {
                    'severity': AlertSeverity.CRITICAL,
                    'title': 'Security Breach Attempt',
                    'message': f'Multiple security violations from {event.ip_address}: {violation_type}',
                    'events': [e.id for e in recent_violations]
                }
        
        return None

    def _detect_performance_degradation(self, event: ActivityEvent) -> Optional[Dict]:
        """Detect performance degradation"""
        processing_time = event.data.get('processing_time_ms', 0)
        
        if processing_time > self.config['performance_alert_threshold']:
            return {
                'severity': AlertSeverity.MEDIUM,
                'title': 'Performance Degradation',
                'message': f'Slow processing time detected: {processing_time}ms',
                'events': [event.id]
            }
        
        return None

    def _create_alert(self, alert_data: Dict):
        """Create a new alert"""
        alert = Alert(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            severity=alert_data['severity'],
            title=alert_data['title'],
            message=alert_data['message'],
            activity_events=alert_data['events']
        )
        
        self.alerts.append(alert)
        self.alert_index[alert.id] = alert
        
        # Notify subscribers
        self._notify_subscribers('new_alert', alert.to_dict())

    def subscribe(self, subscriber_id: str, callback: Callable):
        """Subscribe to real-time updates"""
        self.subscribers[subscriber_id] = callback

    def unsubscribe(self, subscriber_id: str):
        """Unsubscribe from real-time updates"""
        if subscriber_id in self.subscribers:
            del self.subscribers[subscriber_id]

    def _notify_subscribers(self, event_type: str, data: Dict):
        """Notify all subscribers of an event"""
        for subscriber_id, callback in self.subscribers.items():
            try:
                callback(event_type, data)
            except Exception as e:
                print(f"Error notifying subscriber {subscriber_id}: {e}")

    def get_live_dashboard_data(self) -> Dict:
        """Get comprehensive live dashboard data"""
        current_time = time.time()
        
        # Calculate events per second
        recent_events = [
            t for t in self.real_time_metrics['events_per_second']
            if current_time - t <= 60  # Last minute
        ]
        events_per_second = len(recent_events) / 60 if recent_events else 0
        
        # Get active sessions
        active_sessions = 0
        for session in self.user_sessions.values():
            if session['last_activity'] and (datetime.utcnow() - session['last_activity']).total_seconds() <= 300:
                active_sessions += 1
        
        # Get recent alerts
        recent_alerts = [
            alert.to_dict() for alert in self.alerts
            if (datetime.utcnow() - alert.timestamp).total_seconds() <= 3600  # Last hour
        ]
        
        # Performance metrics
        recent_processing_times = self.real_time_metrics['performance_metrics']['processing_time'][-100:]
        avg_processing_time = statistics.mean(recent_processing_times) if recent_processing_times else 0
        
        return {
            'real_time_metrics': {
                'events_per_second': round(events_per_second, 2),
                'active_sessions': active_sessions,
                'total_events_today': len(self.activity_stream),
                'activity_by_type': dict(self.real_time_metrics['activity_by_type']),
                'geographic_activity': dict(self.real_time_metrics['geographic_activity']),
                'avg_processing_time_ms': round(avg_processing_time, 2)
            },
            'recent_alerts': recent_alerts,
            'security_status': {
                'threat_level': self._calculate_threat_level(),
                'recent_violations': len(self.real_time_metrics['security_events']),
                'blocked_attempts': sum(1 for e in self.activity_stream if e.activity_type == ActivityType.SECURITY_VIOLATION)
            },
            'system_health': {
                'status': 'healthy' if events_per_second < 100 and avg_processing_time < 500 else 'degraded',
                'uptime': 'operational',
                'monitoring_active': self.is_running
            }
        }

    def _calculate_threat_level(self) -> str:
        """Calculate overall threat level"""
        recent_violations = len([
            e for e in self.real_time_metrics['security_events']
            if (datetime.utcnow() - e.timestamp).total_seconds() <= 3600
        ])
        
        if recent_violations > 50:
            return 'critical'
        elif recent_violations > 20:
            return 'high'
        elif recent_violations > 5:
            return 'medium'
        else:
            return 'low'

    def get_activity_stream(self, limit: int = 100, activity_type: Optional[ActivityType] = None) -> List[Dict]:
        """Get recent activity stream"""
        activities = list(self.activity_stream)
        
        if activity_type:
            activities = [a for a in activities if a.activity_type == activity_type]
        
        # Sort by timestamp (newest first)
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        return [activity.to_dict() for activity in activities[:limit]]

    def get_alerts(self, severity: Optional[AlertSeverity] = None, limit: int = 50) -> List[Dict]:
        """Get recent alerts"""
        alerts = list(self.alerts)
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return [alert.to_dict() for alert in alerts[:limit]]

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.alert_index:
            self.alert_index[alert_id].acknowledged = True
            return True
        return False

    def get_user_session_analysis(self, ip_address: str, user_agent: str) -> Dict:
        """Get detailed analysis of a user session"""
        session_key = f"{ip_address}_{user_agent[:50]}"
        session = self.user_sessions.get(session_key)
        
        if not session:
            return {'error': 'Session not found'}
        
        events = list(session['events'])
        
        return {
            'session_info': {
                'start_time': session['start_time'].isoformat() if session['start_time'] else None,
                'last_activity': session['last_activity'].isoformat() if session['last_activity'] else None,
                'duration_minutes': (session['last_activity'] - session['start_time']).total_seconds() / 60 if session['start_time'] and session['last_activity'] else 0,
                'event_count': len(events),
                'behavior_score': session['behavior_score']
            },
            'activity_breakdown': {
                activity_type.value: len([e for e in events if e.activity_type == activity_type])
                for activity_type in ActivityType
            },
            'recent_events': [e.to_dict() for e in events[-10:]],  # Last 10 events
            'anomaly_flags': session['anomaly_flags'],
            'risk_assessment': 'high' if session['behavior_score'] > 70 else 'medium' if session['behavior_score'] > 40 else 'low'
        }

# Global live activity monitor instance
live_monitor = SuperAdvancedLiveActivityMonitor()
