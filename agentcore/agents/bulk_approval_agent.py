"""
Agent 1: Bulk Approval Agent

Determines if a bulk buy makes financial and logistical sense by checking:
1. Price savings >= threshold (default 20%)
2. Users are within geographic radius (default 5 miles)
3. Demand meets minimum percentage of bulk requirement (default 60%)

This agent uses Amazon Bedrock Titan in production mode, or rule-based
logic in mock mode for local testing.
"""

from typing import Optional
import json

from config.settings import settings
from models.schemas import (
    BulkApprovalInput,
    BulkApprovalOutput,
    Location,
)
from tools.location_tools import calculate_geographic_spread, calculate_centroid
from tools.calculation_tools import calculate_effective_price, calculate_savings


class BulkApprovalAgent:
    """
    Agent responsible for evaluating bulk buy feasibility.
    
    Example from PRD:
    - Bulk is 50 pounds for $1/pound
    - Neighbors need 45 total
    - Cost is $1.11 per pound (50/45)
    - Agent checks local retail ($1.50 at Walmart)
    - Bulk beats retail, users are close, demand is high -> APPROVED
    """
    
    def __init__(self, use_bedrock: bool = None):
        """
        Initialize the Bulk Approval Agent.
        
        Args:
            use_bedrock: Whether to use Bedrock for reasoning.
                        If None, uses settings.mock_mode to decide.
        """
        self.use_bedrock = not settings.mock_mode if use_bedrock is None else use_bedrock
        self.savings_threshold = settings.savings_threshold
        self.max_distance_miles = settings.max_distance_miles
        self.min_demand_percent = settings.min_demand_percent
        
        if self.use_bedrock:
            self._init_bedrock_client()
    
    def _init_bedrock_client(self):
        """Initialize Amazon Bedrock client for LLM reasoning."""
        try:
            import boto3
            self.bedrock_runtime = boto3.client(
                service_name="bedrock-runtime",
                region_name=settings.aws_region,
            )
            self.model_id = settings.bedrock_model_id
        except Exception as e:
            print(f"Warning: Could not initialize Bedrock client: {e}")
            print("Falling back to mock mode")
            self.use_bedrock = False
    
    def evaluate(self, input_data: BulkApprovalInput) -> BulkApprovalOutput:
        """
        Evaluate whether a bulk buy should be approved.
        
        Args:
            input_data: BulkApprovalInput with item details and user locations
            
        Returns:
            BulkApprovalOutput with approval decision and reasoning
        """
        if self.use_bedrock:
            return self._evaluate_with_bedrock(input_data)
        else:
            return self._evaluate_with_rules(input_data)
    
    def _evaluate_with_rules(self, input_data: BulkApprovalInput) -> BulkApprovalOutput:
        """
        Rule-based evaluation for mock mode.
        
        This implements the exact logic from the PRD without LLM calls.
        """
        # 1. Calculate effective price (handling modulo problem)
        pricing = calculate_effective_price(
            bulk_price=input_data.bulk_price,
            bulk_minimum=input_data.bulk_minimum,
            total_demand=input_data.total_quantity_requested
        )
        effective_price = pricing["effective_price"]
        
        # 2. Calculate savings
        savings_data = calculate_savings(
            retail_price=input_data.retail_price,
            bulk_price=input_data.bulk_price,
            quantity=input_data.total_quantity_requested,
            effective_price=effective_price
        )
        
        # 3. Check price savings threshold
        savings_percent = savings_data["savings_percent"] / 100  # Convert to decimal
        price_check_passed = savings_percent >= self.savings_threshold
        
        # 4. Calculate geographic spread
        geo_spread = calculate_geographic_spread(input_data.user_locations)
        max_distance = geo_spread["max_distance"]
        distance_check_passed = max_distance <= self.max_distance_miles
        
        # 5. Check demand percentage
        demand_percent = input_data.total_quantity_requested / input_data.bulk_minimum
        demand_check_passed = demand_percent >= self.min_demand_percent
        
        # Overall approval
        approved = price_check_passed and distance_check_passed and demand_check_passed
        
        # Calculate confidence score
        confidence = self._calculate_confidence(
            savings_percent=savings_percent,
            max_distance=max_distance,
            demand_percent=demand_percent
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            approved=approved,
            item_name=input_data.item_name,
            savings_percent=savings_percent,
            max_distance=max_distance,
            demand_percent=demand_percent,
            price_check_passed=price_check_passed,
            distance_check_passed=distance_check_passed,
            demand_check_passed=demand_check_passed,
            effective_price=effective_price,
            retail_price=input_data.retail_price
        )
        
        return BulkApprovalOutput(
            approved=approved,
            confidence=confidence,
            reasoning=reasoning,
            effective_price=round(effective_price, 2),
            total_savings=savings_data["savings"],
            savings_percent=savings_data["savings_percent"],
            geographic_spread_miles=max_distance,
            demand_percent=round(demand_percent * 100, 1),
            price_check_passed=price_check_passed,
            distance_check_passed=distance_check_passed,
            demand_check_passed=demand_check_passed
        )
    
    def _evaluate_with_bedrock(self, input_data: BulkApprovalInput) -> BulkApprovalOutput:
        """
        LLM-powered evaluation using Amazon Bedrock Titan.
        
        The LLM provides reasoning while tools provide calculations.
        """
        # First, run the rule-based checks to get the numbers
        rules_result = self._evaluate_with_rules(input_data)
        
        # Construct prompt for Titan to provide reasoning
        prompt = self._build_bedrock_prompt(input_data, rules_result)
        
        try:
            # Call Bedrock
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 500,
                        "temperature": 0.3,
                        "topP": 0.9,
                    }
                })
            )
            
            response_body = json.loads(response["body"].read())
            llm_reasoning = response_body.get("results", [{}])[0].get("outputText", "")
            
            # Update reasoning with LLM response
            rules_result.reasoning = llm_reasoning.strip() or rules_result.reasoning
            
        except Exception as e:
            # If Bedrock fails, use rule-based reasoning
            print(f"Bedrock call failed: {e}")
            rules_result.reasoning += f" [Note: LLM reasoning unavailable]"
        
        return rules_result
    
    def _calculate_confidence(
        self,
        savings_percent: float,
        max_distance: float,
        demand_percent: float
    ) -> int:
        """Calculate confidence score based on how well criteria are met."""
        confidence = 50  # Base confidence
        
        # Savings contribution (up to 25 points)
        if savings_percent >= 0.40:
            confidence += 25
        elif savings_percent >= 0.30:
            confidence += 20
        elif savings_percent >= 0.20:
            confidence += 15
        elif savings_percent >= 0.10:
            confidence += 5
        
        # Distance contribution (up to 25 points)
        if max_distance <= 2:
            confidence += 25
        elif max_distance <= 3:
            confidence += 20
        elif max_distance <= 4:
            confidence += 15
        elif max_distance <= 5:
            confidence += 10
        
        # Demand contribution (up to 20 points)
        if demand_percent >= 1.0:
            confidence += 20
        elif demand_percent >= 0.8:
            confidence += 15
        elif demand_percent >= 0.6:
            confidence += 10
        
        return min(confidence, 98)
    
    def _generate_reasoning(
        self,
        approved: bool,
        item_name: str,
        savings_percent: float,
        max_distance: float,
        demand_percent: float,
        price_check_passed: bool,
        distance_check_passed: bool,
        demand_check_passed: bool,
        effective_price: float,
        retail_price: float
    ) -> str:
        """Generate human-readable reasoning for the decision."""
        status = "APPROVED" if approved else "NOT APPROVED"
        
        reasons = []
        
        # Price analysis
        savings_pct_display = round(savings_percent * 100, 1)
        if price_check_passed:
            reasons.append(
                f"✓ Price savings of {savings_pct_display}% "
                f"(${effective_price:.2f} vs ${retail_price:.2f} retail) "
                f"exceeds {self.savings_threshold * 100:.0f}% threshold"
            )
        else:
            reasons.append(
                f"✗ Price savings of {savings_pct_display}% "
                f"below {self.savings_threshold * 100:.0f}% threshold"
            )
        
        # Distance analysis
        if distance_check_passed:
            reasons.append(
                f"✓ Users within {max_distance:.1f} mile radius "
                f"(limit: {self.max_distance_miles} miles)"
            )
        else:
            reasons.append(
                f"✗ Users spread over {max_distance:.1f} miles "
                f"exceeds {self.max_distance_miles} mile limit"
            )
        
        # Demand analysis
        demand_pct_display = round(demand_percent * 100, 1)
        if demand_check_passed:
            reasons.append(
                f"✓ Demand at {demand_pct_display}% of bulk minimum "
                f"(threshold: {self.min_demand_percent * 100:.0f}%)"
            )
        else:
            reasons.append(
                f"✗ Demand at {demand_pct_display}% "
                f"below {self.min_demand_percent * 100:.0f}% threshold"
            )
        
        reasoning = f"{status}: {item_name} bulk purchase evaluation.\n"
        reasoning += "\n".join(reasons)
        
        return reasoning
    
    def _build_bedrock_prompt(
        self,
        input_data: BulkApprovalInput,
        rules_result: BulkApprovalOutput
    ) -> str:
        """Build prompt for Bedrock Titan model."""
        return f"""You are a bulk purchasing advisor for a community buying app.

Analyze this bulk buy decision and provide a brief, clear explanation.

Item: {input_data.item_name}
Total Quantity Requested: {input_data.total_quantity_requested} units
Number of Users: {len(input_data.user_locations)}

Pricing:
- Retail Price: ${input_data.retail_price:.2f} per unit
- Bulk Price: ${input_data.bulk_price:.2f} per unit
- Effective Price: ${rules_result.effective_price:.2f} per unit
- Bulk Minimum: {input_data.bulk_minimum} units

Analysis Results:
- Savings: {rules_result.savings_percent:.1f}% (threshold: {self.savings_threshold * 100:.0f}%) - {"PASS" if rules_result.price_check_passed else "FAIL"}
- Geographic Spread: {rules_result.geographic_spread_miles:.1f} miles (limit: {self.max_distance_miles} miles) - {"PASS" if rules_result.distance_check_passed else "FAIL"}
- Demand: {rules_result.demand_percent:.1f}% of minimum (threshold: {self.min_demand_percent * 100:.0f}%) - {"PASS" if rules_result.demand_check_passed else "FAIL"}

Decision: {"APPROVED" if rules_result.approved else "NOT APPROVED"}

Provide a 2-3 sentence explanation of this decision that a customer would understand.
Focus on the key factors and any recommendations."""

