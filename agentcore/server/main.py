"""
FastAPI local server for testing Bulk Buy Agents.

Run with:
    python -m server.main

Or:
    uvicorn server.main:app --reload --port 8000
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config.settings import settings
from server.routes import router


# Create FastAPI app
app = FastAPI(
    title="Bulk Buy Agents API",
    description="""
    AI-powered agents for the Metropolis Bulk Buy application.
    
    ## Agents
    
    - **Agent 1 (Bulk Approval)**: Evaluates if a bulk buy makes sense
    - **Agent 2 (Price Comparison)**: Compares retail vs wholesale prices
    - **Agent 3 (Security Check)**: Verifies user locations and trust
    
    ## Modes
    
    Set `MOCK_MODE=true` in environment to use rule-based logic without AWS Bedrock.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Bulk Buy Agents API",
        "version": "1.0.0",
        "mock_mode": settings.mock_mode,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mock_mode": settings.mock_mode,
        "bedrock_model": settings.bedrock_model_id if not settings.mock_mode else "N/A"
    }


def main():
    """Run the server."""
    print(f"\n🚀 Starting Bulk Buy Agents API...")
    print(f"   Mode: {'MOCK (rule-based)' if settings.mock_mode else 'BEDROCK (LLM-powered)'}")
    print(f"   URL: http://{settings.server_host}:{settings.server_port}")
    print(f"   Docs: http://localhost:{settings.server_port}/docs")
    print()
    
    uvicorn.run(
        "server.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()

