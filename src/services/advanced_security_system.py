"""
SUPER ADVANCED SECURITY SYSTEM
Enterprise-grade security with AI-powered threat detection, behavioral analysis, and automated response
"""

import time
import hashlib
import json
import threading
import queue
import statistics
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import re
import ipaddress
import base64
import hmac
import secrets
import geoip2.database
import geoip2.errors
from user_agents import parse as parse_user_agent

class ThreatLevel(Enum):
    MINIMAL = "minimal"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EXTREME = "extreme"

class SecurityAction(Enum):
    ALLOW = "allow"
    MONITOR = "monitor"
    CHALLENGE = "challenge"
    THROTTLE = "throttle"
    BLOCK = "block"
    QUARANTINE = "quarantine"

class AttackType(Enum):
    BOT_ATTACK = "bot_attack"
    BRUTE_FORCE = "brute_force"
    DDoS = "ddos"
    SCRAPING = "scraping"
    FRAUD = "fraud"
    INJECTION = "injection"
    XSS = "xss"
    CSRF = "csrf"
    RECONNAISSANCE = "reconnaissance"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"

@dataclass
class SecurityThreat:
    id: str
    timestamp: datetime
    ip_address: str
    user_agent: str
    threat_level: ThreatLevel
    attack_type: AttackType
    confidence_score: float  # 0-100
    threat_indicators: List[str]
    behavioral_anomalies: List[str]
    geographic_risk: float
    device_risk: float
    network_risk: float
    recommended_action: SecurityAction
    mitigation_steps: List[str]
    
    # Advanced fingerprinting
    fingerprint_hash: str
    canvas_fingerprint: Optional[str] = None
    webgl_fingerprint: Optional[str] = None
    audio_fingerprint: Optional[str] = None
    font_fingerprint: Optional[str] = None
    screen_fingerprint: Optional[str] = None
    timezone_fingerprint: Optional[str] = None
    
    # Network analysis
    is_tor: bool = False
    is_vpn: bool = False
    is_proxy: bool = False
    is_hosting: bool = False
    is_mobile_network: bool = False
    
    # Behavioral analysis
    click_velocity: float = 0.0
    session_anomalies: int = 0
    pattern_violations: int = 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'threat_level': self.threat_level.value,
            'attack_type': self.attack_type.value,
            'confidence_score': self.confidence_score,
            'threat_indicators': self.threat_indicators,
            'behavioral_anomalies': self.behavioral_anomalies,
            'geographic_risk': self.geographic_risk,
            'device_risk': self.device_risk,
            'network_risk': self.network_risk,
            'recommended_action': self.recommended_action.value,
            'mitigation_steps': self.mitigation_steps,
            'fingerprint_hash': self.fingerprint_hash,
            'network_analysis': {
                'is_tor': self.is_tor,
                'is_vpn': self.is_vpn,
                'is_proxy': self.is_proxy,
                'is_hosting': self.is_hosting,
                'is_mobile_network': self.is_mobile_network
            },
            'behavioral_metrics': {
                'click_velocity': self.click_velocity,
                'session_anomalies': self.session_anomalies,
                'pattern_violations': self.pattern_violations
            }
        }

@dataclass
class SecurityProfile:
    ip_address: str
    first_seen: datetime
    last_seen: datetime
    total_requests: int
    blocked_requests: int
    threat_score: float  # Running average
    reputation_score: float  # 0-100 (higher = better reputation)
    behavioral_patterns: Dict[str, float]
    geographic_consistency: float
    device_consistency: float
    attack_history: List[AttackType]
    
    def update_reputation(self, new_threat_score: float):
        """Update reputation based on new threat assessment"""
        # Exponential moving average for reputation
        alpha = 0.1  # Learning rate
        threat_impact = (100 - new_threat_score) / 100  # Convert threat to positive reputation
        self.reputation_score = (1 - alpha) * self.reputation_score + alpha * threat_impact * 100
        self.threat_score = (1 - alpha) * self.threat_score + alpha * new_threat_score

