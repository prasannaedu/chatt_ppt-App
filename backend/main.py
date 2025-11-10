from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os, io, time, re, tempfile, sqlite3, google.generativeai as genai
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

# Google Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCMJaKcOO2HgKJMCu7mJxE1kDuyEM0WQPU")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    logger.info(f"✅ Gemini AI configured: {GEMINI_MODEL}")
except Exception as e:
    logger.error(f"❌ Gemini configuration failed: {e}")
    gemini_model = None

app = FastAPI(title="Chat-to-PPT API", version="9.0")

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

# Enhanced PROMPT TEMPLATES optimized for Gemini
PROMPT_TEMPLATES = {
    "basic": """
Create a concise PowerPoint presentation outline about "{topic}" with exactly {slides} slides.

FORMAT REQUIREMENTS:
- Start each slide with "Slide X: [Title]"
- Use bullet points starting with "-"
- Keep 3 bullet points per slide
- Make it clear and professional

CONTENT:
Slide 1: [Engaging Title about {topic}]
- [Key point 1]
- [Key point 2]
- [Key point 3]

Slide 2: [Important Aspect]
- [Detail 1]
- [Detail 2]
- [Detail 3]

Continue for all {slides} slides.
""",

    "detailed": """
Create a detailed professional PowerPoint presentation outline about "{topic}" with exactly {slides} slides.

FORMAT REQUIREMENTS:
- Start each slide with "Slide X: [Title]"
- Use bullet points starting with "-"
- Include 4 bullet points per slide
- Make it informative and well-structured

CONTENT:
Slide 1: [Comprehensive Title: {topic} Overview]
- [Detailed insight with specific information]
- [Key finding with supporting evidence]
- [Important concept with explanation]
- [Practical application with examples]

Slide 2: [Core Components and Analysis]
- [In-depth analysis of key aspects]
- [Strategic considerations and implications]
- [Technical details and specifications]
- [Business impact and relevance]

Continue for all {slides} slides with substantive, professional content.
""",

    "comprehensive": """
Create an executive-level comprehensive PowerPoint presentation about "{topic}" with exactly {slides} slides.

FORMAT REQUIREMENTS:
- Start each slide with "Slide X: [Title]"
- Use bullet points starting with "-"
- Include 5 bullet points per slide
- Focus on data-driven insights and strategic recommendations

CONTENT:
Slide 1: [Strategic Executive Overview: {topic}]
- [Data-driven insight with statistical evidence and market analysis]
- [Competitive landscape assessment with positioning strategy]
- [Strategic recommendations with implementation roadmap]
- [Risk assessment with mitigation strategies and contingency plans]
- [ROI analysis with financial projections and performance metrics]

Slide 2: [Technical Deep Dive and Implementation Framework]
- [Technical architecture with component breakdown and integration points]
- [Implementation methodology with phase details and timeline]
- [Performance metrics with benchmarking data and success indicators]
- [Stakeholder management with engagement strategies and communication plan]
- [Innovation opportunities with future roadmap and scalability considerations]

Continue for all {slides} slides with executive-level, data-backed, actionable content.
"""
}

BULLET_RE = re.compile(r"^-\s+")

def call_gemini(prompt: str):
    """Call Google Gemini AI for content generation"""
    if not gemini_model:
        logger.error("❌ Gemini model not available")
        return generate_enhanced_fallback(prompt)
    
    try:
        logger.info(f"🤖 Calling Gemini AI: {GEMINI_MODEL}")
        logger.info(f"📝 Prompt length: {len(prompt)}")
        
        # Generate content with Gemini
        response = gemini_model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 1024,
            }
        )
        
        if response.text:
            logger.info(f"✅ Gemini response received, length: {len(response.text)}")
            logger.info(f"📄 Content preview: {response.text[:100]}...")
            return response.text.strip()
        else:
            logger.warning("⚠️ Gemini returned empty response")
            return generate_enhanced_fallback(prompt)
            
    except Exception as e:
        logger.error(f"❌ Gemini API call failed: {str(e)}")
        return generate_enhanced_fallback(prompt)

