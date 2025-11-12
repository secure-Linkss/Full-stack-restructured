"""
QUANTUM REDIRECT SYSTEM - PRODUCTION VERSION
Super advanced 4-stage cryptographic verification and tracking system
Designed for maximum security, data fidelity, and speed (<3 seconds total)
USES NEON DATABASE INSTEAD OF REDIS FOR PRODUCTION
"""

import jwt
import time
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode, urlparse, parse_qs
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os

# Database connection for nonce storage
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager

class QuantumRedirectSystem:
    def __init__(self):
        # Multi-layer cryptographic keys
        self.SECRET_KEY_1 = os.environ.get('QUANTUM_SECRET_1', 'quantum_genesis_key_2025_ultra_secure')
        self.SECRET_KEY_2 = os.environ.get('QUANTUM_SECRET_2', 'quantum_transit_key_2025_ultra_secure')
        self.SECRET_KEY_3 = os.environ.get('QUANTUM_SECRET_3', 'quantum_routing_key_2025_ultra_secure')
        
        # Use Neon Database for nonce verification (replacing Redis)
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            # Parse database URL
            parsed = urlparse(database_url)
            try:
                self.db_pool = psycopg2.pool.SimpleConnectionPool(
                    1, 20,
                    host=parsed.hostname,
                    port=parsed.port or 5432,
                    database=parsed.path[1:],
                    user=parsed.username,
                    password=parsed.password,
                    sslmode='require'
                )
                self._ensure_nonce_table()
                print("✓ Quantum Redirect using Neon Database for nonce storage")
            except Exception as e:
                print(f"⚠ Database connection failed, using memory cache: {e}")
                self.db_pool = None
                self._memory_cache = {}
        else:
            # Fallback to in-memory cache for development
            self.db_pool = None
            self._memory_cache = {}
        
        # Advanced configuration
        self.GENESIS_TOKEN_EXPIRY = 15  # seconds
        self.TRANSIT_TOKEN_EXPIRY = 10  # seconds
        self.ROUTING_TOKEN_EXPIRY = 5   # seconds
        self.NONCE_CACHE_TTL = 60       # seconds
        
        # Performance tracking
        self.performance_metrics = {
            'total_redirects': 0,
            'successful_redirects': 0,
            'blocked_attempts': 0,
            'average_processing_time': 0,
            'security_violations': {
                'invalid_signature': 0,
                'expired_token': 0,
                'ip_mismatch': 0,
                'ua_mismatch': 0,
                'replay_attack': 0,
                'invalid_audience': 0
            }
        }

    @contextmanager
    def _get_db_connection(self):
        """Get database connection from pool"""
        conn = None
        try:
            if self.db_pool:
                conn = self.db_pool.getconn()
                yield conn
            else:
                yield None
        finally:
            if conn and self.db_pool:
                self.db_pool.putconn(conn)

    def _ensure_nonce_table(self):
        """Ensure nonce table exists in Neon database"""
        try:
            with self._get_db_connection() as conn:
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS quantum_nonces (
                                nonce VARCHAR(255) PRIMARY KEY,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                expires_at TIMESTAMP NOT NULL
                            );
                            CREATE INDEX IF NOT EXISTS idx_quantum_nonces_expires 
                            ON quantum_nonces(expires_at);
                        """)
                        conn.commit()
        except Exception as e:
            print(f"Warning: Could not create nonce table: {e}")

    def _hash_value(self, value: str) -> str:
        """Create SHA-256 hash of a value for security"""
        return hashlib.sha256(value.encode()).hexdigest()

    def _generate_nonce(self) -> str:
        """Generate cryptographically secure nonce"""
        return secrets.token_urlsafe(32)

    def _store_nonce(self, nonce: str) -> None:
        """Store nonce in Neon database to prevent replay attacks"""
        try:
            with self._get_db_connection() as conn:
                if conn:
                    with conn.cursor() as cursor:
                        expires_at = datetime.utcnow() + timedelta(seconds=self.NONCE_CACHE_TTL)
                        cursor.execute("""
                            INSERT INTO quantum_nonces (nonce, expires_at) 
                            VALUES (%s, %s)
                            ON CONFLICT (nonce) DO NOTHING
                        """, (nonce, expires_at))
                        conn.commit()
                        
                        # Clean old nonces periodically
                        cursor.execute("""
                            DELETE FROM quantum_nonces 
                            WHERE expires_at < CURRENT_TIMESTAMP
                        """)
                        conn.commit()
                else:
                    # Fallback to memory cache
                    current_time = time.time()
                    self._memory_cache[nonce] = current_time
                    # Clean old entries
                    self._memory_cache = {
                        k: v for k, v in self._memory_cache.items() 
                        if current_time - v < self.NONCE_CACHE_TTL
                    }
        except Exception as e:
            # Fallback to memory on error
            current_time = time.time()
            self._memory_cache[nonce] = current_time

    def _check_nonce(self, nonce: str) -> bool:
        """Check if nonce has been used before (replay attack detection)"""
        try:
            with self._get_db_connection() as conn:
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT 1 FROM quantum_nonces 
                            WHERE nonce = %s AND expires_at > CURRENT_TIMESTAMP
                        """, (nonce,))
                        return cursor.fetchone() is not None
                else:
                    # Fallback to memory cache
                    current_time = time.time()
                    return nonce in self._memory_cache and (current_time - self._memory_cache[nonce]) < self.NONCE_CACHE_TTL
        except Exception as e:
            # Fallback to memory on error
            current_time = time.time()
            return nonce in self._memory_cache and (current_time - self._memory_cache[nonce]) < self.NONCE_CACHE_TTL

    def _create_advanced_jwt(self, payload: Dict, secret_key: str, expiry_seconds: int) -> str:
        """Create advanced JWT with comprehensive security claims"""
        now = datetime.utcnow()
        
        jwt_payload = {
            **payload,
            'iat': now,  # Issued at
            'exp': now + timedelta(seconds=expiry_seconds),  # Expiration
            'nbf': now,  # Not before
            'jti': self._generate_nonce(),  # JWT ID for uniqueness
        }
        
        return jwt.encode(
            jwt_payload, 
            secret_key, 
            algorithm='HS256',
            headers={'typ': 'JWT', 'alg': 'HS256'}
        )

    def _verify_advanced_jwt(self, token: str, secret_key: str, expected_audience: str) -> Tuple[bool, Optional[Dict], str]:
        """Verify JWT with comprehensive security checks"""
        try:
            # Decode and verify signature
            payload = jwt.decode(
                token, 
                secret_key, 
                algorithms=['HS256'],
                options={'verify_exp': True, 'verify_nbf': True}
            )
            
            # Verify audience
            if payload.get('aud') != expected_audience:
                return False, None, "invalid_audience"
            
            # Check for replay attack
            jti = payload.get('jti')
            if jti and self._check_nonce(jti):
                return False, None, "replay_attack"
            
            # Store nonce to prevent future replay
            if jti:
                self._store_nonce(jti)
            
            return True, payload, "valid"
            
        except jwt.ExpiredSignatureError:
            return False, None, "expired_token"
        except jwt.InvalidTokenError:
            return False, None, "invalid_signature"
        except Exception as e:
            return False, None, f"verification_error: {str(e)}"

    def stage1_genesis_link(self, link_id: str, user_ip: str, user_agent: str, referrer: str = '', original_params: Dict = None) -> Dict:
        """
        Stage 1: Genesis Link Processing
        Creates cryptographically signed JWT and redirects to validation hub
        Target execution time: <100ms
        """
        start_time = time.time()
        
        try:
            # Generate unique click ID
            click_id = f"{link_id}_{int(time.time() * 1000)}_{secrets.token_hex(8)}"
            nonce = self._generate_nonce()
            
            # Ensure original_params is not None
            if original_params is None:
                original_params = {}
            
            # Create genesis token payload
            genesis_payload = {
                'iss': 'genesis-link-generator',
                'sub': click_id,
                'aud': 'validation-hub',
                'nonce': nonce,
                'ip_hash': self._hash_value(user_ip),
                'ua_hash': self._hash_value(user_agent),
                'link_id': link_id,
                'referrer': referrer,
                'stage': 'genesis',
                'original_params': original_params  # CRITICAL: Store original parameters
            }
            
            # Create signed JWT
            genesis_token = self._create_advanced_jwt(
                genesis_payload, 
                self.SECRET_KEY_1, 
                self.GENESIS_TOKEN_EXPIRY
            )
            
            # Update performance metrics
            self.performance_metrics['total_redirects'] += 1
            
            # Generate validation hub URL (using same domain)
            validation_url = f"/validate?token={genesis_token}"
            
            return {
                'success': True,
                'redirect_url': validation_url,
                'click_id': click_id,
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'genesis_complete'
            }
            
        except Exception as e:
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'success': False,
                'error': f"Genesis stage failed: {str(e)}",
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'genesis_failed'
            }

    def stage2_validation_hub(self, genesis_token: str, current_ip: str, current_user_agent: str, lenient_mode: bool = True) -> Dict:
        """
        Stage 2: Validation Hub Processing
        Ruthless validation of traffic with cryptographic verification
        Target execution time: <150ms
        lenient_mode: If True, allows IP/UA mismatches (for development/proxies)
        """
        start_time = time.time()
        
        try:
            # Verify genesis token
            is_valid, payload, error_reason = self._verify_advanced_jwt(
                genesis_token, 
                self.SECRET_KEY_1, 
                'validation-hub'
            )
            
            if not is_valid:
                self.performance_metrics['security_violations'][error_reason] += 1
                self.performance_metrics['blocked_attempts'] += 1
                return {
                    'success': False,
                    'error': f"Token validation failed: {error_reason}",
                    'processing_time_ms': (time.time() - start_time) * 1000,
                    'stage': 'validation_failed',
                    'security_violation': error_reason,
                    'click_id': payload.get('sub') if payload else None
                }
            
            # Contextual verification - IP and User-Agent matching
            current_ip_hash = self._hash_value(current_ip)
            current_ua_hash = self._hash_value(current_user_agent)
            
            ip_mismatch = payload['ip_hash'] != current_ip_hash
            ua_mismatch = payload['ua_hash'] != current_ua_hash
            
            if ip_mismatch and not lenient_mode:
                self.performance_metrics['security_violations']['ip_mismatch'] += 1
                self.performance_metrics['blocked_attempts'] += 1
                return {
                    'success': False,
                    'error': "IP address mismatch - potential token interception",
                    'processing_time_ms': (time.time() - start_time) * 1000,
                    'stage': 'validation_failed',
                    'security_violation': 'ip_mismatch',
                    'click_id': payload['sub']
                }
            
            if ua_mismatch and not lenient_mode:
                self.performance_metrics['security_violations']['ua_mismatch'] += 1
                self.performance_metrics['blocked_attempts'] += 1
                return {
                    'success': False,
                    'error': "User-Agent mismatch - potential bot activity",
                    'processing_time_ms': (time.time() - start_time) * 1000,
                    'stage': 'validation_failed',
                    'security_violation': 'ua_mismatch',
                    'click_id': payload['sub']
                }
            
            if lenient_mode and (ip_mismatch or ua_mismatch):
                print(f"Warning: IP/UA mismatch in lenient mode for click {payload['sub']}")
            
            # Generate transit token for routing gateway
            transit_payload = {
                'iss': 'validation-hub',
                'sub': payload['sub'],  # Original click ID
                'aud': 'routing-gateway',
                'link_id': payload['link_id'],
                'validated_at': datetime.utcnow().isoformat(),
                'stage': 'transit',
                'security_score': 100,  # Passed all validations
                'original_params': payload.get('original_params', {})  # Pass original params
            }
            
            transit_token = self._create_advanced_jwt(
                transit_payload,
                self.SECRET_KEY_2,
                self.TRANSIT_TOKEN_EXPIRY
            )
            
            # Generate routing gateway URL (using same domain)
            routing_url = f"/route?transit_token={transit_token}"
            
            return {
                'success': True,
                'redirect_url': routing_url,
                'click_id': payload['sub'],
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'validation_complete'
            }
            
        except Exception as e:
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'success': False,
                'error': f"Validation stage failed: {str(e)}",
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'validation_failed'
            }

    def stage3_routing_gateway(self, transit_token: str, tracking_params: Dict = None) -> Dict:
        """
        Stage 3: Routing Gateway Processing
        Final decision making and commercial tracking parameter injection
        Target execution time: <100ms
        """
        start_time = time.time()
        
        try:
            # Verify transit token
            is_valid, payload, error_reason = self._verify_advanced_jwt(
                transit_token,
                self.SECRET_KEY_2,
                'routing-gateway'
            )
            
            if not is_valid:
                self.performance_metrics['security_violations'][error_reason] += 1
                self.performance_metrics['blocked_attempts'] += 1
                return {
                    'success': False,
                    'error': f"Transit token validation failed: {error_reason}",
                    'processing_time_ms': (time.time() - start_time) * 1000,
                    'stage': 'routing_failed',
                    'security_violation': error_reason,
                    'click_id': payload.get('sub') if payload else None
                }
            
            # Get link configuration from database
            link_config = self._get_link_configuration(payload['link_id'])
            
            if not link_config:
                return {
                    'success': False,
                    'error': "Link configuration not found",
                    'processing_time_ms': (time.time() - start_time) * 1000,
                    'stage': 'routing_failed',
                    'click_id': payload['sub']
                }
            
            # Get original parameters from JWT payload
            original_params = payload.get('original_params', {})
            
            # Merge original parameters with tracking parameters
            all_params = {**(tracking_params or {}), **original_params}
            
            # Build final URL with ALL parameters (original + tracking)
            final_url = self._build_final_url(
                link_config['destination_url'],
                payload['sub'],  # click_id
                all_params  # Include original parameters
            )
            
            # Update success metrics
            self.performance_metrics['successful_redirects'] += 1
            
            return {
                'success': True,
                'final_url': final_url,
                'click_id': payload['sub'],
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'routing_complete'
            }
            
        except Exception as e:
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'success': False,
                'error': f"Routing stage failed: {str(e)}",
                'processing_time_ms': (time.time() - start_time) * 1000,
                'stage': 'routing_failed'
            }

    def _get_link_configuration(self, link_id: str) -> Optional[Dict]:
        """Get link configuration from Neon database"""
        try:
            with self._get_db_connection() as conn:
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT target_url, short_code 
                            FROM links 
                            WHERE id = %s AND status = 'active'
                        """, (link_id,))
                        result = cursor.fetchone()
                        if result:
                            return {
                                'destination_url': result[0],
                                'short_code': result[1],
                                'tracking_enabled': True
                            }
        except Exception as e:
            print(f"Error fetching link configuration: {e}")
        return None

    def _build_final_url(self, base_url: str, click_id: str, additional_params: Dict) -> str:
        """Build final URL with all tracking parameters - PRESERVING ORIGINAL PARAMETERS"""
        # Parse existing URL
        parsed = urlparse(base_url)
        existing_params = parse_qs(parsed.query)
        
        # Add quantum tracking parameters (only if not overridden by original params)
        quantum_params = {
            'quantum_click_id': click_id,
            'quantum_timestamp': str(int(time.time())),
            'quantum_verified': 'true'
        }
        
        # Start with quantum parameters as base
        all_params = quantum_params.copy()
        
        # Add existing URL parameters (from destination URL)
        for key, values in existing_params.items():
            if values:
                all_params[key] = values[0]
        
        # CRITICAL: Original parameters take HIGHEST PRIORITY
        # This ensures user_id, email, campaign_id, pixel_id are preserved
        if additional_params:
            all_params.update(additional_params)
        
        # Build final URL
        query_string = urlencode(all_params)
        final_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if query_string:
            final_url += f"?{query_string}"
        
        return final_url

    def get_performance_metrics(self) -> Dict:
        """Get comprehensive performance and security metrics"""
        total_attempts = self.performance_metrics['total_redirects']
        if total_attempts > 0:
            success_rate = (self.performance_metrics['successful_redirects'] / total_attempts) * 100
            block_rate = (self.performance_metrics['blocked_attempts'] / total_attempts) * 100
        else:
            success_rate = 0
            block_rate = 0
        
        return {
            **self.performance_metrics,
            'success_rate_percentage': round(success_rate, 2),
            'block_rate_percentage': round(block_rate, 2),
            'security_effectiveness': round(block_rate, 2),
            'system_health': 'excellent' if success_rate > 95 else 'good' if success_rate > 85 else 'needs_attention'
        }

    def analyze_security_threats(self) -> Dict:
        """Analyze security threat patterns"""
        violations = self.performance_metrics['security_violations']
        total_violations = sum(violations.values())
        
        if total_violations == 0:
            return {
                'threat_level': 'minimal',
                'primary_threats': [],
                'recommendations': ['System is secure - continue monitoring'],
                'total_violations': 0
            }
        
        # Calculate threat percentages
        threat_analysis = {}
        for threat_type, count in violations.items():
            if count > 0:
                percentage = (count / total_violations) * 100
                threat_analysis[threat_type] = {
                    'count': count,
                    'percentage': round(percentage, 2)
                }
        
        # Determine primary threats
        primary_threats = sorted(
            threat_analysis.items(),
            key=lambda x: x[1]['count'],
            reverse=True
        )[:3]
        
        # Generate recommendations
        recommendations = []
        for threat_type, data in primary_threats:
            if threat_type == 'replay_attack':
                recommendations.append("Implement stricter nonce validation and reduce token expiry times")
            elif threat_type == 'ip_mismatch':
                recommendations.append("Investigate potential token interception or proxy usage")
            elif threat_type == 'ua_mismatch':
                recommendations.append("Enhanced bot detection - possible automated traffic")
            elif threat_type == 'expired_token':
                recommendations.append("Users may be using cached/bookmarked links - consider education")
        
        # Determine overall threat level
        if total_violations > 100:
            threat_level = 'high'
        elif total_violations > 50:
            threat_level = 'medium'
        else:
            threat_level = 'low'
        
        return {
            'threat_level': threat_level,
            'total_violations': total_violations,
            'threat_breakdown': threat_analysis,
            'primary_threats': [{'type': t[0], **t[1]} for t in primary_threats],
            'recommendations': recommendations
        }

# Global quantum redirect system instance
quantum_redirect = QuantumRedirectSystem()
