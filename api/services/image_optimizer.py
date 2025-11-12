import os
from PIL import Image
import io

class ImageOptimizer:
    """Service for optimizing images"""
    
    DEFAULT_QUALITY = 85
    WEBP_QUALITY = 80
    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    
    THUMBNAIL_SIZE = (150, 150)
    MEDIUM_SIZE = (800, 600)
    LARGE_SIZE = (1920, 1080)
    
    @staticmethod
    def optimize_image(image_path, output_path=None, quality=None, max_width=None, max_height=None):
        """
        Optimize an image file
        
        Args:
            image_path: Path to input image
            output_path: Path to save optimized image (None = overwrite)
            quality: JPEG quality (1-100)
            max_width: Maximum width
            max_height: Maximum height
        
        Returns:
            dict: Optimization results with file sizes
        """
        if quality is None:
            quality = ImageOptimizer.DEFAULT_QUALITY
        if max_width is None:
            max_width = ImageOptimizer.MAX_WIDTH
        if max_height is None:
            max_height = ImageOptimizer.MAX_HEIGHT
        
        if output_path is None:
            output_path = image_path
        
        try:
            # Get original file size
            original_size = os.path.getsize(image_path)
            
            # Open and process image
            with Image.open(image_path) as img:
                # Convert RGBA to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Resize if needed
                if img.width > max_width or img.height > max_height:
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                
                # Save optimized image
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
            
            # Get optimized file size
            optimized_size = os.path.getsize(output_path)
            reduction = ((original_size - optimized_size) / original_size) * 100
            
            return {
                'success': True,
                'original_size': original_size,
                'optimized_size': optimized_size,
                'reduction_percent': round(reduction, 2),
                'output_path': output_path
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def convert_to_webp(image_path, output_path=None, quality=None):
        """
        Convert image to WebP format
        
        Args:
            image_path: Path to input image
            output_path: Path to save WebP image
            quality: WebP quality (1-100)
        
        Returns:
            dict: Conversion results
        """
        if quality is None:
            quality = ImageOptimizer.WEBP_QUALITY
        
        if output_path is None:
            base, _ = os.path.splitext(image_path)
            output_path = f"{base}.webp"
        
        try:
            original_size = os.path.getsize(image_path)
            
            with Image.open(image_path) as img:
                img.save(output_path, 'WEBP', quality=quality, method=6)
            
            webp_size = os.path.getsize(output_path)
            reduction = ((original_size - webp_size) / original_size) * 100
            
            return {
                'success': True,
                'original_size': original_size,
                'webp_size': webp_size,
                'reduction_percent': round(reduction, 2),
                'output_path': output_path
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_thumbnail(image_path, output_path=None, size=None):
        """
        Create a thumbnail from an image
        
        Args:
            image_path: Path to input image
            output_path: Path to save thumbnail
            size: Tuple of (width, height)
        
        Returns:
            dict: Creation results
        """
        if size is None:
            size = ImageOptimizer.THUMBNAIL_SIZE
        
        if output_path is None:
            base, ext = os.path.splitext(image_path)
            output_path = f"{base}_thumb{ext}"
        
        try:
            with Image.open(image_path) as img:
                img.thumbnail(size, Image.Resampling.LANCZOS)
                img.save(output_path, quality=ImageOptimizer.DEFAULT_QUALITY, optimize=True)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': size
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_responsive_variants(image_path, output_dir=None):
        """
        Create multiple size variants for responsive images
        
        Args:
            image_path: Path to input image
            output_dir: Directory to save variants (None = same as input)
        
        Returns:
            dict: Paths to all created variants
        """
        if output_dir is None:
            output_dir = os.path.dirname(image_path)
        
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        
        variants = {}
        sizes = {
            'thumbnail': ImageOptimizer.THUMBNAIL_SIZE,
            'medium': ImageOptimizer.MEDIUM_SIZE,
            'large': ImageOptimizer.LARGE_SIZE
        }
        
        try:
            with Image.open(image_path) as img:
                for variant_name, size in sizes.items():
                    output_path = os.path.join(output_dir, f"{base_name}_{variant_name}.jpg")
                    
                    # Create a copy and resize
                    variant_img = img.copy()
                    variant_img.thumbnail(size, Image.Resampling.LANCZOS)
                    
                    # Convert to RGB if necessary
                    if variant_img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', variant_img.size, (255, 255, 255))
                        if variant_img.mode == 'P':
                            variant_img = variant_img.convert('RGBA')
                        background.paste(variant_img, mask=variant_img.split()[-1] if variant_img.mode == 'RGBA' else None)
                        variant_img = background
                    
                    variant_img.save(output_path, 'JPEG', quality=ImageOptimizer.DEFAULT_QUALITY, optimize=True)
                    variants[variant_name] = output_path
            
            return {
                'success': True,
                'variants': variants
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_image_info(image_path):
        """Get information about an image"""
        try:
            with Image.open(image_path) as img:
                return {
                    'success': True,
                    'format': img.format,
                    'mode': img.mode,
                    'size': img.size,
                    'width': img.width,
                    'height': img.height,
                    'file_size': os.path.getsize(image_path)
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
