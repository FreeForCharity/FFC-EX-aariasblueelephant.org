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
        # Dual cascades for better coverage (frontal + side profile)
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        self.audio_path = os.path.join(os.path.dirname(__file__), "background_music.mp3")
        
    def process_image(self, img_path: str) -> Optional[np.ndarray]:
        """Detect faces and blur or filter based on mode."""
        img = cv2.imread(img_path)
        if img is None:
            logger.warning(f"Could not read image: {img_path}")
            return None
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect frontal faces
        faces = list(self.face_cascade.detectMultiScale(gray, 1.1, 4))
        # Detect profiles
        profiles = list(self.profile_cascade.detectMultiScale(gray, 1.1, 4))
        
        all_faces = faces + profiles
        
        if len(all_faces) > 0:
            if self.mode == 'select_no_faces':
                logger.info(f"Skipping image with faces: {img_path}")
                return None
            elif self.mode == 'blur':
                for (x, y, w, h) in all_faces:
                    # Expand ROI slightly to ensure hair/chin are included
                    pad_w = int(w * 0.1)
                    pad_h = int(h * 0.1)
                    y1, y2 = max(0, y-pad_h), min(img.shape[0], y+h+pad_h)
                    x1, x2 = max(0, x-pad_w), min(img.shape[1], x+w+pad_w)
                    
                    face_roi = img[y1:y2, x1:x2]
                    # Apply EXTREMELY strong Gaussian Blur for privacy
                    face_roi = cv2.GaussianBlur(face_roi, (151, 151), 50)
                    img[y1:y2, x1:x2] = face_roi
                logger.info(f"Blurred {len(all_faces)} detected face regions in: {img_path}")
        
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
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        w = right - left
        h = bottom - top
        draw.text(((size[0]-w)//2, (size[1]-h)//2), text, font=font, fill=(255, 255, 255))
        
        # Add Subtext
        if sub_text:
            sl, st, sr, sb = draw.textbbox((0, 0), sub_text, font=sub_font)
            sw = sr - sl
            sh = sb - st
            draw.text(((size[0]-sw)//2, (size[1]-sh)//2 + h + 20), sub_text, font=sub_font, fill=(255, 255, 255, 200))

        img_np = np.array(img)
        import moviepy.video.fx as vfx
        return ImageClip(img_np).with_duration(duration).with_effects([vfx.FadeIn(1), vfx.FadeOut(1)])

    def generate(self, photo_paths: List[str], progress_callback=None):
        """Generate the full video with progress tracking."""
        if not photo_paths:
            logger.error("No photos provided.")
            return

        import moviepy.video.fx as vfx
        from proglog import ProgressBarLogger
        
        class MoviePyLogger(ProgressBarLogger):
            def __init__(self, target_callback):
                super().__init__()
                self.target_callback = target_callback
            def bars_callback(self, bar, attr, value, total_value):
                if bar == 't': # 't' is usually the time/frame bar in MoviePy
                    # Shift encoding progress to the 70%-100% range
                    pct = 70 + int((value / total_value) * 30) if total_value > 0 else 70
                    if self.target_callback:
                        self.target_callback(pct, f"Encoding video: {pct}%")

        total = len(photo_paths)
        clips = []
        
        # 1. Title Slide (0-5%)
        if progress_callback: progress_callback(5, "Creating title slide...")
        clips.append(self.create_text_clip(self.event_name, 3.0, PALETTE['blue'], font_size=100, sub_text="Aaria's Blue Elephant"))
        
        # 2. Process Photos (5-70%)
        processed_count = 0
        for i, path in enumerate(photo_paths):
            if processed_count >= 10: break
            
            current_pct = 5 + int((i / total) * 65)
            if progress_callback: progress_callback(current_pct, f"Processing photo {i + 1} of {total}...")
            
            img_np = self.process_image(path)
            if img_np is not None:
                # Create base clip
                clip = ImageClip(img_np).with_duration(5.0).with_effects([vfx.FadeIn(1), vfx.FadeOut(1)])
                
                # Ken Burns Effect (Slow Zoom)
                # We use a zoom function: 1.0 at start, 1.15 at end
                clip = clip.resized(lambda t: 1 + 0.03 * t)
                
                # Ensure it fits in 1080p
                clip = clip.resized(height=1080)
                if clip.w > 1920:
                    clip = clip.resized(width=1920)

                bg = ColorClip(size=(1920, 1080), color=PALETTE['dark_blue']).with_duration(5.0)
                final_clip = CompositeVideoClip([bg, clip.with_position("center")])
                
                if processed_count % 2 == 0:
                    quote = QUOTES[min(processed_count // 2, len(QUOTES)-1)]
                    # More elegant quote overlay at bottom
                    quote_slide = self.create_text_clip(quote, 2.5, (0, 0, 0, 0), font_size=50)
                    final_clip = CompositeVideoClip([final_clip, quote_slide.with_duration(2.5).with_position(('center', 850))])
                
                clips.append(final_clip)
                processed_count += 1
        
        # 3. Call to Action Slide (70%)
        if progress_callback: progress_callback(70, "Finalizing structure...")
        clips.append(self.create_text_clip("Join Aaria's Blue Elephant", 4.0, PALETTE['green'], font_size=80, sub_text="Foster Inclusion Today!"))
        
        # 4. Final Assembly
        final_video = concatenate_videoclips(clips, method="compose")
        
        # Add Background Music if available
        try:
            if not os.path.exists(self.audio_path):
                logger.info("Downloading background music...")
                # Download a royalty-free track
                music_url = "https://www.chosic.com/wp-content/uploads/2021/05/Inspiring-Story.mp3"
                subprocess.run(['curl', '-L', music_url, '-o', self.audio_path], check=True)
            
            audio = AudioFileClip(self.audio_path)
            # Loop audio to match video duration and fade out
            final_audio = audio.with_duration(final_video.duration).with_fadeout(2)
            final_video = final_video.with_audio(final_audio)
        except Exception as e:
            logger.warning(f"Could not add audio: {e}")

        output_name = f"{self.event_name.replace(' ', '_')}_Inspiration.mp4"
        output_path = os.path.join(self.output_dir, output_name)
        
        # 5. Encoding (70-100% via logger)
        logger.info(f"Writing video to {output_path} with 'ultrafast' preset...")
        
        # Create a proxy for the percentage callback
        def encoding_callback(pct, msg=None, **kwargs):
             if progress_callback: progress_callback(pct, msg)
             
        custom_logger = MoviePyLogger(encoding_callback)
        
        # Use 'ultrafast' for speed as requested
        final_video.write_videofile(
            output_path, 
            fps=24, 
            codec='libx264', 
            audio_codec='aac', 
            preset='ultrafast',
            logger=custom_logger
        )
        
        if progress_callback: progress_callback(100, "Generation complete!")
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

# Generation status tracking
gen_status = {"state": "idle", "message": "", "output": ""}

class VideoRequest(BaseModel):
    folder: str
    event: str
    mode: str = 'blur'

def run_generation(gen, photos):
    """Wrapper that updates gen_status as the video is generated."""
    global gen_status
    total = len(photos)
    
    def on_progress(pct, message):
        global gen_status
        gen_status = {"state": "processing", "message": message, "output": "", "progress": pct, "current": 0, "total": 0}
    
    gen_status = {"state": "processing", "message": f"Starting with {total} photos...", "output": "", "progress": 0, "current": 0, "total": total}
    try:
        output_path = gen.generate(photos, progress_callback=on_progress)
        gen_status = {"state": "done", "message": "Video generation complete!", "output": output_path or "", "progress": 100, "current": total, "total": total}
    except Exception as e:
        gen_status = {"state": "error", "message": f"Generation failed: {str(e)}", "output": "", "progress": 0, "current": 0, "total": total}


@app.post("/generate")
def trigger_generation(req: VideoRequest, background_tasks: BackgroundTasks):
    global gen_status
    # Search for photos in folder
    photo_exts = ('.jpg', '.jpeg', '.png')
    photos = [os.path.join(req.folder, f) for f in os.listdir(req.folder) if f.lower().endswith(photo_exts)]
    
    if not photos:
        return {"status": "error", "message": "No photos found in directory."}
    
    gen = VideoGenerator(req.folder, req.event, req.mode)
    gen_status = {"state": "starting", "message": "Initializing...", "output": ""}
    background_tasks.add_task(run_generation, gen, photos[:10])
    
    return {"status": "success", "message": f"Video generation started with {len(photos[:10])} photos."}

@app.get("/status")
def get_status():
    """Returns the current generation status."""
    return gen_status


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