def generate_enhanced_fallback(prompt: str):
    """Generate high-quality fallback content when AI fails"""
    logger.info("🔄 Using enhanced fallback content generation")
    
    # Extract parameters from prompt
    topic_match = re.search(r'about "(.*?)"', prompt)
    topic = topic_match.group(1) if topic_match else "Business Strategy"
    
    slides_match = re.search(r'with exactly (\d+) slides', prompt)
    num_slides = int(slides_match.group(1)) if slides_match else 6
    
    content_depth_match = re.search(r'comprehensive|detailed|basic', prompt)
    content_depth = content_depth_match.group(0) if content_depth_match else "detailed"
    
    logger.info(f"🎯 Generating enhanced content for: {topic}, {num_slides} slides, {content_depth} depth")
    
    # Content templates for different topics
    content_templates = {
        "technology": [
            "Introduction to {topic}",
            "Key Technologies and Features", 
            "Market Trends and Analysis",
            "Implementation Strategies",
            "Case Studies and Success Stories",
            "Future Outlook and Innovations",
            "Conclusion and Recommendations"
        ],
        "business": [
            "Executive Summary: {topic}",
            "Market Analysis and Opportunity",
            "Business Model and Strategy", 
            "Financial Projections and Metrics",
            "Risk Assessment and Mitigation",
            "Implementation Roadmap",
            "Conclusion and Next Steps"
        ],
        "education": [
            "Learning Objectives: {topic}",
            "Core Concepts and Fundamentals",
            "Teaching Methodologies", 
            "Assessment Strategies",
            "Practical Applications",
            "Resources and Tools",
            "Summary and Key Takeaways"
        ],
        "healthcare": [
            "Overview of {topic} in Healthcare",
            "Clinical Applications", 
            "Research and Evidence",
            "Implementation Challenges",
            "Patient Outcomes and Benefits",
            "Future Developments",
            "Conclusions and Recommendations"
        ],
        "general": [
            "Introduction to {topic}",
            "Key Concepts and Principles", 
            "Important Facts and Data",
            "Practical Applications",
            "Best Practices",
            "Future Considerations",
            "Summary and Conclusions"
        ]
    }
    
    # Determine topic category
    topic_lower = topic.lower()
    category = "general"
    for cat, keywords in [
        ("technology", ["ai", "artificial intelligence", "machine learning", "technology", "software", "digital", "cloud", "data"]),
        ("business", ["business", "market", "finance", "strategy", "management", "startup", "enterprise", "corporate"]),
        ("education", ["education", "learning", "teaching", "student", "course", "training", "academic", "university"]),
        ("healthcare", ["health", "medical", "patient", "clinical", "healthcare", "medicine", "hospital", "treatment"])
    ]:
        if any(keyword in topic_lower for keyword in keywords):
            category = cat
            break
    
    # Get appropriate template
    templates = content_templates.get(category, content_templates["general"])
    
    # Generate presentation content
    presentation_content = ""
    used_titles = set()
    
    for i in range(num_slides):
        # Get unique title
        title_index = i % len(templates)
        slide_title = templates[title_index].format(topic=topic)
        
        # Ensure unique titles
        original_title = slide_title
        counter = 1
        while slide_title in used_titles and counter < 10:
            slide_title = f"{original_title} - Part {counter}"
            counter += 1
        used_titles.add(slide_title)
        
        presentation_content += f"Slide {i+1}: {slide_title}\n"
        
        # Generate bullet points based on content depth
        bullets = generate_smart_bullets(topic, slide_title, content_depth, i)
        for bullet in bullets:
            presentation_content += f"- {bullet}\n"
        
        presentation_content += "\n"
    
    return presentation_content

def generate_smart_bullets(topic: str, slide_title: str, content_depth: str, slide_index: int):
    """Generate intelligent bullet points based on context"""
    
    bullet_count = {"basic": 3, "detailed": 4, "comprehensive": 5}.get(content_depth, 4)
    
    # Different bullet templates for variety
    bullet_templates = [
        # Analytical bullets
        [
            f"Analysis of key {topic} components and their impact",
            f"Evaluation of current trends and market positioning", 
            f"Assessment of opportunities and potential challenges",
            f"Review of best practices and industry standards",
            f"Examination of case studies and real-world examples"
        ],
        # Strategic bullets
        [
            f"Strategic approach to implementing {topic}",
            f"Key success factors and critical requirements",
            f"Roadmap for adoption and integration",
            f"Performance metrics and measurement criteria",
            f"Risk management and contingency planning"
        ],
        # Educational bullets  
        [
            f"Fundamental concepts and core principles of {topic}",
            f"Step-by-step implementation guidelines",
            f"Common challenges and effective solutions",
            f"Best practices and optimization techniques", 
            f"Future developments and emerging trends"
        ],
        # Business-focused bullets
        [
            f"Business value and ROI considerations for {topic}",
            f"Market analysis and competitive landscape",
            f"Implementation strategy and project timeline",
            f"Resource requirements and budget considerations",
            f"Success metrics and performance indicators"
        ]
    ]
    
    # Select template based on slide index for variety
    template_index = (hash(topic) + slide_index) % len(bullet_templates)
    selected_template = bullet_templates[template_index]
    
    # Return appropriate number of bullets
    return selected_template[:bullet_count]

