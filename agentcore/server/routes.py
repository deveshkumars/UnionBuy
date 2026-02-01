"""
API route definitions for the Bulk Buy Agents.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from models.schemas import (
    PriceComparisonInput,
    PriceComparisonOutput,
    BulkApprovalInput,
    BulkApprovalOutput,
    SecurityCheckInput,
    SecurityCheckOutput,
    EvaluateBulkBuyInput,
    EvaluateBulkBuyOutput,
    RetailPriceInput,
    RetailPriceOutput,
    BulkPriceInput,
    BulkPriceOutput,
    SimpleBulkEvaluationInput,
    SimpleBulkEvaluationOutput,
    Location,
    UserLocation,
)
from agents.price_comparison_agent import PriceComparisonAgent
from agents.bulk_approval_agent import BulkApprovalAgent
from agents.security_agent import SecurityAgent
from agents.retail_price_agent import RetailPriceAgent
from agents.bulk_price_agent import BulkPriceAgent
from handlers.orchestrator import Orchestrator


router = APIRouter()


# ============================================
# ORCHESTRATOR ENDPOINTS
# ============================================

@router.post(
    "/evaluate-bulk-buy",
    response_model=EvaluateBulkBuyOutput,
    summary="Evaluate a complete bulk buy (LEGACY)",
    description="Runs all three agents to evaluate a bulk buy opportunity"
)
async def evaluate_bulk_buy(input_data: EvaluateBulkBuyInput):
    """
    Full orchestration flow for bulk buy evaluation (legacy flow).

    This endpoint:
    1. Calls Agent 2 to get price comparison
    2. Calls Agent 1 to evaluate bulk approval
    3. Calls Agent 3 for security checks on all users
    4. Returns comprehensive evaluation
    """
    try:
        orchestrator = Orchestrator()
        result = orchestrator.evaluate(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/evaluate-bulk-buy-simple",
    response_model=SimpleBulkEvaluationOutput,
    summary="Evaluate bulk buy (NEW: CSV-based)",
    description="Uses Agent 1 (retail price) + Agent 2 (CSV bulk price) for simplified evaluation"
)
async def evaluate_bulk_buy_simple(input_data: SimpleBulkEvaluationInput):
    """
    NEW simplified bulk evaluation flow using CSV dataset.

    This endpoint:
    1. Agent 1: Finds retail price with 25% markup (worst case)
    2. Agent 2: Finds bulk price from GroceryDataset.csv
    3. Calculates breakeven quantity and progress
    4. Returns savings vs retail and progress toward bulk minimum

    This is the recommended endpoint for the new flow.
    """
    try:
        orchestrator = Orchestrator()
        result = orchestrator.evaluate_simple(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# INDIVIDUAL AGENT ENDPOINTS
# ============================================

@router.post(
    "/agents/price-comparison",
    response_model=PriceComparisonOutput,
    summary="Compare prices for an item",
    description="Agent 2: Find retail vs bulk prices"
)
async def price_comparison(input_data: PriceComparisonInput):
    """
    Get price comparison for a specific item.
    
    Returns retail price, bulk price, and savings information.
    """
    try:
        agent = PriceComparisonAgent()
        result = agent.compare(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/agents/bulk-approval",
    response_model=BulkApprovalOutput,
    summary="Evaluate bulk buy feasibility",
    description="Agent 1: Check if bulk buy makes sense"
)
async def bulk_approval(input_data: BulkApprovalInput):
    """
    Evaluate whether a bulk buy should be approved.
    
    Checks price savings, geographic spread, and demand level.
    """
    try:
        agent = BulkApprovalAgent()
        result = agent.evaluate(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/agents/security-check",
    response_model=SecurityCheckOutput,
    summary="Verify user security",
    description="Agent 3: Check user location and trust"
)
async def security_check(input_data: SecurityCheckInput):
    """
    Perform security check on a user.

    Verifies location proximity and trust score.
    """
    try:
        agent = SecurityAgent()
        result = agent.check(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/agents/retail-price",
    response_model=RetailPriceOutput,
    summary="Find retail price (NEW Agent 1)",
    description="Agent 1: Find retail price with 25% markup"
)
async def retail_price(input_data: RetailPriceInput):
    """
    Get retail price with 25% markup (worst case scenario).

    Returns average retail price and worst-case price for comparison.
    """
    try:
        agent = RetailPriceAgent()
        result = agent.find_retail_price(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/agents/bulk-price",
    response_model=BulkPriceOutput,
    summary="Analyze bulk price (NEW Agent 2)",
    description="Agent 2: Find bulk price from CSV and calculate breakeven"
)
async def bulk_price(input_data: BulkPriceInput):
    """
    Analyze bulk pricing from CSV dataset.

    Searches GroceryDataset.csv for product, calculates unit price,
    adds fees, and computes breakeven quantity vs retail.
    """
    try:
        agent = BulkPriceAgent()
        result = agent.analyze(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# UTILITY ENDPOINTS
# ============================================

@router.get(
    "/items/search",
    summary="Search for items",
    description="Search available items by name"
)
async def search_items(query: str, limit: int = 5):
    """
    Search for items in the price database.
    """
    try:
        agent = PriceComparisonAgent()
        results = agent.search(query, limit)
        return {"query": query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/items/best-deals",
    summary="Get best bulk deals",
    description="Get items with highest bulk savings"
)
async def best_deals(limit: int = 5):
    """
    Get items with the best bulk savings percentage.
    """
    try:
        agent = PriceComparisonAgent()
        results = agent.get_best_bulk_deals(limit)
        return {"deals": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DEMO ENDPOINT
# ============================================

class DemoRequest(BaseModel):
    """Request for running the demo flow."""
    item_name: str = "jasmine rice"
    num_users: int = 5


@router.post(
    "/demo/run-flow",
    summary="Run demo flow",
    description="Run the example flow from the PRD"
)
async def run_demo(request: DemoRequest):
    """
    Run the demo flow from the PRD:
    
    - 50 pounds bulk rice at $1/pound
    - Multiple neighbors wanting rice
    - Compare against $1.50 retail
    - Calculate splits and savings
    """
    # Generate mock user locations (Providence, RI area)
    base_lat, base_long = 41.8236, -71.4222
    
    user_locations = []
    quantities = [10, 8, 12, 7, 8][:request.num_users]
    
    for i, qty in enumerate(quantities):
        # Spread users within ~2 mile radius
        offset = (i - 2) * 0.01
        user_locations.append(UserLocation(
            user_id=f"user-{i+1}",
            location=Location(
                latitude=base_lat + offset,
                longitude=base_long + (offset * 0.5),
                address=f"{100 + i * 10} Demo St, Providence, RI"
            ),
            quantity=qty
        ))
    
    # Create orchestrator input
    input_data = EvaluateBulkBuyInput(
        item_name=request.item_name,
        user_locations=user_locations,
        drop_zone=Location(
            latitude=base_lat,
            longitude=base_long,
            address="Providence Community Center"
        )
    )
    
    # Run full evaluation
    orchestrator = Orchestrator()
    result = orchestrator.evaluate(input_data)
    
    return {
        "demo_config": {
            "item": request.item_name,
            "num_users": request.num_users,
            "total_quantity": sum(quantities)
        },
        "evaluation": result
    }

