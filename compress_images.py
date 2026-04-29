import os
from PIL import Image

large_images = [
    "public/logo.png",
    "public/og-image.png",
    "public/ajith_chandran.png",
    "public/liji_chalatil.png",
    "public/qr-logo.png",
    "public/assets/elephants/elephant_mindset_1777051837375.png",
    "public/assets/elephants/stomp_barriers_1777051852262.png",
    "public/assets/elephants/trunk_friendship_1777051824961.png",
    "public/assets/elephants/tusks_leadership_1777051868281.png"
]

for img_path in large_images:
    if os.path.exists(img_path):
        print(f"Processing {img_path}...")
        img = Image.open(img_path)
        
        webp_path = img_path.rsplit('.', 1)[0] + '.webp'
        
        # Convert RGBA to RGB if saving as JPEG, but WebP supports RGBA
        img.save(webp_path, "WEBP", quality=80, method=6)
        
        old_size = os.path.getsize(img_path)
        new_size = os.path.getsize(webp_path)
        
        print(f"  Old size: {old_size / 1024:.1f} KB -> New size: {new_size / 1024:.1f} KB")
        
        if new_size < old_size:
            os.remove(img_path)
            print(f"  Replaced with WebP.")
        else:
            print(f"  WebP not smaller, keeping original.")
    else:
        print(f"File not found: {img_path}")