def generate_image_pollinations(prompt: str, width=800, height=600):
    """Generate image using Pollinations AI"""
    try:
        import requests
        import urllib.parse
        
        enhanced_prompt = f"professional presentation slide about {prompt}, clean modern design, informative, high quality, professional business presentation, clear and focused"
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nofilter=true"
        
        logger.info(f"🖼️ Generating image for: {prompt[:50]}...")
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            tmp.write(response.content)
            tmp.close()
            logger.info(f"✅ Image generated: {tmp.name}")
            return tmp.name
        else:
            logger.warning(f"⚠️ Pollinations API status: {response.status_code}")
            return None
            
    except Exception as e:
        logger.warning(f"⚠️ Image generation failed: {str(e)}")
        return None

def parse_outline(text: str, content_depth: str = "detailed"):
    """Parse the outline text into structured slides"""
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
            
        # Extract bullets
        bullets = []
        for ln in lines[1:]:
            clean_line = BULLET_RE.sub("", ln)
            if clean_line and len(clean_line) > 0:
                clean_line = re.sub(r'\s+', ' ', clean_line).strip()
                bullets.append(clean_line)
                
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
    
    if bg_brightness < 128:  # Dark background
        title_color = (255, 255, 255)
        bullet_color = (220, 220, 220)
        accent_color = (100, 150, 255)
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
    """Build PowerPoint presentation"""
    try:
        prs = Presentation()
        prs.slide_width = Inches(13.33)
        prs.slide_height = Inches(7.5)
        
        colors = theme_colors(style, background_color)

        # Create title slide
        title_slide_layout = prs.slide_layouts[0]
        slide = prs.slides.add_slide(title_slide_layout)
        
        title_shape = slide.shapes.title
        subtitle_shape = slide.placeholders[1]
        
        if slides and len(slides) > 0:
            title_shape.text = slides[0]['title']
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
            content_slide_layout = prs.slide_layouts[1]
            slide = prs.slides.add_slide(content_slide_layout)
            
            title_shape = slide.shapes.title
            title_shape.text = slide_data['title']
            
            for paragraph in title_shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(32)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(*colors['title'])
            
            content_shape = slide.placeholders[1]
            text_frame = content_shape.text_frame
            text_frame.clear()
            text_frame.word_wrap = True
            text_frame.auto_size = None
            
            for bullet in slide_data['bullets']:
                p = text_frame.add_paragraph()
                p.text = bullet
                p.level = 0
                p.space_after = Pt(12)
                
                text_length = len(bullet)
                if content_depth == "comprehensive":
                    font_size = Pt(16) if text_length > 80 else Pt(18)
                else:
                    font_size = Pt(18) if text_length > 60 else Pt(20)
                
                for run in p.runs:
                    run.font.size = font_size
                    run.font.color.rgb = RGBColor(*colors['bullet'])
                    run.font.name = 'Calibri'
            
            # Add image if available
            if include_images and slide_data.get('image_path'):
                try:
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

        # Add closing slide
        closing_slide = prs.slides.add_slide(prs.slide_layouts[0])
        closing_slide.shapes.title.text = "Thank You"
        closing_placeholder = closing_slide.placeholders[1]
        closing_placeholder.text = "Generated with AI-Powered Chat-to-PPT\n\nProfessional Presentation • Comprehensive Content"
        
        for paragraph in closing_slide.shapes.title.text_frame.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(36)
                run.font.color.rgb = RGBColor(*colors['title'])
        
        # Save presentation
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        prs.save(tmp.name)
        logger.info(f"✅ Presentation saved: {tmp.name}")
        
        # Clean up temporary image files
        for slide_data in slides:
            if slide_data.get('image_path') and os.path.exists(slide_data['image_path']):
                try:
                    os.unlink(slide_data['image_path'])
                    logger.info(f"🧹 Cleaned up image file: {slide_data['image_path']}")
                except Exception as e:
                    logger.warning(f"Could not delete image file: {e}")
                        
        return tmp.name
        
    except Exception as e:
        logger.error(f"❌ PPT building failed: {str(e)}")
        return create_fallback_ppt()

def create_fallback_ppt():
    """Create a simple fallback presentation"""
    try:
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[0])
        slide.shapes.title.text = "AI Presentation Generated"
        slide.placeholders[1].text = "Powered by Google Gemini AI\n\nProfessional Quality • Ready to Present"
        
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        prs.save(tmp.name)
        logger.info(f"🔄 Fallback presentation created: {tmp.name}")
        return tmp.name
    except Exception as e:
        logger.error(f"💥 Fallback PPT also failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create PowerPoint file")

