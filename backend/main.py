from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os, io, time, requests, re, tempfile, json, urllib.parse, sqlite3
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("MODEL_NAME", "phi3:mini")

app = FastAPI(title="Chat-to-PPT API", version="4.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeneratePayload(BaseModel):
    topic: str
    slides: int = 6
    style: str = "Blue-Professional"
    background_color: str = "#FFFFFF"
    include_images: bool = False
    content_depth: str = "detailed"
    notes: Optional[str] = ""

# Available background colors with names
BACKGROUND_COLORS = {
    "Pure White": "#FFFFFF",
    "Soft Gray": "#F8FAFC",
    "Warm White": "#FEF7EE",
    "Ice Blue": "#F0F9FF",
    "Mint Cream": "#F0FDF4",
    "Lavender": "#FDF4FF",
    "Peach": "#FFF7ED",
    "Dark Mode": "#1E293B"
}

# Enhanced PROMPT TEMPLATES for different content depths
PROMPT_TEMPLATES = {
    "basic": """
You are a professional presentation writer. Create a clean, well-structured outline for a PowerPoint deck.

Topic: "{topic}"

Output exactly {slides} slides.
Return in this plain text format:

Slide 1: <title>
- <bullet 1 (5-7 words)>
- <bullet 2 (5-7 words)>
- <bullet 3 (5-7 words)>

Slide 2: <title>
- <bullet 1 (5-7 words)>
- <bullet 2 (5-7 words)>
- <bullet 3 (5-7 words)>

Keep bullets concise and clear. Focus on key points only.
No extra commentary, just the slide structure.
""",

    "detailed": """
You are an expert presentation writer and subject matter expert. Create a detailed, informative outline for a professional PowerPoint presentation.

Topic: "{topic}"

Output exactly {slides} slides with comprehensive content.
Return in this plain text format:

Slide 1: <engaging title>
- <detailed bullet 1 (8-12 words with key insight)>
- <detailed bullet 2 (8-12 words with specific information)>
- <detailed bullet 3 (8-12 words with important detail)>
- <detailed bullet 4 (8-12 words with relevant fact)>

Slide 2: <descriptive title>
- <detailed bullet 1 (8-12 words)>
- <detailed bullet 2 (8-12 words)>
- <detailed bullet 3 (8-12 words)>
- <detailed bullet 4 (8-12 words)>

Include substantive content with specific details, data points where relevant, and actionable insights.
Make it professionally valuable and information-rich.
""",

    "comprehensive": """
You are a senior expert presentation writer with deep domain knowledge. Create a comprehensive, research-grade outline for an executive-level PowerPoint presentation.

Topic: "{topic}"

Output exactly {slides} slides with in-depth, substantive content.
Return in this plain text format:

Slide 1: <strategic, compelling title>
- <comprehensive bullet 1 (12-15 words with specific data/insight)>
- <comprehensive bullet 2 (12-15 words with detailed explanation)>
- <comprehensive bullet 3 (12-15 words with evidence/support)>
- <comprehensive bullet 4 (12-15 words with strategic implication)>
- <comprehensive bullet 5 (12-15 words with actionable recommendation)>

Slide 2: <insightful, descriptive title>
- <comprehensive bullet 1 (12-15 words)>
- <comprehensive bullet 2 (12-15 words)>
- <comprehensive bullet 3 (12-15 words)>
- <comprehensive bullet 4 (12-15 words)>
- <comprehensive bullet 5 (12-15 words)>

Focus on:
- Substantive, research-backed content
- Specific data points and statistics where applicable
- Strategic insights and implications
- Actionable recommendations
- Real-world applications and case studies
- Future trends and developments

Ensure each slide tells a complete story and provides genuine value to professionals in the field.
Include technical details, market insights, implementation strategies, and measurable outcomes.
"""
}

BULLET_RE = re.compile(r"^-\s+")

def call_ollama(prompt: str, model: str = MODEL, timeout=180):
    """Call Ollama API with better error handling"""
    try:
        url = f"{OLLAMA_URL}/api/generate"
        payload = {
            "model": model, 
            "prompt": prompt, 
            "stream": False,
            "options": {"temperature": 0.7, "top_k": 40, "top_p": 0.9}
        }
        logger.info(f"Calling Ollama with model: {model}")
        r = requests.post(url, json=payload, timeout=timeout)
        
        if r.status_code != 200:
            logger.error(f"Ollama API error: {r.status_code} - {r.text}")
            raise HTTPException(status_code=502, detail=f"Ollama error: {r.text[:200]}")
        
        data = r.json()
        text = data.get("response") or data.get("text") or ""
        logger.info(f"Ollama response received, length: {len(text)}")
        return text.strip()
        
    except requests.exceptions.Timeout:
        logger.error("Ollama API timeout")
        raise HTTPException(status_code=504, detail="Ollama request timeout")
    except Exception as e:
        logger.error(f"Ollama API exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama connection failed: {str(e)}")

def generate_image_pollinations(prompt: str, width=800, height=600):
    """Generate image using Pollinations AI"""
    try:
        # Enhanced image prompt for better quality
        enhanced_prompt = f"professional presentation slide about {prompt}, clean modern design, informative, high quality, professional business presentation, clear and focused"
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nofilter=true"
        
        logger.info(f"Generating image for: {prompt[:50]}...")
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            # Save to temporary file
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            tmp.write(response.content)
            tmp.close()
            logger.info(f"Image generated successfully: {tmp.name}")
            return tmp.name
        else:
            logger.warning(f"Pollinations API returned status: {response.status_code}")
            return None
            
    except Exception as e:
        logger.warning(f"Image generation failed: {str(e)}")
        return None

def parse_outline(text: str, content_depth: str = "detailed"):
    """Parse the outline text into structured slides with depth-based processing"""
    slides = []
    blocks = re.split(r"\n\s*\n", text.strip())
    
    max_bullets = {
        "basic": 3,
        "detailed": 4,
        "comprehensive": 5
    }.get(content_depth, 4)
    
    for block in blocks:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
            
        # Extract title
        title_line = lines[0]
        title = re.sub(r"^Slide\s*\d+:\s*", "", title_line, flags=re.I).strip()
        if not title:
            title = "Untitled Slide"
            
        # Extract bullets with better parsing for comprehensive content
        bullets = []
        for ln in lines[1:]:
            clean_line = BULLET_RE.sub("", ln)
            if clean_line and len(clean_line) > 0:
                # Clean up any extra spaces and ensure proper formatting
                clean_line = re.sub(r'\s+', ' ', clean_line).strip()
                bullets.append(clean_line)
                
        # Limit bullets based on content depth
        bullets = bullets[:max_bullets]
        slides.append({"title": title, "bullets": bullets, "image_path": None})
        
    return slides

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def theme_colors(style: str, background_color: str = "#FFFFFF"):
    """Get color scheme based on theme and background"""
    bg_rgb = hex_to_rgb(background_color)
    bg_brightness = (bg_rgb[0] * 299 + bg_rgb[1] * 587 + bg_rgb[2] * 114) / 1000
    
    # Use light text on dark backgrounds, dark text on light backgrounds
    if bg_brightness < 128:  # Dark background
        title_color = (255, 255, 255)  # White
        bullet_color = (220, 220, 220)  # Light gray
        accent_color = (100, 150, 255)  # Blue accent
    else:  # Light background
        if style.lower().startswith("pink"):
            title_color = (180, 22, 100)
            bullet_color = (80, 60, 70)
            accent_color = (230, 100, 180)
        else:  # Blue theme
            title_color = (16, 68, 140)
            bullet_color = (40, 40, 60)
            accent_color = (100, 150, 255)
    
    return {
        "bg": bg_rgb,
        "title": title_color,
        "bullet": bullet_color,
        "accent": accent_color
    }

def build_ppt(slides, style: str, background_color: str = "#FFFFFF", include_images: bool = False, content_depth: str = "detailed"):
    """Build PowerPoint presentation with enhanced layout for comprehensive content"""
    try:
        # Create a new presentation
        prs = Presentation()
        
        # Set slide width and height (16:9 aspect ratio)
        prs.slide_width = Inches(13.33)
        prs.slide_height = Inches(7.5)
        
        colors = theme_colors(style, background_color)

        # Create title slide using proper layout
        title_slide_layout = prs.slide_layouts[0]  # Title Slide layout
        slide = prs.slides.add_slide(title_slide_layout)
        
        # Set title
        title_shape = slide.shapes.title
        subtitle_shape = slide.placeholders[1]
        
        if slides and len(slides) > 0:
            title_shape.text = slides[0]['title']
            # Add first few bullets as subtitle if available
            if slides[0].get('bullets'):
                subtitle_text = "\n".join([f"• {bullet}" for bullet in slides[0]['bullets'][:3]])
                subtitle_shape.text = subtitle_text
        else:
            title_shape.text = "AI-Generated Presentation"
            subtitle_shape.text = "Created with Chat-to-PPT"
        
        # Set title formatting
        for paragraph in title_shape.text_frame.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(44)
                run.font.bold = True
                run.font.color.rgb = RGBColor(*colors['title'])
        
        # Set subtitle formatting
        for paragraph in subtitle_shape.text_frame.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(18)
                run.font.color.rgb = RGBColor(*colors['bullet'])

        # Process content slides
        for i, slide_data in enumerate(slides[1:] if len(slides) > 1 else slides):
            # Use Title and Content layout for better compatibility
            content_slide_layout = prs.slide_layouts[1]  # Title and Content layout
            slide = prs.slides.add_slide(content_slide_layout)
            
            # Set title
            title_shape = slide.shapes.title
            title_shape.text = slide_data['title']
            
            # Set title formatting
            for paragraph in title_shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(32)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(*colors['title'])
            
            # Set content
            content_shape = slide.placeholders[1]
            text_frame = content_shape.text_frame
            text_frame.clear()  # Clear default text
            
            # Configure text frame for better compatibility
            text_frame.word_wrap = True
            text_frame.auto_size = None
            
            for bullet in slide_data['bullets']:
                # Add paragraph for each bullet
                p = text_frame.add_paragraph()
                p.text = bullet
                p.level = 0
                p.space_after = Pt(12)
                
                # Set font size based on content depth and text length
                text_length = len(bullet)
                if content_depth == "comprehensive":
                    font_size = Pt(16) if text_length > 80 else Pt(18)
                else:
                    font_size = Pt(18) if text_length > 60 else Pt(20)
                
                for run in p.runs:
                    run.font.size = font_size
                    run.font.color.rgb = RGBColor(*colors['bullet'])
                    run.font.name = 'Calibri'  # Use standard font for compatibility
            
            # Add image if available and requested
            if include_images and slide_data.get('image_path'):
                try:
                    # Add image to the right side with proper sizing
                    left = Inches(7.5)
                    top = Inches(1.5)
                    width = Inches(5)
                    height = Inches(4.5)
                    
                    slide.shapes.add_picture(
                        slide_data['image_path'],
                        left, top, width, height
                    )
                except Exception as e:
                    logger.warning(f"Could not add image to slide: {str(e)}")
                    # Continue without image if there's an error

        # Add a professional closing slide
        closing_slide = prs.slides.add_slide(prs.slide_layouts[0])
        closing_slide.shapes.title.text = "Thank You"
        closing_placeholder = closing_slide.placeholders[1]
        closing_placeholder.text = "Generated with AI-Powered Chat-to-PPT\n\nProfessional Presentation • Comprehensive Content"
        
        # Set closing slide formatting
        for paragraph in closing_slide.shapes.title.text_frame.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(36)
                run.font.color.rgb = RGBColor(*colors['title'])
        
        # Save presentation to temporary file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        prs.save(tmp.name)
        logger.info(f"Presentation saved successfully: {tmp.name}")
        
        # Clean up temporary image files
        for slide_data in slides:
            if slide_data.get('image_path') and os.path.exists(slide_data['image_path']):
                try:
                    os.unlink(slide_data['image_path'])
                    logger.info(f"Cleaned up image file: {slide_data['image_path']}")
                except Exception as e:
                    logger.warning(f"Could not delete image file: {e}")
                        
        return tmp.name
        
    except Exception as e:
        logger.error(f"PPT building failed: {str(e)}")
        # Create a simple fallback presentation if the main one fails
        return create_fallback_ppt()

def create_fallback_ppt():
    """Create a simple, guaranteed-to-work presentation as fallback"""
    try:
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[0])
        slide.shapes.title.text = "Presentation Generated"
        slide.placeholders[1].text = "AI-Powered Content Creation\n\nThis is a simplified version for maximum compatibility."
        
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        prs.save(tmp.name)
        logger.info(f"Fallback presentation created: {tmp.name}")
        return tmp.name
    except Exception as e:
        logger.error(f"Fallback PPT also failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create PowerPoint file")

