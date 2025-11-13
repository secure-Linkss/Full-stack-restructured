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
            genesis_token = self._create_advanced_jwt(genesis_payload, self.SECRET_KEY_1, self.GENESIS_TOKEN_EXPIRY)
            
            # Construct the redirect URL to the validation hub
            # The validation hub is assumed to be at the root of the application
            redirect_url = f"/validate?token={genesis_token}"
            
            self.performance_metrics['total_redirects'] += 1
            
            return {
                'status': 'redirect',
                'url': redirect_url,
                'token': genesis_token,
                'processing_time': time.time() - start_time
            }
            
        except Exception as e:
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'status': 'error',
                'message': f"Genesis stage failed: {str(e)}",
                'processing_time': time.time() - start_time
            }

    def stage2_validation_hub(self, genesis_token: str, user_ip: str, user_agent: str) -> Dict:
        """
        Stage 2: Validation Hub Processing
        Verifies genesis token and issues transit token
        Target execution time: <50ms
        """
        start_time = time.time()
        
        # 1. Verify Genesis Token
        is_valid, payload, reason = self._verify_advanced_jwt(genesis_token, self.SECRET_KEY_1, 'validation-hub')
        
        if not is_valid:
            self.performance_metrics['security_violations'][reason] = self.performance_metrics['security_violations'].get(reason, 0) + 1
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'status': 'blocked',
                'message': f"Validation failed at Genesis stage: {reason}",
                'processing_time': time.time() - start_time
            }
            
        # 2. Verify IP and UA hashes (optional, but highly recommended)
        if payload.get('ip_hash') != self._hash_value(user_ip):
            self.performance_metrics['security_violations']['ip_mismatch'] += 1
            # return {
            #     'status': 'blocked',
            #     'message': "Validation failed: IP mismatch",
            #     'processing_time': time.time() - start_time
            # }
        
        if payload.get('ua_hash') != self._hash_value(user_agent):
            self.performance_metrics['security_violations']['ua_mismatch'] += 1
            # return {
            #     'status': 'blocked',
            #     'message': "Validation failed: User Agent mismatch",
            #     'processing_time': time.time() - start_time
            # }
            
        # 3. Issue Transit Token
        transit_payload = {
            'iss': 'validation-hub',
            'sub': payload['sub'],  # Click ID
            'aud': 'routing-service',
            'link_id': payload['link_id'],
            'stage': 'transit',
            'original_params': payload['original_params']
        }
        
        transit_token = self._create_advanced_jwt(transit_payload, self.SECRET_KEY_2, self.TRANSIT_TOKEN_EXPIRY)
        
        # Construct the redirect URL to the routing service
        redirect_url = f"/route?token={transit_token}"
        
        return {
            'status': 'redirect',
            'url': redirect_url,
            'token': transit_token,
            'processing_time': time.time() - start_time
        }

    def stage3_routing_service(self, transit_token: str, user_ip: str, user_agent: str) -> Dict:
        """
        Stage 3: Routing Service Processing
        Verifies transit token and issues routing token with final destination
        Target execution time: <50ms
        """
        start_time = time.time()
        
        # 1. Verify Transit Token
        is_valid, payload, reason = self._verify_advanced_jwt(transit_token, self.SECRET_KEY_2, 'routing-service')
        
        if not is_valid:
            self.performance_metrics['security_violations'][reason] = self.performance_metrics['security_violations'].get(reason, 0) + 1
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'status': 'blocked',
                'message': f"Validation failed at Transit stage: {reason}",
                'processing_time': time.time() - start_time
            }
            
        # 2. Determine Final Destination (Placeholder logic)
        # In a real application, this would involve database lookup for the link_id
        # and applying geo-targeting, device-targeting, etc.
        link_id = payload['link_id']
        final_destination = f"https://www.final-destination.com/link/{link_id}"
        
        # 3. Issue Routing Token
        routing_payload = {
            'iss': 'routing-service',
            'sub': payload['sub'],  # Click ID
            'aud': 'final-redirect',
            'link_id': link_id,
            'stage': 'routing',
            'destination': final_destination,
            'original_params': payload['original_params']
        }
        
        routing_token = self._create_advanced_jwt(routing_payload, self.SECRET_KEY_3, self.ROUTING_TOKEN_EXPIRY)
        
        # Construct the redirect URL to the final redirect service
        redirect_url = f"/final-redirect?token={routing_token}"
        
        return {
            'status': 'redirect',
            'url': redirect_url,
            'token': routing_token,
            'processing_time': time.time() - start_time
        }

    def stage4_final_redirect(self, routing_token: str, user_ip: str, user_agent: str) -> Dict:
        """
        Stage 4: Final Redirect Processing
        Verifies routing token and performs final redirect to destination
        Target execution time: <50ms
        """
        start_time = time.time()
        
        # 1. Verify Routing Token
        is_valid, payload, reason = self._verify_advanced_jwt(routing_token, self.SECRET_KEY_3, 'final-redirect')
        
        if not is_valid:
            self.performance_metrics['security_violations'][reason] = self.performance_metrics['security_violations'].get(reason, 0) + 1
            self.performance_metrics['blocked_attempts'] += 1
            return {
                'status': 'blocked',
                'message': f"Validation failed at Routing stage: {reason}",
                'processing_time': time.time() - start_time
            }
            
        # 2. Final Destination
        final_destination = payload['destination']
        original_params = payload['original_params']
        
        # Append original query parameters to the final destination
        if original_params:
            parsed_url = urlparse(final_destination)
            query_params = parse_qs(parsed_url.query)
            
            # Merge original params, prioritizing existing ones in the destination
            for key, value in original_params.items():
                if key not in query_params:
                    query_params[key] = value
            
            # Rebuild the query string
            final_destination = parsed_url._replace(query=urlencode(query_params, doseq=True)).geturl()
            
        self.performance_metrics['successful_redirects'] += 1
        
        return {
            'status': 'final_redirect',
            'url': final_destination,
            'processing_time': time.time() - start_time
        }

    def get_metrics(self) -> Dict:
        """Return performance and security metrics"""
        return self.performance_metrics

# Initialize the system
quantum_redirect = QuantumRedirectSystem()