# Database operations
def init_db():
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
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
            UNIQUE(topic, style, background_color, content_depth)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS app_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_downloads INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('INSERT OR IGNORE INTO app_metrics (id, total_downloads) VALUES (1, 0)')
    
    cursor.execute("PRAGMA table_info(presentations)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'content_depth' not in columns:
        print("Adding missing content_depth column to presentations table...")
        cursor.execute('ALTER TABLE presentations ADD COLUMN content_depth TEXT DEFAULT "detailed"')
    
    conn.commit()
    conn.close()
    logger.info("✅ Database initialized successfully")

init_db()

def save_presentation(history_data: dict) -> int:
    """Save presentation to database"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
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
    """Update presentation download count"""
    conn = sqlite3.connect('presentations.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE presentations 
        SET downloaded = TRUE, download_count = download_count + 1 
        WHERE id = ?
    ''', (presentation_id,))
    
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
    """Health check endpoint for Gemini AI"""
    try:
        # Test Gemini with a simple prompt
        test_prompt = "Hello, are you working? Respond with 'Yes, Gemini AI is ready for presentation generation.'"
        
        if gemini_model:
            response = gemini_model.generate_content(test_prompt)
            if response.text:
                return {
                    "ok": True, 
                    "model": GEMINI_MODEL,
                    "status": "Gemini AI Connected and Working",
                    "provider": "Google AI Studio",
                    "note": "Real AI content generation active"
                }
        
        return {
            "ok": False, 
            "model": GEMINI_MODEL,
            "status": "Gemini AI Not Available",
            "provider": "Google AI Studio", 
            "note": "Using enhanced content generation"
        }
            
    except Exception as e:
        return {
            "ok": False, 
            "error": str(e), 
            "model": GEMINI_MODEL,
            "provider": "Google AI Studio",
            "note": "Enhanced content generation active"
        }

@app.post("/api/outline")
def api_outline(payload: GeneratePayload):
    """Generate presentation outline using Gemini AI"""
    try:
        logger.info(f"🎯 Generating outline for: {payload.topic}")
        logger.info(f"📊 Settings: {payload.slides} slides, {payload.content_depth} depth")
        
        prompt_template = PROMPT_TEMPLATES.get(payload.content_depth, PROMPT_TEMPLATES["detailed"])
        prompt = prompt_template.format(topic=payload.topic, slides=payload.slides)
        
        # Simulate AI processing time
        time.sleep(2)
        
        text = call_gemini(prompt)
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
        
        logger.info(f"✅ Outline generated with {len(slides)} slides")
        
        return {
            "topic": payload.topic,
            "style": payload.style,
            "background_color": payload.background_color,
            "content_depth": payload.content_depth,
            "slides": slides,
            "presentation_id": presentation_id,
            "ai_generated": True
        }
    except Exception as e:
        logger.error(f"❌ Outline generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-ppt")
def api_generate_ppt(payload: GeneratePayload):
    """Generate complete PPT using Gemini AI"""
    try:
        logger.info(f"🚀 Generating PPT for: {payload.topic}")
        logger.info(f"📊 Settings: {payload.slides} slides, {payload.content_depth} depth, images: {payload.include_images}")
        
        prompt_template = PROMPT_TEMPLATES.get(payload.content_depth, PROMPT_TEMPLATES["detailed"])
        prompt = prompt_template.format(topic=payload.topic, slides=payload.slides)
        
        # Simulate processing time
        time.sleep(3)
        
        text = call_gemini(prompt)
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
            logger.info("🖼️ Generating images for slides...")
            for slide in slides:
                image_prompt = f"professional business presentation slide about {slide['title']}, clean modern corporate design, informative content, high quality professional illustration"
                image_path = generate_image_pollinations(image_prompt)
                slide['image_path'] = image_path
                time.sleep(2)
        
        # Build PowerPoint
        ppt_path = build_ppt(slides, payload.style, payload.background_color, payload.include_images, payload.content_depth)
        
        # Update download count
        update_presentation_download(presentation_id)
        
        # Create filename
        filename = f"{re.sub(r'[^a-zA-Z0-9_-]+', '_', payload.topic) or 'ai_presentation'}.pptx"
        
        logger.info(f"✅ PPT generated successfully: {filename}")
        
        return FileResponse(
            ppt_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=filename,
            background=None
        )
        
    except Exception as e:
        logger.error(f"❌ PPT generation failed: {str(e)}")
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
        logger.error(f"❌ Failed to fetch history: {str(e)}")
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
        logger.error(f"❌ Failed to delete presentation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history")
def clear_history():
    """Clear all presentation history"""
    try:
        clear_all_presentations()
        return {"message": "All history cleared successfully"}
    except Exception as e:
        logger.error(f"❌ Failed to clear history: {str(e)}")
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
        logger.error(f"❌ Failed to fetch metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {
        "message": "Chat-to-PPT API is running", 
        "version": "9.0", 
        "ai_provider": "Google Gemini 2.5 Flash Lite",
        "status": "Production Ready - Real AI Content Generation"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)