class SuperAdvancedSecuritySystem:
    def __init__(self):
        # Threat detection engines
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.network_analyzer = NetworkAnalyzer()
        self.fingerprint_analyzer = FingerprintAnalyzer()
        self.pattern_detector = PatternDetector()
        self.ml_threat_detector = MLThreatDetector()
        
        # Security storage
        self.active_threats = deque(maxlen=10000)
        self.security_profiles = {}  # ip_address -> SecurityProfile
        self.blocked_ips = set()
        self.quarantined_ips = set()
        self.whitelisted_ips = set()
        
        # Real-time monitoring
        self.threat_queue = queue.Queue()
        self.monitoring_thread = None
        self.is_monitoring = False
        
        # Attack pattern tracking
        self.attack_patterns = defaultdict(lambda: deque(maxlen=1000))
        self.ddos_detector = DDoSDetector()
        self.brute_force_detector = BruteForceDetector()
        
        # Advanced configuration
        self.config = {
            'threat_threshold': 70,  # Block above this score
            'challenge_threshold': 50,  # Challenge between 50-70
            'monitor_threshold': 30,  # Monitor between 30-50
            'reputation_threshold': 20,  # Poor reputation threshold
            'max_requests_per_minute': 60,
            'max_requests_per_hour': 1000,
            'behavioral_analysis_window': 3600,  # 1 hour
            'fingerprint_uniqueness_threshold': 0.95,
            'geographic_anomaly_threshold': 0.8,
            'device_consistency_threshold': 0.7,
            'auto_block_duration': 3600,  # 1 hour
            'quarantine_duration': 86400,  # 24 hours
        }
        
        # Honeypot system
        self.honeypot_manager = HoneypotManager()
        
        # Response automation
        self.automated_responder = AutomatedResponder()
        
        # Statistics tracking
        self.security_stats = {
            'total_requests': 0,
            'threats_detected': 0,
            'threats_blocked': 0,
            'false_positives': 0,
            'true_positives': 0,
            'response_time_ms': deque(maxlen=1000)
        }
        
        self.start_monitoring()

    def start_monitoring(self):
        """Start the real-time security monitoring system"""
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitoring_thread = threading.Thread(target=self._monitor_threats, daemon=True)
            self.monitoring_thread.start()

    def stop_monitoring(self):
        """Stop the security monitoring system"""
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)

    def analyze_request(self, request_data: Dict) -> SecurityThreat:
        """Comprehensive security analysis of incoming request"""
        start_time = time.time()
        
        ip_address = request_data.get('ip_address', '')
        user_agent = request_data.get('user_agent', '')
        
        # Generate unique threat ID
        threat_id = str(uuid.uuid4())
        
        # Initialize threat object
        threat = SecurityThreat(
            id=threat_id,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
            threat_level=ThreatLevel.MINIMAL,
            attack_type=AttackType.RECONNAISSANCE,
            confidence_score=0.0,
            threat_indicators=[],
            behavioral_anomalies=[],
            geographic_risk=0.0,
            device_risk=0.0,
            network_risk=0.0,
            recommended_action=SecurityAction.ALLOW,
            mitigation_steps=[],
            fingerprint_hash=''
        )
        
        # 1. Network Analysis
        network_analysis = self.network_analyzer.analyze_network(ip_address)
        threat.is_tor = network_analysis.get('is_tor', False)
        threat.is_vpn = network_analysis.get('is_vpn', False)
        threat.is_proxy = network_analysis.get('is_proxy', False)
        threat.is_hosting = network_analysis.get('is_hosting', False)
        threat.is_mobile_network = network_analysis.get('is_mobile_network', False)
        threat.network_risk = network_analysis.get('risk_score', 0.0)
        
        # 2. Fingerprint Analysis
        fingerprint_data = request_data.get('fingerprint', {})
        fingerprint_analysis = self.fingerprint_analyzer.analyze_fingerprint(fingerprint_data)
        threat.fingerprint_hash = fingerprint_analysis.get('hash', '')
        threat.canvas_fingerprint = fingerprint_data.get('canvas')
        threat.webgl_fingerprint = fingerprint_data.get('webgl')
        threat.audio_fingerprint = fingerprint_data.get('audio')
        threat.device_risk = fingerprint_analysis.get('risk_score', 0.0)
        
        # 3. Behavioral Analysis
        behavioral_analysis = self.behavioral_analyzer.analyze_behavior(request_data, ip_address)
        threat.click_velocity = behavioral_analysis.get('click_velocity', 0.0)
        threat.session_anomalies = behavioral_analysis.get('anomalies', 0)
        threat.pattern_violations = behavioral_analysis.get('violations', 0)
        threat.behavioral_anomalies = behavioral_analysis.get('anomaly_list', [])
        
        # 4. Geographic Analysis
        geographic_analysis = self.network_analyzer.analyze_geography(ip_address, request_data)
        threat.geographic_risk = geographic_analysis.get('risk_score', 0.0)
        
        # 5. Pattern Detection
        pattern_analysis = self.pattern_detector.detect_patterns(request_data, ip_address)
        if pattern_analysis.get('attack_detected'):
            threat.attack_type = AttackType(pattern_analysis.get('attack_type', 'reconnaissance'))
            threat.threat_indicators.extend(pattern_analysis.get('indicators', []))
        
        # 6. ML Threat Detection
        ml_analysis = self.ml_threat_detector.predict_threat(request_data, threat)
        threat.confidence_score = ml_analysis.get('threat_score', 0.0)
        threat.threat_indicators.extend(ml_analysis.get('indicators', []))
        
        # 7. Reputation Analysis
        reputation_score = self._get_reputation_score(ip_address)
        
        # 8. Calculate Final Threat Level
        threat.threat_level, threat.recommended_action = self._calculate_threat_level(
            threat, reputation_score
        )
        
        # 9. Generate Mitigation Steps
        threat.mitigation_steps = self._generate_mitigation_steps(threat)
        
        # 10. Update Security Profile
        self._update_security_profile(ip_address, threat)
        
        # 11. Execute Automated Response
        self.automated_responder.execute_response(threat)
        
        # 12. Store Threat
        self.active_threats.append(threat)
        self.threat_queue.put(threat)
        
        # 13. Update Statistics
        processing_time = (time.time() - start_time) * 1000
        self.security_stats['response_time_ms'].append(processing_time)
        self.security_stats['total_requests'] += 1
        
        if threat.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL, ThreatLevel.EXTREME]:
            self.security_stats['threats_detected'] += 1
            
        if threat.recommended_action in [SecurityAction.BLOCK, SecurityAction.QUARANTINE]:
            self.security_stats['threats_blocked'] += 1
        
        return threat

    def _calculate_threat_level(self, threat: SecurityThreat, reputation_score: float) -> Tuple[ThreatLevel, SecurityAction]:
        """Calculate final threat level and recommended action"""
        
        # Base threat score from ML analysis
        base_score = threat.confidence_score
        
        # Network risk multipliers
        if threat.is_tor:
            base_score += 25
        if threat.is_vpn:
            base_score += 15
        if threat.is_proxy:
            base_score += 20
        if threat.is_hosting:
            base_score += 30
        
        # Behavioral risk additions
        base_score += threat.click_velocity * 10  # High velocity = suspicious
        base_score += threat.session_anomalies * 5
        base_score += threat.pattern_violations * 8
        
        # Geographic and device risk
        base_score += threat.geographic_risk * 0.3
        base_score += threat.device_risk * 0.2
        base_score += threat.network_risk * 0.4
        
        # Reputation impact
        reputation_impact = (100 - reputation_score) / 100 * 20
        base_score += reputation_impact
        
        # Attack type severity multipliers
        attack_multipliers = {
            AttackType.BOT_ATTACK: 1.2,
            AttackType.BRUTE_FORCE: 1.5,
            AttackType.DDoS: 1.8,
            AttackType.SCRAPING: 1.1,
            AttackType.FRAUD: 1.6,
            AttackType.INJECTION: 1.9,
            AttackType.XSS: 1.7,
            AttackType.CSRF: 1.4,
            AttackType.RECONNAISSANCE: 1.0,
            AttackType.ANOMALOUS_BEHAVIOR: 1.3
        }
        
        base_score *= attack_multipliers.get(threat.attack_type, 1.0)
        
        # Cap at 100
        final_score = min(100, base_score)
        threat.confidence_score = final_score
        
        # Determine threat level and action
        if final_score >= 90:
            return ThreatLevel.EXTREME, SecurityAction.QUARANTINE
        elif final_score >= self.config['threat_threshold']:
            return ThreatLevel.CRITICAL, SecurityAction.BLOCK
        elif final_score >= 60:
            return ThreatLevel.HIGH, SecurityAction.THROTTLE
        elif final_score >= self.config['challenge_threshold']:
            return ThreatLevel.MEDIUM, SecurityAction.CHALLENGE
        elif final_score >= self.config['monitor_threshold']:
            return ThreatLevel.LOW, SecurityAction.MONITOR
        else:
            return ThreatLevel.MINIMAL, SecurityAction.ALLOW

    def _generate_mitigation_steps(self, threat: SecurityThreat) -> List[str]:
        """Generate specific mitigation steps for the threat"""
        steps = []
        
        if threat.recommended_action == SecurityAction.QUARANTINE:
            steps.extend([
                "Immediately quarantine IP address",
                "Block all traffic from this source",
                "Alert security team for manual review",
                "Analyze attack patterns for IOCs"
            ])
        
        elif threat.recommended_action == SecurityAction.BLOCK:
            steps.extend([
                "Block IP address temporarily",
                "Implement rate limiting",
                "Monitor for circumvention attempts",
                "Log all blocked requests"
            ])
        
        elif threat.recommended_action == SecurityAction.THROTTLE:
            steps.extend([
                "Apply strict rate limiting",
                "Increase monitoring frequency",
                "Require additional verification",
                "Track behavioral patterns"
            ])
        
        elif threat.recommended_action == SecurityAction.CHALLENGE:
            steps.extend([
                "Present CAPTCHA challenge",
                "Require JavaScript verification",
                "Implement device fingerprinting",
                "Monitor challenge responses"
            ])
        
        elif threat.recommended_action == SecurityAction.MONITOR:
            steps.extend([
                "Increase logging detail",
                "Track user behavior patterns",
                "Monitor for escalation",
                "Collect additional fingerprints"
            ])
        
        # Attack-specific steps
        if threat.attack_type == AttackType.BOT_ATTACK:
            steps.append("Deploy advanced bot detection measures")
            steps.append("Analyze user-agent patterns")
        
        elif threat.attack_type == AttackType.BRUTE_FORCE:
            steps.append("Implement exponential backoff")
            steps.append("Alert on repeated failures")
        
        elif threat.attack_type == AttackType.DDoS:
            steps.append("Activate DDoS protection")
            steps.append("Scale infrastructure if needed")
        
        elif threat.attack_type == AttackType.SCRAPING:
            steps.append("Implement anti-scraping measures")
            steps.append("Randomize response timing")
        
        return steps

    def _update_security_profile(self, ip_address: str, threat: SecurityThreat):
        """Update or create security profile for IP address"""
        current_time = datetime.utcnow()
        
        if ip_address not in self.security_profiles:
            # Create new profile
            self.security_profiles[ip_address] = SecurityProfile(
                ip_address=ip_address,
                first_seen=current_time,
                last_seen=current_time,
                total_requests=1,
                blocked_requests=0,
                threat_score=threat.confidence_score,
                reputation_score=50.0,  # Neutral starting reputation
                behavioral_patterns={},
                geographic_consistency=100.0,
                device_consistency=100.0,
                attack_history=[]
            )
        else:
            # Update existing profile
            profile = self.security_profiles[ip_address]
            profile.last_seen = current_time
            profile.total_requests += 1
            profile.update_reputation(threat.confidence_score)
            
            if threat.recommended_action in [SecurityAction.BLOCK, SecurityAction.QUARANTINE]:
                profile.blocked_requests += 1
            
            if threat.attack_type not in profile.attack_history:
                profile.attack_history.append(threat.attack_type)

    def _get_reputation_score(self, ip_address: str) -> float:
        """Get reputation score for IP address"""
        if ip_address in self.security_profiles:
            return self.security_profiles[ip_address].reputation_score
        return 50.0  # Neutral reputation for new IPs

    def _monitor_threats(self):
        """Background thread for threat monitoring and response"""
        while self.is_monitoring:
            try:
                # Process threats from queue
                threat = self.threat_queue.get(timeout=1)
                self._process_threat_response(threat)
                self.threat_queue.task_done()
                
            except queue.Empty:
                # Periodic maintenance tasks
                self._run_security_maintenance()
                continue
            except Exception as e:
                print(f"Error in threat monitoring: {e}")

    def _process_threat_response(self, threat: SecurityThreat):
        """Process automated threat response"""
        
        # Execute blocking actions
        if threat.recommended_action == SecurityAction.BLOCK:
            self.blocked_ips.add(threat.ip_address)
            # Schedule automatic unblock
            threading.Timer(
                self.config['auto_block_duration'],
                lambda: self.blocked_ips.discard(threat.ip_address)
            ).start()
        
        elif threat.recommended_action == SecurityAction.QUARANTINE:
            self.quarantined_ips.add(threat.ip_address)
            # Schedule automatic release from quarantine
            threading.Timer(
                self.config['quarantine_duration'],
                lambda: self.quarantined_ips.discard(threat.ip_address)
            ).start()
        
        # Deploy honeypots for high-threat IPs
        if threat.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL, ThreatLevel.EXTREME]:
            self.honeypot_manager.deploy_honeypot(threat.ip_address)
        
        # Alert security team for critical threats
        if threat.threat_level == ThreatLevel.EXTREME:
            self._send_security_alert(threat)

    def _run_security_maintenance(self):
        """Run periodic security maintenance tasks"""
        current_time = datetime.utcnow()
        
        # Clean up old security profiles
        cutoff_time = current_time - timedelta(days=30)
        expired_profiles = [
            ip for ip, profile in self.security_profiles.items()
            if profile.last_seen < cutoff_time
        ]
        
        for ip in expired_profiles:
            del self.security_profiles[ip]
        
        # Update threat statistics
        self._update_threat_statistics()
        
        # Optimize detection algorithms
        self.ml_threat_detector.update_models()

    def _send_security_alert(self, threat: SecurityThreat):
        """Send security alert for critical threats"""
        alert_data = {
            'threat_id': threat.id,
            'severity': 'CRITICAL',
            'ip_address': threat.ip_address,
            'attack_type': threat.attack_type.value,
            'confidence': threat.confidence_score,
            'timestamp': threat.timestamp.isoformat(),
            'recommended_action': threat.recommended_action.value
        }
        
        # Send to notification system
        try:
            from .intelligent_notification_system import intelligent_notifications
            intelligent_notifications.create_notification(
                title=f"CRITICAL Security Threat Detected",
                message=f"High-confidence threat from {threat.ip_address}: {threat.attack_type.value}",
                category="security",
                priority="critical",
                user_id=1,  # Admin user
                data=alert_data
            )
        except ImportError:
            print(f"Security Alert: {alert_data}")

    def _update_threat_statistics(self):
        """Update comprehensive threat statistics"""
        current_time = datetime.utcnow()
        
        # Calculate recent threat metrics
        recent_threats = [
            t for t in self.active_threats
            if (current_time - t.timestamp).total_seconds() <= 3600  # Last hour
        ]
        
        if recent_threats:
            avg_threat_score = statistics.mean([t.confidence_score for t in recent_threats])
            threat_distribution = defaultdict(int)
            
            for threat in recent_threats:
                threat_distribution[threat.threat_level.value] += 1
            
            # Update global statistics
            self.security_stats.update({
                'recent_avg_threat_score': avg_threat_score,
                'recent_threat_distribution': dict(threat_distribution),
                'active_blocked_ips': len(self.blocked_ips),
                'active_quarantined_ips': len(self.quarantined_ips),
                'total_security_profiles': len(self.security_profiles)
            })

    def get_security_dashboard(self) -> Dict:
        """Get comprehensive security dashboard data"""
        current_time = datetime.utcnow()
        
        # Recent threats (last 24 hours)
        recent_threats = [
            t for t in self.active_threats
            if (current_time - t.timestamp).total_seconds() <= 86400
        ]
        
        # Threat level distribution
        threat_distribution = defaultdict(int)
        attack_type_distribution = defaultdict(int)
        
        for threat in recent_threats:
            threat_distribution[threat.threat_level.value] += 1
            attack_type_distribution[threat.attack_type.value] += 1
        
        # Top threat sources
        ip_threat_scores = defaultdict(list)
        for threat in recent_threats:
            ip_threat_scores[threat.ip_address].append(threat.confidence_score)
        
        top_threat_ips = sorted(
            [(ip, statistics.mean(scores)) for ip, scores in ip_threat_scores.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Performance metrics
        avg_response_time = statistics.mean(self.security_stats['response_time_ms']) if self.security_stats['response_time_ms'] else 0
        
        return {
            'overview': {
                'total_requests_24h': len(recent_threats),
                'threats_detected_24h': len([t for t in recent_threats if t.threat_level != ThreatLevel.MINIMAL]),
                'threats_blocked_24h': len([t for t in recent_threats if t.recommended_action in [SecurityAction.BLOCK, SecurityAction.QUARANTINE]]),
                'average_threat_score': statistics.mean([t.confidence_score for t in recent_threats]) if recent_threats else 0,
                'system_health': self._calculate_system_health(),
                'active_blocked_ips': len(self.blocked_ips),
                'active_quarantined_ips': len(self.quarantined_ips)
            },
            'threat_distribution': dict(threat_distribution),
            'attack_types': dict(attack_type_distribution),
            'top_threat_sources': [
                {'ip_address': ip, 'avg_threat_score': score}
                for ip, score in top_threat_ips
            ],
            'performance_metrics': {
                'average_response_time_ms': avg_response_time,
                'detection_accuracy': self._calculate_detection_accuracy(),
                'false_positive_rate': self._calculate_false_positive_rate(),
                'system_load': self._calculate_system_load()
            },
            'recent_threats': [
                threat.to_dict() for threat in list(recent_threats)[-20:]  # Last 20 threats
            ],
            'security_trends': self._calculate_security_trends()
        }

    def _calculate_system_health(self) -> str:
        """Calculate overall system health status"""
        recent_threats = [
            t for t in self.active_threats
            if (datetime.utcnow() - t.timestamp).total_seconds() <= 3600
        ]
        
        if not recent_threats:
            return "excellent"
        
        high_threats = len([t for t in recent_threats if t.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL, ThreatLevel.EXTREME]])
        threat_ratio = high_threats / len(recent_threats)
        
        if threat_ratio >= 0.5:
            return "critical"
        elif threat_ratio >= 0.3:
            return "poor"
        elif threat_ratio >= 0.15:
            return "fair"
        elif threat_ratio >= 0.05:
            return "good"
        else:
            return "excellent"

    def _calculate_detection_accuracy(self) -> float:
        """Calculate threat detection accuracy"""
        total_positives = self.security_stats['true_positives'] + self.security_stats['false_positives']
        if total_positives == 0:
            return 100.0
        return (self.security_stats['true_positives'] / total_positives) * 100

    def _calculate_false_positive_rate(self) -> float:
        """Calculate false positive rate"""
        total_positives = self.security_stats['true_positives'] + self.security_stats['false_positives']
        if total_positives == 0:
            return 0.0
        return (self.security_stats['false_positives'] / total_positives) * 100

    def _calculate_system_load(self) -> float:
        """Calculate current system load percentage"""
        # Simplified load calculation based on active threats and processing time
        recent_response_times = list(self.security_stats['response_time_ms'])[-100:]
        if not recent_response_times:
            return 0.0
        
        avg_response_time = statistics.mean(recent_response_times)
        max_acceptable_time = 1000  # 1 second
        
        load_percentage = min(100, (avg_response_time / max_acceptable_time) * 100)
        return load_percentage

    def _calculate_security_trends(self) -> Dict:
        """Calculate security trends over time"""
        current_time = datetime.utcnow()
        
        # Group threats by hour for the last 24 hours
        hourly_threats = defaultdict(int)
        hourly_blocks = defaultdict(int)
        
        for threat in self.active_threats:
            hours_ago = int((current_time - threat.timestamp).total_seconds() / 3600)
            if hours_ago <= 24:
                hourly_threats[24 - hours_ago] += 1
                if threat.recommended_action in [SecurityAction.BLOCK, SecurityAction.QUARANTINE]:
                    hourly_blocks[24 - hours_ago] += 1
        
        # Create trend data
        trend_data = []
        for hour in range(24):
            trend_data.append({
                'hour': hour,
                'threats': hourly_threats[hour],
                'blocks': hourly_blocks[hour],
                'block_rate': (hourly_blocks[hour] / hourly_threats[hour] * 100) if hourly_threats[hour] > 0 else 0
            })
        
        return {
            'hourly_data': trend_data,
            'trend_direction': self._calculate_trend_direction(trend_data),
            'peak_threat_hour': max(hourly_threats.items(), key=lambda x: x[1])[0] if hourly_threats else 0
        }

    def _calculate_trend_direction(self, trend_data: List[Dict]) -> str:
        """Calculate if threats are trending up, down, or stable"""
        if len(trend_data) < 6:
            return "stable"
        
        recent_avg = statistics.mean([d['threats'] for d in trend_data[-6:]])
        older_avg = statistics.mean([d['threats'] for d in trend_data[-12:-6]])
        
        if recent_avg > older_avg * 1.2:
            return "increasing"
        elif recent_avg < older_avg * 0.8:
            return "decreasing"
        else:
            return "stable"

    def is_request_allowed(self, ip_address: str) -> Tuple[bool, str]:
        """Check if request from IP should be allowed"""
        if ip_address in self.quarantined_ips:
            return False, "IP address is quarantined due to security violations"
        
        if ip_address in self.blocked_ips:
            return False, "IP address is temporarily blocked"
        
        if ip_address in self.whitelisted_ips:
            return True, "IP address is whitelisted"
        
        # Check reputation
        reputation = self._get_reputation_score(ip_address)
        if reputation < self.config['reputation_threshold']:
            return False, f"IP reputation too low: {reputation}"
        
        return True, "Request allowed"

    def whitelist_ip(self, ip_address: str, reason: str = "Manual whitelist"):
        """Add IP to whitelist"""
        self.whitelisted_ips.add(ip_address)
        # Remove from blocked/quarantined if present
        self.blocked_ips.discard(ip_address)
        self.quarantined_ips.discard(ip_address)

    def blacklist_ip(self, ip_address: str, reason: str = "Manual blacklist"):
        """Add IP to permanent blacklist"""
        self.quarantined_ips.add(ip_address)
        self.blocked_ips.add(ip_address)

# Supporting classes for specialized security analysis

class BehavioralAnalyzer:
    """Advanced behavioral analysis engine"""
    
    def __init__(self):
        self.user_sessions = defaultdict(lambda: deque(maxlen=100))
        self.click_patterns = defaultdict(list)
        
    def analyze_behavior(self, request_data: Dict, ip_address: str) -> Dict:
        """Analyze user behavioral patterns"""
        current_time = time.time()
        
        # Track click velocity
        self.click_patterns[ip_address].append(current_time)
        
        # Calculate click velocity (clicks per minute)
        recent_clicks = [
            t for t in self.click_patterns[ip_address]
            if current_time - t <= 60  # Last minute
        ]
        click_velocity = len(recent_clicks)
        
        # Detect anomalies
        anomalies = 0
        anomaly_list = []
        
        # High click velocity
        if click_velocity > 30:  # More than 30 clicks per minute
            anomalies += 1
            anomaly_list.append("Excessive click velocity")
        
        # Consistent timing patterns (bot-like)
        if len(recent_clicks) >= 5:
            intervals = [recent_clicks[i] - recent_clicks[i-1] for i in range(1, len(recent_clicks))]
            if len(set([round(interval, 1) for interval in intervals])) <= 2:
                anomalies += 1
                anomaly_list.append("Robotic timing patterns")
        
        # Missing expected browser behaviors
        if not request_data.get('referrer') and not request_data.get('direct_access'):
            anomalies += 1
            anomaly_list.append("Missing referrer information")
        
        return {
            'click_velocity': click_velocity,
            'anomalies': anomalies,
            'violations': len(anomaly_list),
            'anomaly_list': anomaly_list
        }

class NetworkAnalyzer:
    """Advanced network and geographic analysis"""
    
    def __init__(self):
        self.ip_cache = {}
        self.known_proxies = set()
        self.known_vpns = set()
        self.tor_exit_nodes = set()
        
    def analyze_network(self, ip_address: str) -> Dict:
        """Analyze network characteristics of IP address"""
        if ip_address in self.ip_cache:
            return self.ip_cache[ip_address]
        
        analysis = {
            'is_tor': ip_address in self.tor_exit_nodes,
            'is_vpn': self._detect_vpn(ip_address),
            'is_proxy': self._detect_proxy(ip_address),
            'is_hosting': self._detect_hosting(ip_address),
            'is_mobile_network': self._detect_mobile_network(ip_address),
            'risk_score': 0.0
        }
        
        # Calculate risk score
        risk_score = 0.0
        if analysis['is_tor']:
            risk_score += 40
        if analysis['is_vpn']:
            risk_score += 25
        if analysis['is_proxy']:
            risk_score += 30
        if analysis['is_hosting']:
            risk_score += 35
        
        analysis['risk_score'] = min(100, risk_score)
        
        # Cache result
        self.ip_cache[ip_address] = analysis
        
        return analysis
    
    def analyze_geography(self, ip_address: str, request_data: Dict) -> Dict:
        """Analyze geographic consistency and risk"""
        # Simplified geographic analysis
        # In production, would use GeoIP2 database
        
        risk_score = 0.0
        
        # Check for impossible travel
        user_timezone = request_data.get('timezone')
        if user_timezone:
            # Compare timezone with IP geolocation
            # If mismatch, increase risk
            risk_score += 15
        
        # Check for high-risk countries
        high_risk_countries = ['CN', 'RU', 'KP', 'IR']  # Example list
        country = request_data.get('country', '')
        if country in high_risk_countries:
            risk_score += 20
        
        return {
            'risk_score': min(100, risk_score),
            'country_risk': country in high_risk_countries,
            'timezone_mismatch': bool(user_timezone)
        }
    
    def _detect_vpn(self, ip_address: str) -> bool:
        """Detect if IP is from VPN service"""
        # Simplified VPN detection
        # In production, would use commercial VPN detection service
        return ip_address in self.known_vpns
    
    def _detect_proxy(self, ip_address: str) -> bool:
        """Detect if IP is from proxy service"""
        return ip_address in self.known_proxies
    
    def _detect_hosting(self, ip_address: str) -> bool:
        """Detect if IP is from hosting provider"""
        # Check if IP belongs to known hosting providers
        try:
            ip_obj = ipaddress.ip_address(ip_address)
            # Simplified check for common hosting ranges
            hosting_ranges = [
                ipaddress.ip_network('54.0.0.0/8'),  # AWS
                ipaddress.ip_network('35.0.0.0/8'),  # Google Cloud
                ipaddress.ip_network('13.0.0.0/8'),  # Microsoft Azure
            ]
            
            for network in hosting_ranges:
                if ip_obj in network:
                    return True
        except ValueError:
            pass
        
        return False
    
    def _detect_mobile_network(self, ip_address: str) -> bool:
        """Detect if IP is from mobile network"""
        # Simplified mobile network detection
        # In production, would use comprehensive mobile carrier database
        return False

class FingerprintAnalyzer:
    """Advanced device fingerprinting analysis"""
    
    def __init__(self):
        self.fingerprint_cache = {}
        self.known_fingerprints = set()
        
    def analyze_fingerprint(self, fingerprint_data: Dict) -> Dict:
        """Analyze device fingerprint for uniqueness and risk"""
        
        # Generate composite fingerprint hash
        fingerprint_string = json.dumps(fingerprint_data, sort_keys=True)
        fingerprint_hash = hashlib.sha256(fingerprint_string.encode()).hexdigest()
        
        # Check uniqueness
        is_unique = fingerprint_hash not in self.known_fingerprints
        self.known_fingerprints.add(fingerprint_hash)
        
        # Analyze individual components
        risk_score = 0.0
        
        # Canvas fingerprint analysis
        if not fingerprint_data.get('canvas'):
            risk_score += 20  # Missing canvas = suspicious
        
        # WebGL fingerprint analysis
        if not fingerprint_data.get('webgl'):
            risk_score += 15  # Missing WebGL = suspicious
        
        # Audio fingerprint analysis
        if not fingerprint_data.get('audio'):
            risk_score += 10  # Missing audio = slightly suspicious
        
        # Check for common bot fingerprints
        if self._is_bot_fingerprint(fingerprint_data):
            risk_score += 50
        
        return {
            'hash': fingerprint_hash,
            'is_unique': is_unique,
            'risk_score': min(100, risk_score),
            'components_present': len([k for k, v in fingerprint_data.items() if v])
        }
    
    def _is_bot_fingerprint(self, fingerprint_data: Dict) -> bool:
        """Check if fingerprint matches known bot patterns"""
        # Simplified bot detection based on fingerprint
        # In production, would have extensive bot fingerprint database
        
        # Check for headless browser indicators
        if fingerprint_data.get('webdriver') == True:
            return True
        
        # Check for phantom/selenium indicators
        phantom_indicators = ['phantom', 'selenium', 'webdriver']
        user_agent = fingerprint_data.get('user_agent', '').lower()
        
        return any(indicator in user_agent for indicator in phantom_indicators)

class PatternDetector:
    """Advanced attack pattern detection"""
    
    def __init__(self):
        self.request_patterns = defaultdict(lambda: deque(maxlen=1000))
        
    def detect_patterns(self, request_data: Dict, ip_address: str) -> Dict:
        """Detect attack patterns in request data"""
        
        # Store request pattern
        pattern_key = f"{ip_address}_{request_data.get('user_agent', '')[:50]}"
        self.request_patterns[pattern_key].append({
            'timestamp': time.time(),
            'url': request_data.get('url', ''),
            'method': request_data.get('method', 'GET'),
            'user_agent': request_data.get('user_agent', '')
        })
        
        patterns = self.request_patterns[pattern_key]
        
        # Analyze patterns
        attack_detected = False
        attack_type = 'reconnaissance'
        indicators = []
        
        # SQL Injection detection
        if self._detect_sql_injection(request_data):
            attack_detected = True
            attack_type = 'injection'
            indicators.append('SQL injection patterns detected')
        
        # XSS detection
        if self._detect_xss(request_data):
            attack_detected = True
            attack_type = 'xss'
            indicators.append('XSS patterns detected')
        
        # Brute force detection
        if self._detect_brute_force(patterns):
            attack_detected = True
            attack_type = 'brute_force'
            indicators.append('Brute force patterns detected')
        
        # Scraping detection
        if self._detect_scraping(patterns):
            attack_detected = True
            attack_type = 'scraping'
            indicators.append('Scraping patterns detected')
        
        return {
            'attack_detected': attack_detected,
            'attack_type': attack_type,
            'indicators': indicators,
            'pattern_count': len(patterns)
        }
    
    def _detect_sql_injection(self, request_data: Dict) -> bool:
        """Detect SQL injection attempts"""
        sql_patterns = [
            r"union\s+select", r"drop\s+table", r"insert\s+into",
            r"delete\s+from", r"update\s+.*set", r"exec\s*\(",
            r"script\s*>", r"javascript:", r"vbscript:",
            r"onload\s*=", r"onerror\s*=", r"<\s*script"
        ]
        
        # Check URL and parameters
        url = request_data.get('url', '').lower()
        params = str(request_data.get('params', {})).lower()
        
        for pattern in sql_patterns:
            if re.search(pattern, url + params, re.IGNORECASE):
                return True
        
        return False
    
    def _detect_xss(self, request_data: Dict) -> bool:
        """Detect XSS attempts"""
        xss_patterns = [
            r"<script", r"javascript:", r"vbscript:",
            r"onload=", r"onerror=", r"onclick=",
            r"alert\s*\(", r"document\.cookie", r"window\.location"
        ]
        
        url = request_data.get('url', '').lower()
        params = str(request_data.get('params', {})).lower()
        
        for pattern in xss_patterns:
            if re.search(pattern, url + params, re.IGNORECASE):
                return True
        
        return False
    
    def _detect_brute_force(self, patterns: deque) -> bool:
        """Detect brute force attempts"""
        if len(patterns) < 10:
            return False
        
        # Check for rapid repeated requests
        recent_patterns = [p for p in patterns if time.time() - p['timestamp'] <= 300]  # Last 5 minutes
        
        return len(recent_patterns) > 50  # More than 50 requests in 5 minutes
    
    def _detect_scraping(self, patterns: deque) -> bool:
        """Detect scraping attempts"""
        if len(patterns) < 20:
            return False
        
        # Check for systematic URL patterns
        urls = [p['url'] for p in patterns]
        unique_urls = set(urls)
        
        # High request volume with many unique URLs = scraping
        return len(unique_urls) > 10 and len(patterns) > 100

class MLThreatDetector:
    """Machine Learning-based threat detection"""
    
    def __init__(self):
        self.feature_weights = {
            'request_frequency': 0.2,
            'geographic_anomaly': 0.15,
            'device_consistency': 0.1,
            'behavioral_score': 0.25,
            'network_reputation': 0.2,
            'fingerprint_uniqueness': 0.1
        }
        
    def predict_threat(self, request_data: Dict, threat: SecurityThreat) -> Dict:
        """Predict threat level using ML algorithms"""
        
        # Extract features
        features = self._extract_features(request_data, threat)
        
        # Calculate weighted threat score
        threat_score = 0.0
        for feature, value in features.items():
            weight = self.feature_weights.get(feature, 0.1)
            threat_score += value * weight
        
        # Normalize to 0-100 scale
        threat_score = min(100, threat_score * 100)
        
        # Generate threat indicators
        indicators = []
        if features.get('request_frequency', 0) > 0.8:
            indicators.append('High request frequency detected')
        
        if features.get('geographic_anomaly', 0) > 0.7:
            indicators.append('Geographic anomaly detected')
        
        if features.get('behavioral_score', 0) > 0.6:
            indicators.append('Suspicious behavioral patterns')
        
        return {
            'threat_score': threat_score,
            'indicators': indicators,
            'features': features,
            'confidence': self._calculate_confidence(features)
        }
    
    def _extract_features(self, request_data: Dict, threat: SecurityThreat) -> Dict:
        """Extract ML features from request data"""
        
        # Request frequency feature
        request_frequency = min(1.0, threat.click_velocity / 60.0)  # Normalize to 0-1
        
        # Geographic anomaly feature
        geographic_anomaly = threat.geographic_risk / 100.0
        
        # Device consistency feature (inverse of risk)
        device_consistency = 1.0 - (threat.device_risk / 100.0)
        
        # Behavioral score feature
        behavioral_score = (threat.session_anomalies + threat.pattern_violations) / 10.0
        behavioral_score = min(1.0, behavioral_score)
        
        # Network reputation feature (inverse)
        network_reputation = threat.network_risk / 100.0
        
        # Fingerprint uniqueness feature
        fingerprint_uniqueness = 1.0 if threat.fingerprint_hash else 0.0
        
        return {
            'request_frequency': request_frequency,
            'geographic_anomaly': geographic_anomaly,
            'device_consistency': device_consistency,
            'behavioral_score': behavioral_score,
            'network_reputation': network_reputation,
            'fingerprint_uniqueness': fingerprint_uniqueness
        }
    
    def _calculate_confidence(self, features: Dict) -> float:
        """Calculate confidence in threat prediction"""
        # Higher confidence when more features are available
        feature_count = len([v for v in features.values() if v > 0])
        base_confidence = feature_count / len(features)
        
        # Adjust based on feature strength
        strong_features = len([v for v in features.values() if v > 0.7])
        confidence_boost = strong_features * 0.1
        
        return min(1.0, base_confidence + confidence_boost)
    
    def update_models(self):
        """Update ML models based on new data"""
        # In production, would retrain models with new threat data
        pass

class DDoSDetector:
    """Specialized DDoS attack detection"""
    
    def __init__(self):
        self.request_counts = defaultdict(lambda: deque(maxlen=1000))
        
    def detect_ddos(self, ip_address: str) -> bool:
        """Detect DDoS attack patterns"""
        current_time = time.time()
        self.request_counts[ip_address].append(current_time)
        
        # Check request rate
        recent_requests = [
            t for t in self.request_counts[ip_address]
            if current_time - t <= 60  # Last minute
        ]
        
        return len(recent_requests) > 100  # More than 100 requests per minute

class BruteForceDetector:
    """Specialized brute force attack detection"""
    
    def __init__(self):
        self.failed_attempts = defaultdict(lambda: deque(maxlen=100))
        
    def detect_brute_force(self, ip_address: str, failed_login: bool = False) -> bool:
        """Detect brute force login attempts"""
        if failed_login:
            self.failed_attempts[ip_address].append(time.time())
        
        # Check for multiple failed attempts
        recent_failures = [
            t for t in self.failed_attempts[ip_address]
            if time.time() - t <= 300  # Last 5 minutes
        ]
        
        return len(recent_failures) > 10  # More than 10 failures in 5 minutes

class HoneypotManager:
    """Advanced honeypot deployment and management"""
    
    def __init__(self):
        self.active_honeypots = {}
        self.honeypot_interactions = defaultdict(list)
        
    def deploy_honeypot(self, target_ip: str):
        """Deploy honeypot for specific IP address"""
        honeypot_id = str(uuid.uuid4())
        self.active_honeypots[target_ip] = {
            'id': honeypot_id,
            'deployed_at': datetime.utcnow(),
            'interactions': 0,
            'type': 'web_honeypot'
        }
    
    def record_interaction(self, ip_address: str, interaction_data: Dict):
        """Record honeypot interaction"""
        if ip_address in self.active_honeypots:
            self.active_honeypots[ip_address]['interactions'] += 1
            self.honeypot_interactions[ip_address].append({
                'timestamp': datetime.utcnow(),
                'data': interaction_data
            })

class AutomatedResponder:
    """Automated threat response system"""
    
    def __init__(self):
        self.response_history = deque(maxlen=1000)
        
    def execute_response(self, threat: SecurityThreat):
        """Execute automated response to threat"""
        response_actions = []
        
        if threat.recommended_action == SecurityAction.BLOCK:
            response_actions.append(self._block_ip(threat.ip_address))
        
        elif threat.recommended_action == SecurityAction.QUARANTINE:
            response_actions.append(self._quarantine_ip(threat.ip_address))
        
        elif threat.recommended_action == SecurityAction.CHALLENGE:
            response_actions.append(self._deploy_challenge(threat.ip_address))
        
        elif threat.recommended_action == SecurityAction.THROTTLE:
            response_actions.append(self._apply_rate_limit(threat.ip_address))
        
        # Record response
        self.response_history.append({
            'threat_id': threat.id,
            'timestamp': datetime.utcnow(),
            'actions': response_actions,
            'threat_level': threat.threat_level.value
        })
    
    def _block_ip(self, ip_address: str) -> str:
        """Block IP address"""
        # Implementation would integrate with firewall/load balancer
        return f"Blocked IP {ip_address}"
    
    def _quarantine_ip(self, ip_address: str) -> str:
        """Quarantine IP address"""
        # Implementation would isolate IP in quarantine network
        return f"Quarantined IP {ip_address}"
    
    def _deploy_challenge(self, ip_address: str) -> str:
        """Deploy challenge for IP address"""
        # Implementation would present CAPTCHA or similar challenge
        return f"Deployed challenge for IP {ip_address}"
    
    def _apply_rate_limit(self, ip_address: str) -> str:
        """Apply rate limiting to IP address"""
        # Implementation would configure rate limiting rules
        return f"Applied rate limiting to IP {ip_address}"

# Global advanced security system instance
advanced_security = SuperAdvancedSecuritySystem()
