import os
from PIL import Image

large_images = [
    "public/images/understanding_autism.png",
    "public/images/autism_intervention.png",
    "public/images/autism_screening.png"
]

for img_path in large_images:
    if os.path.exists(img_path):
        print(f"Processing {img_path}...")
        img = Image.open(img_path)
        
        webp_path = img_path.rsplit('.', 1)[0] + '.webp'
        
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
