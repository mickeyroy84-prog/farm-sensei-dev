import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

# Import routes
from app.routes import query, upload, weather, market, policy, chem_reco
from app.config import DEBUG, DEMO_MODE
from app.db import db

# Configure logging
logging.basicConfig(
    level=logging.INFO if not DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Farm-Guru API",
    description="AI-powered agricultural assistant API",
    version="1.0.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "https://farm-guru.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for local image storage
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers
app.include_router(query.router)
app.include_router(upload.router)
app.include_router(weather.router)
app.include_router(market.router)
app.include_router(policy.router)
app.include_router(chem_reco.router)

@app.get("/")
async def root():
    """Root endpoint with API status"""
    return {
        "message": "Farm-Guru API is running",
        "version": "1.0.0",
        "demo_mode": DEMO_MODE,
        "supabase_connected": db.is_connected(),
        "endpoints": {
            "query": "/api/query",
            "upload": "/api/upload-image", 
            "weather": "/api/weather",
            "market": "/api/market",
            "policy": "/api/policy-match",
            "chemical": "/api/chem-reco"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "demo_mode": DEMO_MODE,
        "database": "connected" if db.is_connected() else "local_mode",
        "timestamp": "2025-01-16T12:00:00Z"
    }

@app.post("/api/seed")
async def seed_database():
    """Seed database with initial data (for development)"""
    if not db.is_connected():
        return {"message": "Database not connected, seeding skipped"}
    
    try:
        # Seed documents
        sample_docs = [
            {
                "title": "Wheat Cultivation Guide",
                "content": "Comprehensive guide for wheat cultivation including sowing, irrigation, and harvesting practices.",
                "source_url": "https://icar.org.in/wheat-guide"
            },
            {
                "title": "Tomato Disease Management",
                "content": "Integrated pest management strategies for tomato crops including biological and chemical control methods.",
                "source_url": "https://icar.org.in/tomato-ipm"
            }
        ]
        
        for doc in sample_docs:
            try:
                db.client.table("docs").insert(doc).execute()
            except Exception as e:
                logger.warning(f"Failed to insert doc: {e}")
        
        # Seed schemes (if not already present)
        sample_schemes = [
            {
                "name": "PM-KISAN",
                "code": "PM-KISAN",
                "description": "Income support scheme providing ₹6000 annually",
                "applicable_states": [],
                "applicable_crops": [],
                "url": "https://pmkisan.gov.in/"
            }
        ]
        
        for scheme in sample_schemes:
            try:
                db.client.table("schemes").insert(scheme).execute()
            except Exception as e:
                logger.warning(f"Failed to insert scheme: {e}")
        
        return {"message": "Database seeded successfully"}
        
    except Exception as e:
        logger.error(f"Database seeding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")

@app.post("/api/analytics")
async def log_analytics(event_data: dict):
    """Log analytics events (privacy-focused)"""
    try:
        # In production, you might want to log to a proper analytics service
        logger.info(f"Analytics event: {event_data.get('event_name', 'unknown')}")
        return {"status": "logged"}
    except Exception as e:
        logger.error(f"Analytics logging failed: {e}")
        return {"status": "failed", "error": str(e)}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=DEBUG,
        log_level="info"
    )