# Database operations
def init_db():
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    # Create presentations table with all required columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presentations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            slides INTEGER NOT NULL,
            style TEXT NOT NULL,
            background_color TEXT NOT NULL,
            include_images BOOLEAN DEFAULT FALSE,
            content_depth TEXT DEFAULT 'detailed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            downloaded BOOLEAN DEFAULT FALSE,
            download_count INTEGER DEFAULT 0,
            UNIQUE(topic, style, background_color, content_depth)  -- Prevent duplicates
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS app_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_downloads INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Initialize metrics if not exists
    cursor.execute('INSERT OR IGNORE INTO app_metrics (id, total_downloads) VALUES (1, 0)')
    
    # Check if content_depth column exists, if not add it
    cursor.execute("PRAGMA table_info(presentations)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'content_depth' not in columns:
        print("Adding missing content_depth column to presentations table...")
        cursor.execute('ALTER TABLE presentations ADD COLUMN content_depth TEXT DEFAULT "detailed"')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database on startup
init_db()

def save_presentation(history_data: dict) -> int:
    """Save presentation to database and return the ID - prevent duplicates"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    # Check if identical presentation already exists
    cursor.execute('''
        SELECT id FROM presentations 
        WHERE topic = ? AND style = ? AND background_color = ? AND content_depth = ?
    ''', (
        history_data['topic'],
        history_data['style'],
        history_data['background_color'],
        history_data.get('content_depth', 'detailed')
    ))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update existing record instead of creating duplicate
        presentation_id = existing[0]
        cursor.execute('''
            UPDATE presentations 
            SET slides = ?, include_images = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            history_data['slides'],
            history_data.get('include_images', False),
            presentation_id
        ))
    else:
        # Create new presentation
        cursor.execute('''
            INSERT INTO presentations (topic, slides, style, background_color, include_images, content_depth)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            history_data['topic'],
            history_data['slides'],
            history_data['style'],
            history_data['background_color'],
            history_data.get('include_images', False),
            history_data.get('content_depth', 'detailed')
        ))
        presentation_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return presentation_id

def get_presentations(limit: int = 50) -> list:
    """Get all presentations from database"""
    conn = sqlite3.connect('presentations.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM presentations 
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (limit,))
    
    presentations = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return presentations

def update_presentation_download(presentation_id: int):
    """Update presentation download count and mark as downloaded"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE presentations 
        SET downloaded = TRUE, download_count = download_count + 1 
        WHERE id = ?
    ''', (presentation_id,))
    
    # Update total downloads in metrics
    cursor.execute('''
        UPDATE app_metrics 
        SET total_downloads = total_downloads + 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = 1
    ''')
    
    conn.commit()
    conn.close()

def get_total_downloads() -> int:
    """Get total download count from metrics"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT total_downloads FROM app_metrics WHERE id = 1')
    result = cursor.fetchone()
    conn.close()
    
    return result[0] if result else 0

def delete_presentation(presentation_id: int) -> bool:
    """Delete a presentation from database"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM presentations WHERE id = ?', (presentation_id,))
    success = cursor.rowcount > 0
    
    conn.commit()
    conn.close()
    return success

def clear_all_presentations() -> bool:
    """Clear all presentations from database"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM presentations')
    cursor.execute('UPDATE app_metrics SET total_downloads = 0')
    
    conn.commit()
    conn.close()
    return True

@app.get("/api/background-colors")
def get_background_colors():
    """Get available background colors"""
    return BACKGROUND_COLORS

@app.get("/api/content-depths")
def get_content_depths():
    """Get available content depth options"""
    return {
        "basic": "Basic (3 bullets, 5-7 words each)",
        "detailed": "Detailed (4 bullets, 8-12 words each)", 
        "comprehensive": "Comprehensive (5 bullets, 12-15 words each)"
    }

@app.get("/api/health")
def health():
    """Health check endpoint"""
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=10)
        models = r.json().get('models', [])
        model_names = [m.get('name', '') for m in models]
        ok = MODEL in model_names
        return {"ok": ok, "model": MODEL, "available_models": model_names}
    except Exception as e:
        return {"ok": False, "error": str(e), "model": MODEL}

@app.post("/api/outline")
def api_outline(payload: GeneratePayload):
    """Generate presentation outline with enhanced content depth"""
    try:
        prompt_template = PROMPT_TEMPLATES.get(payload.content_depth, PROMPT_TEMPLATES["detailed"])
        prompt = prompt_template.format(topic=payload.topic, slides=payload.slides)
        
        logger.info(f"Generating outline with content depth: {payload.content_depth}")
        text = call_ollama(prompt)
        slides = parse_outline(text, payload.content_depth)
        
        # Save to database
        history_data = {
            "topic": payload.topic,
            "slides": payload.slides,
            "style": payload.style,
            "background_color": payload.background_color,
            "include_images": payload.include_images,
            "content_depth": payload.content_depth
        }
        
        presentation_id = save_presentation(history_data)
        
        return {
            "topic": payload.topic,
            "style": payload.style,
            "background_color": payload.background_color,
            "content_depth": payload.content_depth,
            "slides": slides,
            "presentation_id": presentation_id
        }
    except Exception as e:
        logger.error(f"Outline generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-ppt")
def api_generate_ppt(payload: GeneratePayload):
    """Generate complete PPT with enhanced content and custom background"""
    try:
        prompt_template = PROMPT_TEMPLATES.get(payload.content_depth, PROMPT_TEMPLATES["detailed"])
        prompt = prompt_template.format(topic=payload.topic, slides=payload.slides)
        
        logger.info(f"Generating PPT with content depth: {payload.content_depth}")
        text = call_ollama(prompt)
        slides = parse_outline(text, payload.content_depth)
        
        # Save to database first
        history_data = {
            "topic": payload.topic,
            "slides": payload.slides,
            "style": payload.style,
            "background_color": payload.background_color,
            "include_images": payload.include_images,
            "content_depth": payload.content_depth
        }
        
        presentation_id = save_presentation(history_data)
        
        # Generate images if requested
        if payload.include_images:
            logger.info("Generating enhanced images for slides...")
            for slide in slides:
                image_prompt = f"professional business presentation slide about {slide['title']}, clean modern corporate design, informative content, high quality professional illustration"
                image_path = generate_image_pollinations(image_prompt)
                slide['image_path'] = image_path
                time.sleep(1)  # Rate limiting
        
        # Build PowerPoint with enhanced content
        ppt_path = build_ppt(slides, payload.style, payload.background_color, payload.include_images, payload.content_depth)
        
        # Update download count
        update_presentation_download(presentation_id)
        
        # Create filename
        filename = f"{re.sub(r'[^a-zA-Z0-9_-]+', '_', payload.topic) or 'ai_presentation'}.pptx"
        
        return FileResponse(
            ppt_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=filename,
            background=None  # Ensure file is properly closed before sending
        )
        
    except Exception as e:
        logger.error(f"PPT generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history():
    """Get presentation history"""
    try:
        presentations = get_presentations()
        total_downloads = get_total_downloads()
        
        return {
            "presentations": presentations,
            "total_downloads": total_downloads
        }
    except Exception as e:
        logger.error(f"Failed to fetch history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{presentation_id}")
def delete_history_item(presentation_id: int):
    """Delete a specific presentation from history"""
    try:
        success = delete_presentation(presentation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Presentation not found")
        
        return {"message": "Presentation deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete presentation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history")
def clear_history():
    """Clear all presentation history"""
    try:
        clear_all_presentations()
        return {"message": "All history cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
def get_metrics():
    """Get application metrics"""
    try:
        total_downloads = get_total_downloads()
        conn = sqlite3.connect('presentations.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM presentations')
        total_presentations = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM presentations WHERE downloaded = TRUE')
        downloaded_presentations = cursor.fetchone()[0]
        
        # Get content depth distribution
        cursor.execute('SELECT content_depth, COUNT(*) FROM presentations GROUP BY content_depth')
        depth_distribution = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "total_downloads": total_downloads,
            "total_presentations": total_presentations,
            "downloaded_presentations": downloaded_presentations,
            "content_depth_distribution": depth_distribution
        }
    except Exception as e:
        logger.error(f"Failed to fetch metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/test-ppt")
def test_ppt():
    """Test endpoint to generate a simple, guaranteed-working PPT"""
    try:
        prs = Presentation()
        
        # Title slide
        slide = prs.slides.add_slide(prs.slide_layouts[0])
        slide.shapes.title.text = "Test Presentation"
        slide.placeholders[1].text = "This is a test slide\nGenerated by Chat-to-PPT"
        
        # Content slide
        slide2 = prs.slides.add_slide(prs.slide_layouts[1])
        slide2.shapes.title.text = "Test Content"
        content = slide2.placeholders[1]
        content.text = "• Simple bullet point 1\n• Simple bullet point 2\n• Simple bullet point 3"
        
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        prs.save(tmp.name)
        
        return FileResponse(
            tmp.name,
            filename="test_presentation.pptx",
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"message": "Enhanced Chat-to-PPT API is running", "version": "4.1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)