"""
API endpoints for Websets polling and management.

Provides endpoints to poll webset status for live updates during processing.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger
from core.utils.config import config

router = APIRouter(prefix="/websets", tags=["websets"])


class WebsetStatusResponse(BaseModel):
    """Response model for webset status polling"""
    webset_id: str
    status: str
    search_status: Optional[str] = None
    is_processing: bool
    is_complete: bool
    progress: Optional[Dict[str, Any]] = None
    items_found: int = 0
    items_returned: int = 0
    items: Optional[list] = None
    message: str


@router.get(
    "/{webset_id}/status",
    summary="Poll Webset Status",
    operation_id="poll_webset_status",
    response_model=WebsetStatusResponse
)
async def poll_webset_status(
    webset_id: str,
    include_items: bool = Query(default=True, description="Include items found so far"),
    item_limit: int = Query(default=20, ge=1, le=100, description="Max items to return"),
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> WebsetStatusResponse:
    """Poll a webset for live status updates during processing.
    
    This endpoint allows the frontend to poll for real-time updates
    while a webset is being created or processed.
    
    Args:
        webset_id: The webset ID to poll
        include_items: Whether to include items found so far
        item_limit: Maximum number of items to return
        
    Returns:
        WebsetStatusResponse with current status and progress
    """
    try:
        # Check if Exa is configured
        if not config.EXA_API_KEY:
            raise HTTPException(status_code=503, detail="Websets service not available")
        
        from exa_py import Exa
        exa_client = Exa(api_key=config.EXA_API_KEY)
        
        # Get current webset status
        expand = ["items"] if include_items else None
        webset = exa_client.websets.get(webset_id, expand=expand)
        
        # Extract progress info
        progress = None
        search_status = None
        enrichment_status = None
        if webset.searches and len(webset.searches) > 0:
            s = webset.searches[0]
            search_status = _status_to_str(s.status)
            if hasattr(s, 'progress'):
                progress = {
                    "found": getattr(s.progress, 'found', 0),
                    "analyzed": getattr(s.progress, 'analyzed', 0),
                    "completion": getattr(s.progress, 'completion', 0),
                    "time_left": getattr(s.progress, 'time_left', None)
                }
        
        # Check enrichment status (enrichments can also be processing)
        if webset.enrichments and len(webset.enrichments) > 0:
            # Get the most recent enrichment status
            latest_enrichment = webset.enrichments[-1]
            enrichment_status = _status_to_str(latest_enrichment.status)
        
        # Format items if requested
        items = []
        if include_items and hasattr(webset, 'items') and webset.items:
            for item in webset.items[:item_limit]:
                formatted_item = _format_item(item)
                items.append(formatted_item)
        
        # Convert status to string
        status_str = _status_to_str(webset.status)
        
        # Determine processing state - check both search and enrichment status
        is_processing = status_str in ["running", "pending"] or (
            search_status and search_status in ["running", "pending"]
        ) or (
            enrichment_status and enrichment_status in ["running", "pending"]
        )
        is_complete = status_str == "idle" and (
            not search_status or search_status == "completed"
        ) and (
            not enrichment_status or enrichment_status == "completed"
        )
        
        # Generate message
        message = _get_status_message(status_str, progress, is_complete)
        
        logger.debug(
            f"Poll webset {webset_id}: status={status_str}, "
            f"found={progress.get('found', 0) if progress else 0}, "
            f"completion={progress.get('completion', 0) if progress else 100}%"
        )
        
        # Update message if enrichment is processing
        if enrichment_status and enrichment_status in ["running", "pending"]:
            if message and "complete" not in message.lower():
                message = f"{message} • Enrichment processing"
            elif not message:
                message = "Enrichment processing in background"
        
        return WebsetStatusResponse(
            webset_id=webset.id,
            status=status_str,
            search_status=search_status,
            is_processing=is_processing,
            is_complete=is_complete,
            progress=progress,
            items_found=progress.get("found", 0) if progress else len(items),
            items_returned=len(items),
            items=items if include_items else None,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to poll webset status: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to poll webset status: {str(e)}")


def _status_to_str(status) -> str:
    """Convert status enum/object to string for JSON serialization"""
    if status is None:
        return None
    if isinstance(status, str):
        return status
    # Handle enum objects - try to get the value
    if hasattr(status, 'value'):
        return status.value
    if hasattr(status, 'name'):
        return status.name.lower()
    return str(status).split('.')[-1] if '.' in str(status) else str(status)


def _format_item(item) -> Dict[str, Any]:
    """Format a webset item for API response"""
    formatted = {
        "id": item.id,
        "type": getattr(item.properties, 'type', 'unknown') if hasattr(item, 'properties') else 'unknown',
    }
    
    if hasattr(item, 'properties') and item.properties:
        props = item.properties
        formatted["url"] = getattr(props, 'url', None)
        formatted["description"] = getattr(props, 'description', None)
        
        # Handle different entity types
        if hasattr(props, 'person') and props.person:
            person = props.person
            formatted["name"] = getattr(person, 'name', None)
            formatted["position"] = getattr(person, 'position', None)
            formatted["location"] = getattr(person, 'location', None)
            formatted["picture_url"] = getattr(person, 'picture_url', None)
            if hasattr(person, 'company') and person.company:
                formatted["company_name"] = getattr(person.company, 'name', None)
        
        elif hasattr(props, 'company') and props.company:
            company = props.company
            formatted["name"] = getattr(company, 'name', None)
            formatted["industry"] = getattr(company, 'industry', None)
            formatted["location"] = getattr(company, 'location', None)
            formatted["logo_url"] = getattr(company, 'logo_url', None)
    
    # Add evaluations if present
    if hasattr(item, 'evaluations') and item.evaluations:
        formatted["evaluations"] = [
            {
                "criterion": getattr(e, 'criterion', ''),
                "satisfied": getattr(e, 'satisfied', 'unclear'),
                "reasoning": getattr(e, 'reasoning', None)
            }
            for e in item.evaluations
        ]
    
    # Add enrichments if present
    if hasattr(item, 'enrichments') and item.enrichments:
        enrichments = {}
        for e in item.enrichments:
            if hasattr(e, 'result') and e.result:
                key = getattr(e, 'enrichment_id', 'enrichment')
                enrichments[key] = e.result[0] if isinstance(e.result, list) and len(e.result) > 0 else e.result
        if enrichments:
            formatted["enrichments"] = enrichments
    
    return formatted


def _get_status_message(status: str, progress: Optional[Dict], is_complete: bool) -> str:
    """Generate a human-readable status message"""
    if is_complete:
        found = int(progress.get("found", 0)) if progress else 0
        return f"Search complete! Found {found} matching results."
    
    if status in ["running", "pending"]:
        if progress:
            found = int(progress.get("found", 0))
            completion = int(progress.get("completion", 0))
            time_left = progress.get("time_left")
            if found == 0:
                return "Processing search"
            msg = f"Processing... {found} results found ({completion}% complete)"
            if time_left:
                msg += f" • ~{int(time_left)}s remaining"
            return msg
        return "Processing search"
    
    return f"Status: {status}"
