import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips, AudioFileClip, ColorClip, CompositeVideoClip
import argparse
import logging
from typing import List, Optional
import sys
import subprocess

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants & Branding
PALETTE = {
    'blue': (0, 174, 239),    # #00AEEF
    'purple': (195, 174, 214), # #C3AED6
    'green': (168, 230, 207),  # #A8E6CF
    'dark_blue': (30, 41, 59)  # Slate-900
}

QUOTES = [
    "Every mind blooms uniquely.",
    "Inclusion starts with understanding.",
    "Early steps, endless possibilities.",
    "Compassion builds communities.",
    "Celebrate neurodiversity."
]

FONT_PATH = "/System/Library/Fonts/Helvetica.ttc" # Use standard Mac font collection

class VideoGenerator:
    def __init__(self, output_dir: str, event_name: str, mode: str = 'blur'):
        self.output_dir = output_dir
        self.event_name = event_name
        self.mode = mode
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def process_image(self, img_path: str) -> Optional[np.ndarray]:
        """Detect faces and blur or filter based on mode."""
        img = cv2.imread(img_path)
        if img is None:
            logger.warning(f"Could not read image: {img_path}")
            return None
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            if self.mode == 'select_no_faces':
                logger.info(f"Skipping image with faces: {img_path}")
                return None
            elif self.mode == 'blur':
                for (x, y, w, h) in faces:
                    face_roi = img[y:y+h, x:x+w]
                    # Apply strong Gaussian Blur
                    face_roi = cv2.GaussianBlur(face_roi, (99, 99), 30)
                    img[y:y+h, x:x+w] = face_roi
                logger.info(f"Blurred faces in: {img_path}")
        
        # Convert to RGB for MoviePy/PIL
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def create_text_clip(self, text: str, duration: float, bg_color: tuple, font_size: int = 60, sub_text: str = ""):
        """Create a title or quote slide using PIL for better text rendering."""
        # Standard 1080p slide
        size = (1920, 1080)
        img = Image.new('RGB', size, bg_color)
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype(FONT_PATH, font_size)
            sub_font = ImageFont.truetype(FONT_PATH, font_size // 2)
        except:
            font = ImageFont.load_default()
            sub_font = ImageFont.load_default()

        # Center Main Text
        w, h = draw.textsize(text, font=font)
        draw.text(((size[0]-w)//2, (size[1]-h)//2), text, font=font, fill=(255, 255, 255))
        
        # Add Subtext
        if sub_text:
            sw, sh = draw.textsize(sub_text, font=sub_font)
            draw.text(((size[0]-sw)//2, (size[1]-sh)//2 + h + 20), sub_text, font=sub_font, fill=(255, 255, 255, 200))

        img_np = np.array(img)
        return ImageClip(img_np).set_duration(duration).fadein(1).fadeout(1)

    def generate(self, photo_paths: List[str]):
        """Generate the full video."""
        if not photo_paths:
            logger.error("No photos provided.")
            return

        clips = []
        
        # 1. Title Slide
        clips.append(self.create_text_clip(self.event_name, 3.0, PALETTE['blue'], font_size=100, sub_text="Aaria's Blue Elephant"))
        
        # 2. Process Photos
        processed_count = 0
        for i, path in enumerate(photo_paths):
            if processed_count >= 10: break
            
            img_np = self.process_image(path)
            if img_np is not None:
                # Create photo clip
                clip = ImageClip(img_np).set_duration(4.0).fadein(1).fadeout(1)
                
                # Resize to 1080p while maintaining aspect ratio
                clip = clip.resize(height=1080)
                if clip.w > 1920:
                    clip = clip.resize(width=1920)
                
                # Center on 1080p background
                bg = ColorClip(size=(1920, 1080), color=PALETTE['dark_blue']).set_duration(4.0)
                final_clip = CompositeVideoClip([bg, clip.set_position("center")])
                
                # Overlay Quote every few photos
                if processed_count % 2 == 0:
                    quote = QUOTES[min(processed_count // 2, len(QUOTES)-1)]
                    quote_slide = self.create_text_clip(quote, 2.0, (0, 0, 0, 0)) # Transparent overlay? MoviePy handles better.
                    # Simple quote overlay implementation
                    final_clip = CompositeVideoClip([final_clip, quote_slide.set_duration(2.0).set_position(('center', 'bottom'))])
                
                clips.append(final_clip)
                processed_count += 1
        
        # 3. Call to Action Slide
        clips.append(self.create_text_clip("Join Aaria's Blue Elephant", 4.0, PALETTE['green'], font_size=80, sub_text="Foster Inclusion Today!"))
        
        # 4. Final Assembly
        final_video = concatenate_videoclips(clips, method="compose")
        
        # 5. Handle Audio (Optional/Sample)
        output_name = f"{self.event_name.replace(' ', '_')}_Inspiration.mp4"
        output_path = os.path.join(self.output_dir, output_name)
        
        logger.info(f"Writing video to {output_path}...")
        final_video.write_videofile(output_path, fps=30, codec='libx264', audio_codec='aac')
        logger.info("Video generation complete.")
        return output_path

# --- FastAPI Integration ---
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for the cloud dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/health")
def health_check():
    """Simple health check endpoint for the dashboard."""
    return {"status": "ok", "service": "abe-video-generator"}

class VideoRequest(BaseModel):
    folder: str
    event: str
    mode: str = 'blur'

@app.post("/generate")
def trigger_generation(req: VideoRequest, background_tasks: BackgroundTasks):
    # Search for photos in folder
    photo_exts = ('.jpg', '.jpeg', '.png')
    photos = [os.path.join(req.folder, f) for f in os.listdir(req.folder) if f.lower().endswith(photo_exts)]
    
    if not photos:
        return {"status": "error", "message": "No photos found in directory."}
    
    gen = VideoGenerator(req.folder, req.event, req.mode)
    background_tasks.add_task(gen.generate, photos[:10])
    
    return {"status": "success", "message": "Video generation started in background."}

@app.get("/pick-folder")
def pick_folder():
    """Opens a native macOS folder picker using osascript (thread-safe)."""
    try:
        result = subprocess.run(
            ['osascript', '-e', 'POSIX path of (choose folder with prompt "Select your photos folder")'],
            capture_output=True, text=True, timeout=60
        )
        folder_path = result.stdout.strip()
        if folder_path:
            return {"folder": folder_path}
        return {"folder": ""}
    except subprocess.TimeoutExpired:
        return {"folder": "", "error": "Folder selection timed out."}
    except Exception as e:
        return {"folder": "", "error": str(e)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aaria's Blue Elephant Video Generator")
    parser.add_argument("--folder", type=str, help="Path to photos folder")
    parser.add_argument("--event", type=str, help="Event/Album name")
    parser.add_argument("--mode", type=str, choices=['blur', 'select_no_faces'], default='blur', help="Privacy mode")
    parser.add_argument("--server", action="store_true", help="Run as FastAPI server")
    
    args = parser.parse_args()
    
    if args.server:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)

    elif args.folder and args.event:
        photo_exts = ('.jpg', '.jpeg', '.png')
        photos = [os.path.join(args.folder, f) for f in os.listdir(args.folder) if f.lower().endswith(photo_exts)]
        gen = VideoGenerator(args.folder, args.event, args.mode)
        gen.generate(photos[:10])
    else:
        parser.print_help()
