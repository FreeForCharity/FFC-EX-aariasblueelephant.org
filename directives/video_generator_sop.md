# Video Generator Tool SOP

## Objective
Automate the creation of inspirational slideshow videos that celebrate neurodiversity while ensuring child privacy.

## Branding & Aesthetics
- **Palette**:
  - Blues (#00AEEF): For calm and neurodivergent focus.
  - Purples (#C3AED6): For creativity and imagination.
  - Greens (#A8E6CF): For growth and inclusion.
- **Typography**: Preferred sans-serif (e.g., Outfit, Inter).
- **Transitions**: Smooth fades or cross-dissolves (2s duration).

## Privacy Protocols
- **Mode 1: Blur**: Detect all faces and apply Gaussian Blur (kernel 99x99).
- **Mode 2: Select**: Filter out any image where a face is detected.

## System Architecture
- **Web Integration**: Hosted under Admin Dashboard (`/admin/video-gen`).
- **Processing**: Purely local. Interface triggers local execution via a helper script/service.
- **Constraints**: 
  - Max 10 photos per session.
  - Max 2 minutes total video duration.
  - Output directory matches input directory.
