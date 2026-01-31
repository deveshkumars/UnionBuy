"""
AWS Lambda handler for the Bulk Buy Agents.

This handler can be deployed to AWS Lambda via SAM template.
It routes requests to the appropriate agent based on the path.
"""

import json
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.typing import LambdaContext

from models.schemas import (
    PriceComparisonInput,
    BulkApprovalInput,
    SecurityCheckInput,
    EvaluateBulkBuyInput,
    Location,
    UserLocation,
)
from agents.price_comparison_agent import PriceComparisonAgent
from agents.bulk_approval_agent import BulkApprovalAgent
from agents.security_agent import SecurityAgent
from handlers.orchestrator import Orchestrator


# Initialize Lambda Powertools
logger = Logger()
tracer = Tracer()
app = APIGatewayRestResolver()


# ============================================
# LAMBDA ROUTES
# ============================================

@app.post("/api/evaluate-bulk-buy")
@tracer.capture_method
def evaluate_bulk_buy():
    """Full orchestration endpoint."""
    body = app.current_event.json_body
    
    # Parse user locations
    user_locations = [
        UserLocation(
            user_id=ul["user_id"],
            location=Location(**ul["location"]),
            quantity=ul["quantity"]
        )
        for ul in body["user_locations"]
    ]
    
    # Parse drop zone if provided
    drop_zone = None
    if body.get("drop_zone"):
        drop_zone = Location(**body["drop_zone"])
    
    input_data = EvaluateBulkBuyInput(
        item_name=body["item_name"],
        user_locations=user_locations,
        drop_zone=drop_zone
    )
    
    orchestrator = Orchestrator()
    result = orchestrator.evaluate(input_data)
    
    return result.model_dump()


@app.post("/api/agents/price-comparison")
@tracer.capture_method
def price_comparison():
    """Price comparison endpoint."""
    body = app.current_event.json_body
    input_data = PriceComparisonInput(**body)
    
    agent = PriceComparisonAgent()
    result = agent.compare(input_data)
    
    return result.model_dump()


@app.post("/api/agents/bulk-approval")
@tracer.capture_method
def bulk_approval():
    """Bulk approval endpoint."""
    body = app.current_event.json_body
    
    # Parse user locations
    user_locations = [
        UserLocation(
            user_id=ul["user_id"],
            location=Location(**ul["location"]),
            quantity=ul["quantity"]
        )
        for ul in body["user_locations"]
    ]
    
    input_data = BulkApprovalInput(
        item_name=body["item_name"],
        total_quantity_requested=body["total_quantity_requested"],
        user_locations=user_locations,
        retail_price=body["retail_price"],
        bulk_price=body["bulk_price"],
        bulk_minimum=body["bulk_minimum"]
    )
    
    agent = BulkApprovalAgent()
    result = agent.evaluate(input_data)
    
    return result.model_dump()


@app.post("/api/agents/security-check")
@tracer.capture_method
def security_check():
    """Security check endpoint."""
    body = app.current_event.json_body
    
    input_data = SecurityCheckInput(
        user_id=body["user_id"],
        user_location=Location(**body["user_location"]),
        drop_zone=Location(**body["drop_zone"]),
        trust_score=body["trust_score"]
    )
    
    agent = SecurityAgent()
    result = agent.check(input_data)
    
    return result.model_dump()


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "bulk-buy-agents"}


# ============================================
# LAMBDA HANDLER
# ============================================

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> dict:
    """
    Main Lambda handler.
    
    Routes requests through API Gateway to the appropriate endpoint.
    """
    logger.info("Received event", extra={"event": event})
    return app.resolve(event, context)


# For local testing
if __name__ == "__main__":
    # Simulate a test event
    test_event = {
        "httpMethod": "POST",
        "path": "/api/agents/price-comparison",
        "body": json.dumps({"item_name": "jasmine rice"}),
        "headers": {"Content-Type": "application/json"}
    }
    
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))

