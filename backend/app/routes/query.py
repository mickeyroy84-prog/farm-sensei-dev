import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.llm import llm_client
from app.retriever import retriever
from app.db import db

logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    user_id: Optional[str] = None
    text: str
    lang: str = "en"
    image_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    actions: list
    sources: list
    meta: Dict[str, Any]

@router.post("/api/query", response_model=QueryResponse)
async def query_assistant(request: QueryRequest):
    """Main query endpoint for Farm-Guru AI assistant"""
    try:
        logger.info(f"Processing query: {request.text[:50]}...")
        
        # Retrieve relevant documents
        retrieved_docs = retriever.retrieve(request.text, k=3)
        logger.info(f"Retrieved {len(retrieved_docs)} documents")
        
        # Handle image context if provided
        image_context = None
        if request.image_id:
            image_data = db.get_image(request.image_id)
            if image_data and image_data.get("label"):
                image_context = f"Image shows: {image_data['label']}"
                logger.info(f"Added image context: {image_context}")
        
        # Build prompt from template
        context_text = "\n".join([
            f"Title: {doc.get('title', 'N/A')}\nContent: {doc.get('content', doc.get('snippet', ''))}"
            for doc in retrieved_docs
        ])
        
        prompt_template = """You are Farm-Guru, an AI agricultural assistant. Based on the context and query, provide helpful farming advice.

Context:
{context}

Query: {query}

{image_context}

Respond with practical, actionable advice. Be concise but comprehensive."""
        
        prompt = prompt_template.format(
            context=context_text,
            query=request.text,
            image_context=f"\nImage Context: {image_context}" if image_context else ""
        )
        
        # Get response from LLM
        response = llm_client.synthesize_answer(prompt, retrieved_docs, image_context)
        
        # Save query to database
        query_id = db.insert_query(
            user_id=request.user_id,
            question=request.text,
            response=response,
            confidence=response.get("confidence", 0.5)
        )
        
        if query_id:
            response["meta"]["query_id"] = query_id
        
        logger.info(f"Query processed successfully with confidence: {response.get('confidence', 0)}")
        
        return QueryResponse(**response)
        
    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@router.get("/api/query/history")
async def get_query_history(user_id: Optional[str] = None, limit: int = 10):
    """Get query history for a user"""
    if not db.is_connected():
        return {"message": "Query history not available in demo mode", "queries": []}
    
    try:
        query = db.client.table("queries").select("*").order("created_at", desc=True).limit(limit)
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.execute()
        return {"queries": result.data if result.data else []}
        
    except Exception as e:
        logger.error(f"Failed to get query history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve query history")