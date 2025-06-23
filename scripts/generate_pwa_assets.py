#!/usr/bin/env python3
"""
PWA Asset Generator
Generates all required PWA icons, favicons, and assets from a single input image.

Usage:
    python generate_pwa_assets.py input_image.jpg

Requirements:
    pip install Pillow
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import argparse

def create_rounded_icon(image, size, corner_radius=None):
    """Create a rounded corner icon."""
    if corner_radius is None:
        corner_radius = size // 10  # 10% corner radius
    
    # Create a mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)
    
    # Apply the mask
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    resized_image = image.resize((size, size), Image.Resampling.LANCZOS)
    output.paste(resized_image, (0, 0))
    output.putalpha(mask)
    
    return output

def create_favicon_ico(image, output_path):
    """Create a multi-size favicon.ico file."""
    favicon_sizes = [16, 24, 32, 48, 64]
    icons = []
    
    for size in favicon_sizes:
        icon = image.resize((size, size), Image.Resampling.LANCZOS)
        # Convert to RGB if RGBA (ICO doesn't support transparency well)
        if icon.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', (size, size), (255, 255, 255))
            background.paste(icon, mask=icon.split()[-1] if len(icon.split()) == 4 else None)
            icon = background
        icons.append(icon)
    
    # Save as ICO
    icons[0].save(output_path, format='ICO', sizes=[(icon.width, icon.height) for icon in icons])

def create_apple_touch_icon(image, size):
    """Create Apple touch icon with proper styling."""
    # Apple prefers square icons without rounded corners (iOS adds them)
    return image.resize((size, size), Image.Resampling.LANCZOS)

def create_shortcut_icon(base_image, size, text, bg_color, text_color=(255, 255, 255)):
    """Create a shortcut icon with text overlay."""
    # Create base icon
    icon = base_image.resize((size, size), Image.Resampling.LANCZOS)
    
    # Add colored overlay
    overlay = Image.new('RGBA', (size, size), bg_color + (180,))  # Semi-transparent
    icon = Image.alpha_composite(icon.convert('RGBA'), overlay)
    
    # Add text
    draw = ImageDraw.Draw(icon)
    font_size = size // 3
    
    try:
        # Try to use a system font
        if sys.platform.startswith('win'):
            font = ImageFont.truetype("arial.ttf", font_size)
        elif sys.platform.startswith('darwin'):
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        else:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Center the text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Add text shadow for better visibility
    draw.text((x+2, y+2), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill=text_color)
    
    return icon

def process_image(input_path, output_dir):
    """Process the input image and generate all PWA assets."""
    print(f"🖼️  Processing: {input_path}")
    
    # Load and prepare the base image
    with Image.open(input_path) as img:
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Make it square by cropping to center
        width, height = img.size
        size = min(width, height)
        left = (width - size) // 2
        top = (height - size) // 2
        img = img.crop((left, top, left + size, top + size))
        
        # Create output directories
        icons_dir = os.path.join(output_dir, 'icons')
        os.makedirs(icons_dir, exist_ok=True)
        
        # PWA Icon sizes
        pwa_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
        
        print("📱 Generating PWA icons...")
        for size in pwa_sizes:
            icon = create_rounded_icon(img, size)
            icon_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
            icon.save(icon_path, 'PNG', optimize=True)
            print(f"   ✅ {icon_path}")
        
        # iOS Touch Icons
        print("🍎 Generating iOS touch icons...")
        ios_icons = [
            ('touch-icon-iphone.png', 180),
            ('touch-icon-ipad.png', 152),
            ('touch-icon-iphone-retina.png', 180),
            ('touch-icon-ipad-retina.png', 167)
        ]
        
        for filename, size in ios_icons:
            icon = create_apple_touch_icon(img, size)
            icon_path = os.path.join(icons_dir, filename)
            icon.save(icon_path, 'PNG', optimize=True)
            print(f"   ✅ {icon_path}")
        
        # Shortcut Icons
        print("🔗 Generating shortcut icons...")
        shortcuts = [
            ('shortcut-today.png', 96, '1', (16, 185, 129)),    # Green
            ('shortcut-week.png', 96, '7', (245, 158, 11)),     # Orange
            ('shortcut-month.png', 96, '30', (239, 68, 68))     # Red
        ]
        
        for filename, size, text, bg_color in shortcuts:
            icon = create_shortcut_icon(img, size, text, bg_color)
            icon_path = os.path.join(icons_dir, filename)
            icon.save(icon_path, 'PNG', optimize=True)
            print(f"   ✅ {icon_path}")
        
        # Favicon
        print("🌐 Generating favicon...")
        favicon_path = os.path.join(output_dir, 'favicon.ico')
        create_favicon_ico(img, favicon_path)
        print(f"   ✅ {favicon_path}")
        
        # Additional PNG favicon
        favicon_png = img.resize((32, 32), Image.Resampling.LANCZOS)
        favicon_png_path = os.path.join(output_dir, 'favicon-32x32.png')
        favicon_png.save(favicon_png_path, 'PNG', optimize=True)
        print(f"   ✅ {favicon_png_path}")
        
        # Apple splash screens (basic ones)
        print("📱 Generating Apple splash screens...")
        splash_sizes = [
            ('apple-splash-2048-2732.png', 2048, 2732),  # iPad Pro 12.9"
            ('apple-splash-1668-2224.png', 1668, 2224),  # iPad Pro 11"
            ('apple-splash-1536-2048.png', 1536, 2048),  # iPad 10.2"
            ('apple-splash-1125-2436.png', 1125, 2436),  # iPhone X/11 Pro
            ('apple-splash-1242-2208.png', 1242, 2208),  # iPhone 8 Plus
            ('apple-splash-750-1334.png', 750, 1334),    # iPhone 8
            ('apple-splash-640-1136.png', 640, 1136)     # iPhone 5/SE
        ]
        
        for filename, width, height in splash_sizes:
            # Create a simple splash screen with centered logo
            splash = Image.new('RGB', (width, height), (37, 99, 235))  # Blue background
            
            # Calculate logo size (20% of smaller dimension)
            logo_size = min(width, height) // 5
            logo = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            
            # Center the logo
            x = (width - logo_size) // 2
            y = (height - logo_size) // 2
            
            # Convert logo to RGB for pasting
            if logo.mode == 'RGBA':
                logo_rgb = Image.new('RGB', (logo_size, logo_size), (37, 99, 235))
                logo_rgb.paste(logo, mask=logo.split()[-1])
                logo = logo_rgb
            
            splash.paste(logo, (x, y))
            
            splash_path = os.path.join(icons_dir, filename)
            splash.save(splash_path, 'PNG', optimize=True, quality=85)
            print(f"   ✅ {splash_path}")
        
        # Generate screenshots placeholder
        screenshots_dir = os.path.join(output_dir, 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)
        
        print("📸 Generating screenshot placeholders...")
        # Mobile screenshot
        mobile_screenshot = Image.new('RGB', (390, 844), (37, 99, 235))
        mobile_path = os.path.join(screenshots_dir, 'mobile-screenshot.png')
        mobile_screenshot.save(mobile_path, 'PNG')
        print(f"   ✅ {mobile_path}")
        
        # Desktop screenshot
        desktop_screenshot = Image.new('RGB', (1280, 720), (37, 99, 235))
        desktop_path = os.path.join(screenshots_dir, 'desktop-screenshot.png')
        desktop_screenshot.save(desktop_path, 'PNG')
        print(f"   ✅ {desktop_path}")

def main():
    parser = argparse.ArgumentParser(description='Generate PWA assets from an input image')
    parser.add_argument('input_image', help='Path to input JPEG/PNG image')
    parser.add_argument('--output', '-o', default='public', help='Output directory (default: public)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_image):
        print(f"❌ Error: Input image '{args.input_image}' not found!")
        sys.exit(1)
    
    try:
        process_image(args.input_image, args.output)
        print(f"\n🎉 Success! All PWA assets generated in '{args.output}'")
        print("\n📋 Generated files:")
        print("   • favicon.ico - Main favicon")
        print("   • favicon-32x32.png - PNG favicon")
        print("   • icons/icon-*x*.png - PWA app icons")
        print("   • icons/touch-icon-*.png - iOS touch icons")
        print("   • icons/shortcut-*.png - App shortcut icons")
        print("   • icons/apple-splash-*.png - iOS splash screens")
        print("   • screenshots/*.png - PWA screenshot placeholders")
        print("\n💡 Next steps:")
        print("   1. Replace screenshot placeholders with actual app screenshots")
        print("   2. Update manifest.json to use .png instead of .svg")
        print("   3. Test the PWA installation")
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 