"""
Advanced Crypto Payment Monitoring Service
Uses Web3.py to monitor transaction confirmations across multiple blockchains
"""

from web3 import Web3
from typing import Dict, Optional, Tuple
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CryptoMonitor:
    """Monitor cryptocurrency transactions for payment verification"""
    
    # RPC endpoints for different blockchains (free public endpoints)
    RPC_ENDPOINTS = {
        'BTC': 'https://blockstream.info/api',  # Bitcoin API
        'ETH': os.getenv('ETH_RPC_URL', 'https://eth.llamarpc.com'),  # Ethereum
        'LTC': 'https://blockchair.com/litecoin/api',  # Litecoin
        'USDT': os.getenv('ETH_RPC_URL', 'https://eth.llamarpc.com'),  # USDT on Ethereum
    }
    
    # Confirmation thresholds for different cryptocurrencies
    CONFIRMATION_THRESHOLDS = {
        'BTC': 3,      # 3 confirmations for Bitcoin
        'ETH': 12,     # 12 confirmations for Ethereum
        'LTC': 6,      # 6 confirmations for Litecoin
        'USDT': 12,    # 12 confirmations for USDT (on Ethereum)
    }
    
    # Transaction confirmation times (in minutes, approximate)
    CONFIRMATION_TIMES = {
        'BTC': 10,     # ~10 minutes per confirmation
        'ETH': 0.25,   # ~15 seconds per confirmation
        'LTC': 2.5,    # ~2.5 minutes per confirmation
        'USDT': 0.25,  # ~15 seconds per confirmation (on Ethereum)
    }
    
    def __init__(self):
        """Initialize crypto monitor with Web3 connections"""
        self.web3_eth = None
        self.web3_btc = None
        try:
            # Initialize Ethereum connection
            self.web3_eth = Web3(Web3.HTTPProvider(self.RPC_ENDPOINTS['ETH']))
            if self.web3_eth.is_connected():
                logger.info("Connected to Ethereum RPC")
            else:
                logger.warning("Failed to connect to Ethereum RPC")
        except Exception as e:
            logger.error(f"Error initializing Ethereum connection: {e}")
    
    def check_bitcoin_transaction(self, tx_hash: str) -> Dict:
        """
        Check Bitcoin transaction status and confirmations
        
        Args:
            tx_hash: Bitcoin transaction hash
            
        Returns:
            Dictionary with transaction status, confirmations, and amount
        """
        try:
            import requests
            
            # Use Blockstream API for Bitcoin
            url = f"{self.RPC_ENDPOINTS['BTC']}/tx/{tx_hash}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract relevant information
                confirmations = data.get('status', {}).get('confirmed', False)
                block_height = data.get('status', {}).get('block_height', 0)
                
                return {
                    'status': 'confirmed' if confirmations else 'pending',
                    'confirmations': block_height,
                    'amount': sum(output['value'] for output in data.get('vout', [])) / 100000000,  # Convert satoshis to BTC
                    'timestamp': data.get('status', {}).get('block_time', 0),
                    'is_valid': True
                }
            else:
                return {
                    'status': 'not_found',
                    'confirmations': 0,
                    'is_valid': False,
                    'error': 'Transaction not found'
                }
        except Exception as e:
            logger.error(f"Error checking Bitcoin transaction: {e}")
            return {
                'status': 'error',
                'confirmations': 0,
                'is_valid': False,
                'error': str(e)
            }
    
    def check_ethereum_transaction(self, tx_hash: str) -> Dict:
        """
        Check Ethereum transaction status and confirmations
        
        Args:
            tx_hash: Ethereum transaction hash
            
        Returns:
            Dictionary with transaction status, confirmations, and amount
        """
        try:
            if not self.web3_eth or not self.web3_eth.is_connected():
                return {
                    'status': 'error',
                    'confirmations': 0,
                    'is_valid': False,
                    'error': 'Ethereum connection unavailable'
                }
            
            # Ensure tx_hash has 0x prefix
            if not tx_hash.startswith('0x'):
                tx_hash = '0x' + tx_hash
            
            # Get transaction receipt
            tx_receipt = self.web3_eth.eth.get_transaction_receipt(tx_hash)
            
            if tx_receipt is None:
                return {
                    'status': 'pending',
                    'confirmations': 0,
                    'is_valid': True
                }
            
            # Get current block number
            current_block = self.web3_eth.eth.block_number
            confirmations = current_block - tx_receipt['blockNumber']
            
            # Get transaction details
            tx = self.web3_eth.eth.get_transaction(tx_hash)
            amount = self.web3_eth.from_wei(tx['value'], 'ether')
            
            return {
                'status': 'confirmed' if confirmations > 0 else 'pending',
                'confirmations': confirmations,
                'amount': float(amount),
                'timestamp': tx_receipt['blockNumber'],
                'is_valid': True,
                'gas_used': tx_receipt['gasUsed']
            }
        except Exception as e:
            logger.error(f"Error checking Ethereum transaction: {e}")
            return {
                'status': 'error',
                'confirmations': 0,
                'is_valid': False,
                'error': str(e)
            }
    
    def check_litecoin_transaction(self, tx_hash: str) -> Dict:
        """
        Check Litecoin transaction status and confirmations
        
        Args:
            tx_hash: Litecoin transaction hash
            
        Returns:
            Dictionary with transaction status, confirmations, and amount
        """
        try:
            import requests
            
            # Use Blockchair API for Litecoin
            url = f"{self.RPC_ENDPOINTS['LTC']}/v1/litecoin/transactions/{tx_hash}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('data'):
                    tx_data = data['data'][tx_hash]
                    confirmations = tx_data.get('confirmations', 0)
                    amount = sum(output['value'] for output in tx_data.get('outputs', [])) / 100000000  # Convert to LTC
                    
                    return {
                        'status': 'confirmed' if confirmations > 0 else 'pending',
                        'confirmations': confirmations,
                        'amount': amount,
                        'timestamp': tx_data.get('time', 0),
                        'is_valid': True
                    }
            
            return {
                'status': 'not_found',
                'confirmations': 0,
                'is_valid': False,
                'error': 'Transaction not found'
            }
        except Exception as e:
            logger.error(f"Error checking Litecoin transaction: {e}")
            return {
                'status': 'error',
                'confirmations': 0,
                'is_valid': False,
                'error': str(e)
            }
    
    def check_transaction(self, tx_hash: str, currency: str) -> Dict:
        """
        Check transaction status for any supported cryptocurrency
        
        Args:
            tx_hash: Transaction hash
            currency: Cryptocurrency code (BTC, ETH, LTC, USDT)
            
        Returns:
            Dictionary with transaction status and details
        """
        currency = currency.upper()
        
        if currency == 'BTC':
            return self.check_bitcoin_transaction(tx_hash)
        elif currency in ['ETH', 'USDT']:
            return self.check_ethereum_transaction(tx_hash)
        elif currency == 'LTC':
            return self.check_litecoin_transaction(tx_hash)
        else:
            return {
                'status': 'error',
                'confirmations': 0,
                'is_valid': False,
                'error': f'Unsupported currency: {currency}'
            }
    
    def is_payment_confirmed(self, tx_hash: str, currency: str) -> Tuple[bool, int]:
        """
        Check if a payment has reached the required confirmation threshold
        
        Args:
            tx_hash: Transaction hash
            currency: Cryptocurrency code
            
        Returns:
            Tuple of (is_confirmed: bool, confirmations: int)
        """
        result = self.check_transaction(tx_hash, currency)
        
        if not result['is_valid']:
            return False, 0
        
        required_confirmations = self.CONFIRMATION_THRESHOLDS.get(currency.upper(), 1)
        confirmations = result.get('confirmations', 0)
        
        return confirmations >= required_confirmations, confirmations
    
    def get_estimated_confirmation_time(self, currency: str, current_confirmations: int = 0) -> str:
        """
        Get estimated time until payment is confirmed
        
        Args:
            currency: Cryptocurrency code
            current_confirmations: Current number of confirmations
            
        Returns:
            Human-readable estimated time
        """
        currency = currency.upper()
        required = self.CONFIRMATION_THRESHOLDS.get(currency, 1)
        time_per_confirmation = self.CONFIRMATION_TIMES.get(currency, 1)
        
        remaining_confirmations = max(0, required - current_confirmations)
        estimated_minutes = remaining_confirmations * time_per_confirmation
        
        if estimated_minutes < 1:
            return "Less than 1 minute"
        elif estimated_minutes < 60:
            return f"~{int(estimated_minutes)} minutes"
        else:
            hours = estimated_minutes / 60
            return f"~{int(hours)} hours"


# Global instance
crypto_monitor = CryptoMonitor()
