import os
from urllib.parse import urljoin

class CDNManager:
    """Service for managing CDN integration"""
    
    SUPPORTED_PROVIDERS = ['cloudflare', 'cloudfront', 'fastly', 'custom']
    
    def __init__(self, cdn_url=None, cdn_provider=None, enabled=False):
        self.cdn_url = cdn_url
        self.cdn_provider = cdn_provider
        self.enabled = enabled and cdn_url
    
    def get_asset_url(self, asset_path):
        """
        Get CDN URL for an asset
        
        Args:
            asset_path: Relative path to the asset (e.g., '/images/Logo.jpg')
        
        Returns:
            str: Full URL to the asset (CDN or local)
        """
        if not self.enabled or not self.cdn_url:
            return asset_path
        
        # Ensure CDN URL ends with /
        cdn_base = self.cdn_url.rstrip('/') + '/'
        
        # Remove leading slash from asset path
        asset_path = asset_path.lstrip('/')
        
        return urljoin(cdn_base, asset_path)
    
    def rewrite_html_assets(self, html_content, asset_types=None):
        """
        Rewrite asset URLs in HTML content to use CDN
        
        Args:
            html_content: HTML string
            asset_types: List of asset types to rewrite (default: ['img', 'script', 'link'])
        
        Returns:
            str: HTML with rewritten URLs
        """
        if not self.enabled:
            return html_content
        
        if asset_types is None:
            asset_types = ['img', 'script', 'link', 'video', 'audio']
        
        # Simple URL rewriting (in production, use a proper HTML parser)
        import re
        
        patterns = {
            'img': r'<img\s+[^>]*src=["\']([^"\']+)["\']',
            'script': r'<script\s+[^>]*src=["\']([^"\']+)["\']',
            'link': r'<link\s+[^>]*href=["\']([^"\']+)["\']',
            'video': r'<video\s+[^>]*src=["\']([^"\']+)["\']',
            'audio': r'<audio\s+[^>]*src=["\']([^"\']+)["\']'
        }
        
        for asset_type in asset_types:
            if asset_type in patterns:
                pattern = patterns[asset_type]
                
                def replace_url(match):
                    original_url = match.group(1)
                    # Only rewrite relative URLs
                    if not original_url.startswith(('http://', 'https://', '//', 'data:')):
                        cdn_url = self.get_asset_url(original_url)
                        return match.group(0).replace(original_url, cdn_url)
                    return match.group(0)
                
                html_content = re.sub(pattern, replace_url, html_content)
        
        return html_content
    
    def get_image_variants(self, image_path, sizes=None):
        """
        Get CDN URLs for different image sizes
        
        Args:
            image_path: Path to the original image
            sizes: List of sizes (e.g., ['thumbnail', 'medium', 'large'])
        
        Returns:
            dict: Dictionary of size -> URL mappings
        """
        if sizes is None:
            sizes = ['thumbnail', 'medium', 'large', 'original']
        
        variants = {}
        base_path, ext = os.path.splitext(image_path)
        
        for size in sizes:
            if size == 'original':
                variants[size] = self.get_asset_url(image_path)
            else:
                variant_path = f"{base_path}_{size}{ext}"
                variants[size] = self.get_asset_url(variant_path)
        
        return variants
    
    def purge_cache(self, paths=None):
        """
        Purge CDN cache for specified paths
        
        Args:
            paths: List of paths to purge (None = purge all)
        
        Returns:
            bool: True if successful
        """
        if not self.enabled:
            return False
        
        # Implementation depends on CDN provider
        # This is a placeholder for the actual implementation
        
        if self.cdn_provider == 'cloudflare':
            return self._purge_cloudflare_cache(paths)
        elif self.cdn_provider == 'cloudfront':
            return self._purge_cloudfront_cache(paths)
        elif self.cdn_provider == 'fastly':
            return self._purge_fastly_cache(paths)
        
        return False
    
    def _purge_cloudflare_cache(self, paths):
        """Purge Cloudflare cache"""
        # Placeholder for Cloudflare API integration
        return True
    
    def _purge_cloudfront_cache(self, paths):
        """Purge CloudFront cache"""
        # Placeholder for CloudFront API integration
        return True
    
    def _purge_fastly_cache(self, paths):
        """Purge Fastly cache"""
        # Placeholder for Fastly API integration
        return True
    
    @staticmethod
    def validate_cdn_url(url):
        """Validate CDN URL format"""
        if not url:
            return False
        
        return url.startswith(('http://', 'https://'))
    
    @staticmethod
    def get_provider_config(provider):
        """Get configuration requirements for a CDN provider"""
        configs = {
            'cloudflare': {
                'requires_api_key': True,
                'requires_zone_id': True,
                'supports_purge': True
            },
            'cloudfront': {
                'requires_api_key': True,
                'requires_distribution_id': True,
                'supports_purge': True
            },
            'fastly': {
                'requires_api_key': True,
                'requires_service_id': True,
                'supports_purge': True
            },
            'custom': {
                'requires_api_key': False,
                'supports_purge': False
            }
        }
        
        return configs.get(provider, {})