#!/usr/bin/env python3
"""
Create Favicon from User's Logo
Downloads the logo and creates proper favicon sizes
"""

import requests
from PIL import Image
from io import BytesIO
import os

# User's logo URL
LOGO_URL = "https://www.genspark.ai/api/files/s/8w3EFZbO"

# Favicon sizes to generate
SIZES = [16, 32, 48, 64, 128, 256]

def download_logo():
    """Download the logo image"""
    print("Downloading logo...")
    try:
        response = requests.get(LOGO_URL)
        if response.status_code == 200:
            print("✓ Logo downloaded successfully")
            return Image.open(BytesIO(response.content))
        else:
            print(f"✗ Failed to download logo: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error downloading logo: {e}")
        return None

def create_favicon(logo_image, output_dir="public"):
    """Create favicon.ico from logo"""
    print("\nCreating favicon...")
    
    if logo_image is None:
        print("✗ No logo image provided")
        return False
    
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Convert to RGBA if needed
        if logo_image.mode != 'RGBA':
            logo_image = logo_image.convert('RGBA')
        
        # Create list of PIL images for each size
        favicon_images = []
        for size in SIZES:
            resized = logo_image.resize((size, size), Image.Resampling.LANCZOS)
            favicon_images.append(resized)
        
        # Save as .ico file with multiple sizes
        ico_path = os.path.join(output_dir, "favicon.ico")
        favicon_images[0].save(
            ico_path,
            format='ICO',
            sizes=[(s, s) for s in SIZES]
        )
        print(f"✓ Created {ico_path}")
        
        # Also save individual PNG sizes
        for size in [32, 192, 512]:
            if size <= max(SIZES):
                png_path = os.path.join(output_dir, f"logo-{size}.png")
                resized = logo_image.resize((size, size), Image.Resampling.LANCZOS)
                resized.save(png_path, format='PNG')
                print(f"✓ Created {png_path}")
        
        # Save main logo as logo.png
        logo_path = os.path.join(output_dir, "logo.png")
        logo_512 = logo_image.resize((512, 512), Image.Resampling.LANCZOS)
        logo_512.save(logo_path, format='PNG')
        print(f"✓ Created {logo_path}")
        
        print("\n✓ All favicon files created successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Error creating favicon: {e}")
        return False

def main():
    print("="*60)
    print("BRAIN LINK TRACKER - Favicon Generator")
    print("="*60)
    
    # Download logo
    logo = download_logo()
    
    if logo:
        # Show logo info
        print(f"\nLogo Info:")
        print(f"  Size: {logo.size}")
        print(f"  Mode: {logo.mode}")
        print(f"  Format: {logo.format}")
        
        # Create favicon
        success = create_favicon(logo)
        
        if success:
            print("\n" + "="*60)
            print("SUCCESS! Favicon created.")
            print("="*60)
            print("\nNext steps:")
            print("1. Remove old favicon:")
            print("   rm public/favicon.png")
            print("2. Commit changes:")
            print("   git add public/favicon.ico public/logo*.png")
            print("   git commit -m 'Update favicon with correct logo'")
            return True
        else:
            print("\n✗ Failed to create favicon")
            return False
    else:
        print("\n✗ Failed to download logo")
        print("\nYou can manually:")
        print("1. Download the logo from the user")
        print("2. Use an online favicon generator")
        print("3. Replace public/favicon.ico with the new file")
        return False

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
