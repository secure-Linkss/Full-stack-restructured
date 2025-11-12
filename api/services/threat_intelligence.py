"""
ADVANCED AI-POWERED THREAT INTELLIGENCE SYSTEM
Self-contained threat detection with machine learning principles
"""

import hashlib
import json
import time
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Optional
import math
import random

class AdvancedThreatIntelligence:
    def __init__(self):
        # Threat scoring weights
        self.weights = {
            'fingerprint_anomaly': 0.25,
            'behavioral_anomaly': 0.30,
            'network_reputation': 0.20,
            'temporal_patterns': 0.15,
            'geolocation_anomaly': 0.10
        }
        
        # Known threat patterns
        self.threat_patterns = {
            'bot_user_agents': [
                'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 
                'requests', 'scrapy', 'selenium', 'phantomjs', 'headless'
            ],
            'suspicious_headers': [
                'x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'
            ],
            'vpn_indicators': [
                'vpn', 'proxy', 'tunnel', 'anonymous', 'hide', 'mask'
            ]
        }
        
        # Behavioral baselines (learned from normal traffic)
        self.behavioral_baselines = {
            'avg_session_duration': 45.0,
            'avg_clicks_per_session': 1.2,
            'common_devices': ['Desktop', 'Mobile'],
            'common_browsers': ['Chrome', 'Safari', 'Firefox', 'Edge'],
            'normal_countries': ['United States', 'Canada', 'United Kingdom', 'Germany']
        }

    def analyze_threat_level(self, request_data: Dict) -> Dict:
        """
        Comprehensive threat analysis using multiple detection vectors
        Returns threat score (0-100) and detailed analysis
        """
        threat_score = 0.0
        analysis_details = {
            'fingerprint_score': 0,
            'behavioral_score': 0,
            'network_score': 0,
            'temporal_score': 0,
            'geo_score': 0,
            'threat_indicators': [],
            'risk_level': 'low',
            'recommended_action': 'allow'
        }
        
        # 1. ADVANCED FINGERPRINT ANALYSIS
        fingerprint_score = self._analyze_fingerprint_anomalies(request_data)
        analysis_details['fingerprint_score'] = fingerprint_score
        threat_score += fingerprint_score * self.weights['fingerprint_anomaly']
        
        # 2. BEHAVIORAL PATTERN ANALYSIS
        behavioral_score = self._analyze_behavioral_patterns(request_data)
        analysis_details['behavioral_score'] = behavioral_score
        threat_score += behavioral_score * self.weights['behavioral_anomaly']
        
        # 3. NETWORK REPUTATION ANALYSIS
        network_score = self._analyze_network_reputation(request_data)
        analysis_details['network_score'] = network_score
        threat_score += network_score * self.weights['network_reputation']
        
        # 4. TEMPORAL PATTERN ANALYSIS
        temporal_score = self._analyze_temporal_patterns(request_data)
        analysis_details['temporal_score'] = temporal_score
        threat_score += temporal_score * self.weights['temporal_patterns']
        
        # 5. GEOLOCATION ANOMALY ANALYSIS
        geo_score = self._analyze_geolocation_anomalies(request_data)
        analysis_details['geo_score'] = geo_score
        threat_score += geo_score * self.weights['geolocation_anomaly']
        
        # Final threat assessment
        analysis_details['total_threat_score'] = min(threat_score, 100.0)
        analysis_details['risk_level'] = self._calculate_risk_level(threat_score)
        analysis_details['recommended_action'] = self._recommend_action(threat_score)
        
        return analysis_details

    def _analyze_fingerprint_anomalies(self, request_data: Dict) -> float:
        """Advanced browser fingerprinting analysis"""
        score = 0.0
        user_agent = request_data.get('user_agent', '').lower()
        headers = request_data.get('headers', {})
        
        # Bot detection in user agent
        for bot_pattern in self.threat_patterns['bot_user_agents']:
            if bot_pattern in user_agent:
                score += 30.0
                break
        
        # Suspicious header analysis
        suspicious_header_count = 0
        for header in self.threat_patterns['suspicious_headers']:
            if header in [h.lower() for h in headers.keys()]:
                suspicious_header_count += 1
        
        if suspicious_header_count > 0:
            score += suspicious_header_count * 15.0
        
        # User agent consistency check
        if self._is_user_agent_inconsistent(user_agent):
            score += 25.0
        
        # Missing common headers (indicates automation)
        common_headers = ['accept', 'accept-language', 'accept-encoding']
        missing_headers = sum(1 for h in common_headers if h not in [k.lower() for k in headers.keys()])
        score += missing_headers * 10.0
        
        return min(score, 100.0)

    def _analyze_behavioral_patterns(self, request_data: Dict) -> float:
        """Behavioral anomaly detection"""
        score = 0.0
        
        # Click velocity analysis
        click_velocity = request_data.get('click_velocity', 0)
        if click_velocity > 0:
            # Too fast clicking (< 1 second between clicks)
            if click_velocity < 1.0:
                score += 40.0
            # Too slow clicking (> 300 seconds between clicks)
            elif click_velocity > 300.0:
                score += 20.0
        
        # Session duration anomalies
        session_duration = request_data.get('session_duration', 0)
        if session_duration > 0:
            baseline_duration = self.behavioral_baselines['avg_session_duration']
            deviation = abs(session_duration - baseline_duration) / baseline_duration
            if deviation > 2.0:  # More than 200% deviation
                score += 25.0
        
        # Device/browser consistency
        device_type = request_data.get('device_type', '')
        browser = request_data.get('browser', '')
        
        if device_type not in self.behavioral_baselines['common_devices']:
            score += 15.0
        
        if browser not in self.behavioral_baselines['common_browsers']:
            score += 10.0
        
        return min(score, 100.0)

    def _analyze_network_reputation(self, request_data: Dict) -> float:
        """Network and IP reputation analysis"""
        score = 0.0
        ip_address = request_data.get('ip_address', '')
        
        # Check for private/internal IPs (suspicious for external traffic)
        if self._is_private_ip(ip_address):
            score += 30.0
        
        # Check for known VPN/proxy patterns
        isp = request_data.get('isp', '').lower()
        organization = request_data.get('organization', '').lower()
        
        for vpn_indicator in self.threat_patterns['vpn_indicators']:
            if vpn_indicator in isp or vpn_indicator in organization:
                score += 35.0
                break
        
        # Hosting provider detection (often used by bots)
        hosting_indicators = ['amazon', 'google cloud', 'microsoft', 'digitalocean', 'linode', 'vultr']
        for indicator in hosting_indicators:
            if indicator in isp or indicator in organization:
                score += 25.0
                break
        
        # Multiple requests from same IP (rate limiting check)
        request_count = request_data.get('recent_request_count', 1)
        if request_count > 10:  # More than 10 requests recently
            score += min(request_count * 2, 40.0)
        
        return min(score, 100.0)

    def _analyze_temporal_patterns(self, request_data: Dict) -> float:
        """Temporal behavior analysis"""
        score = 0.0
        timestamp = request_data.get('timestamp', time.time())
        
        # Convert to datetime
        dt = datetime.fromtimestamp(timestamp)
        hour = dt.hour
        
        # Unusual time patterns (3 AM - 6 AM is suspicious for most regions)
        if 3 <= hour <= 6:
            score += 20.0
        
        # Weekend vs weekday patterns
        weekday = dt.weekday()
        if weekday >= 5:  # Weekend
            score += 10.0
        
        # Rapid successive requests
        last_request_time = request_data.get('last_request_time', 0)
        if last_request_time > 0:
            time_diff = timestamp - last_request_time
            if time_diff < 0.5:  # Less than 500ms between requests
                score += 30.0
        
        return min(score, 100.0)

    def _analyze_geolocation_anomalies(self, request_data: Dict) -> float:
        """Geolocation and travel pattern analysis"""
        score = 0.0
        country = request_data.get('country', '')
        
        # Unusual countries for typical traffic
        if country not in self.behavioral_baselines['normal_countries']:
            score += 15.0
        
        # High-risk countries (known for bot traffic)
        high_risk_countries = ['Unknown', 'Anonymous Proxy', 'Satellite Provider']
        if country in high_risk_countries:
            score += 40.0
        
        # Impossible travel detection
        last_country = request_data.get('last_known_country', '')
        last_location_time = request_data.get('last_location_time', 0)
        current_time = request_data.get('timestamp', time.time())
        
        if last_country and last_country != country and last_location_time > 0:
            time_diff_hours = (current_time - last_location_time) / 3600
            if time_diff_hours < 2:  # Same user in different countries within 2 hours
                score += 35.0
        
        return min(score, 100.0)

    def _is_user_agent_inconsistent(self, user_agent: str) -> bool:
        """Check for user agent inconsistencies"""
        # Look for version mismatches, impossible combinations
        patterns = [
            r'Chrome/(\d+).*Safari/(\d+)',  # Chrome should have Safari in UA
            r'Firefox/(\d+).*Chrome/(\d+)',  # Firefox and Chrome together is suspicious
            r'Windows NT.*Mac OS X',  # Multiple OS in one UA
            r'Mobile.*Desktop',  # Contradictory device types
        ]
        
        for pattern in patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return True
        
        return False

    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP is in private ranges"""
        private_ranges = [
            '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
            '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
            '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
            '127.', '169.254.'
        ]
        
        return any(ip.startswith(prefix) for prefix in private_ranges)

    def _calculate_risk_level(self, threat_score: float) -> str:
        """Calculate risk level based on threat score"""
        if threat_score >= 80:
            return 'critical'
        elif threat_score >= 60:
            return 'high'
        elif threat_score >= 40:
            return 'medium'
        elif threat_score >= 20:
            return 'low'
        else:
            return 'minimal'

    def _recommend_action(self, threat_score: float) -> str:
        """Recommend action based on threat score"""
        if threat_score >= 80:
            return 'block'
        elif threat_score >= 60:
            return 'challenge'  # CAPTCHA or additional verification
        elif threat_score >= 40:
            return 'monitor'    # Allow but log extensively
        else:
            return 'allow'

    def generate_honeypot_traps(self) -> Dict:
        """Generate honeypot traps to catch bots"""
        return {
            'invisible_fields': [
                'email_confirm',  # Hidden email field
                'phone_backup',   # Hidden phone field
                'website_url',    # Hidden URL field (bots often fill this)
            ],
            'time_traps': {
                'min_form_time': 3,  # Minimum seconds to fill form
                'max_form_time': 300  # Maximum reasonable time
            },
            'mouse_traps': {
                'require_mouse_movement': True,
                'require_click_events': True
            }
        }

    def analyze_fingerprint_entropy(self, fingerprint_data: Dict) -> float:
        """Calculate entropy of browser fingerprint for uniqueness detection"""
        # Combine all fingerprint elements
        fp_string = json.dumps(fingerprint_data, sort_keys=True)
        
        # Calculate Shannon entropy
        char_counts = Counter(fp_string)
        total_chars = len(fp_string)
        
        entropy = 0.0
        for count in char_counts.values():
            probability = count / total_chars
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy

# Global threat intelligence instance
threat_intel = AdvancedThreatIntelligence()
