"""
Orchestrator for coordinating all three agents.

Implements the transaction flow from the PRD:
1. Get price comparison (Agent 2)
2. Evaluate bulk approval (Agent 1)
3. Run security checks (Agent 3)
4. Return comprehensive result
"""

from typing import Optional

from config.settings import settings
from models.schemas import (
    Location,
    UserLocation,
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
)
from agents.price_comparison_agent import PriceComparisonAgent
from agents.bulk_approval_agent import BulkApprovalAgent
from agents.security_agent import SecurityAgent
from agents.retail_price_agent import RetailPriceAgent
from agents.bulk_price_agent import BulkPriceAgent
from tools.location_tools import calculate_centroid
from tools.calculation_tools import calculate_price_range


class Orchestrator:
    """
    Main orchestrator that coordinates all agents for bulk buy evaluation.
    
    Flow:
    1. User submits bulk buy request with item and quantities
    2. Agent 2 fetches retail vs bulk prices
    3. Agent 1 evaluates if bulk makes sense (price, distance, demand)
    4. Agent 3 verifies all users pass security checks
    5. Return comprehensive evaluation with price ranges for authorization
    """
    
    def __init__(self, use_bedrock: bool = None):
        """
        Initialize the orchestrator with all agents.
        
        Args:
            use_bedrock: Override for mock mode setting
        """
        self.use_bedrock = not settings.mock_mode if use_bedrock is None else use_bedrock
        
        # Initialize agents (legacy)
        self.price_agent = PriceComparisonAgent(use_bedrock=self.use_bedrock)
        self.approval_agent = BulkApprovalAgent(use_bedrock=self.use_bedrock)
        self.security_agent = SecurityAgent(use_bedrock=self.use_bedrock)

        # Initialize new agents
        self.retail_agent = RetailPriceAgent(use_bedrock=self.use_bedrock)
        self.bulk_agent = BulkPriceAgent()
    
    def evaluate(self, input_data: EvaluateBulkBuyInput) -> EvaluateBulkBuyOutput:
        """
        Run full bulk buy evaluation.
        
        Args:
            input_data: EvaluateBulkBuyInput with item and user details
            
        Returns:
            Complete evaluation with all agent results
        """
        # Step 1: Calculate drop zone if not provided
        if input_data.drop_zone:
            drop_zone = input_data.drop_zone
        else:
            drop_zone = calculate_centroid(input_data.user_locations)
        
        # Step 2: Get price comparison (Agent 2)
        price_input = PriceComparisonInput(item_name=input_data.item_name)
        price_result = self.price_agent.compare(price_input)
        
        # Step 3: Calculate total quantity requested
        total_quantity = sum(ul.quantity for ul in input_data.user_locations)
        
        # Step 4: Evaluate bulk approval (Agent 1)
        approval_input = BulkApprovalInput(
            item_name=input_data.item_name,
            total_quantity_requested=total_quantity,
            user_locations=input_data.user_locations,
            retail_price=price_result.retail_price,
            bulk_price=price_result.bulk_price,
            bulk_minimum=price_result.bulk_minimum
        )
        approval_result = self.approval_agent.evaluate(approval_input)
        
        # Step 5: Run security checks on all users (Agent 3)
        security_results = []
        for user_loc in input_data.user_locations:
            security_input = SecurityCheckInput(
                user_id=user_loc.user_id,
                user_location=user_loc.location,
                drop_zone=drop_zone,
                trust_score=4.5  # Default trust score - in production, fetch from user profile
            )
            security_result = self.security_agent.check(security_input)
            security_results.append(security_result)
        
        all_users_approved = all(sr.approved for sr in security_results)
        
        # Step 6: Calculate price ranges for each user (for pre-authorization)
        min_prices = {}
        max_prices = {}
        
        for user_loc in input_data.user_locations:
            price_range = calculate_price_range(
                retail_price=price_result.retail_price,
                bulk_price=price_result.bulk_price,
                quantity=user_loc.quantity
            )
            min_prices[user_loc.user_id] = price_range["min_price"]
            max_prices[user_loc.user_id] = price_range["max_price"]
        
        # Step 7: Generate overall reasoning
        overall_approved = approval_result.approved and all_users_approved
        confidence = approval_result.confidence
        
        if not all_users_approved:
            confidence = min(confidence, 60)  # Lower confidence if security issues
        
        reasoning = self._generate_overall_reasoning(
            approval_result=approval_result,
            security_results=security_results,
            all_users_approved=all_users_approved,
            overall_approved=overall_approved
        )
        
        return EvaluateBulkBuyOutput(
            approved=overall_approved,
            confidence=confidence,
            reasoning=reasoning,
            price_comparison=price_result,
            bulk_approval=approval_result,
            security_checks=security_results,
            all_users_approved=all_users_approved,
            calculated_drop_zone=drop_zone,
            min_price_per_user=min_prices,
            max_price_per_user=max_prices
        )
    
    def _generate_overall_reasoning(
        self,
        approval_result: BulkApprovalOutput,
        security_results: list[SecurityCheckOutput],
        all_users_approved: bool,
        overall_approved: bool
    ) -> str:
        """Generate overall reasoning combining all agent results."""
        parts = []
        
        # Overall status
        status = "APPROVED" if overall_approved else "NOT APPROVED"
        parts.append(f"Overall Decision: {status}")
        parts.append("")
        
        # Price analysis
        parts.append("Price Analysis:")
        parts.append(f"  - Savings: {approval_result.savings_percent:.1f}%")
        parts.append(f"  - Effective price: ${approval_result.effective_price:.2f}/unit")
        parts.append(f"  - Total savings: ${approval_result.total_savings:.2f}")
        parts.append("")
        
        # Logistics
        parts.append("Logistics:")
        parts.append(f"  - Geographic spread: {approval_result.geographic_spread_miles:.1f} miles")
        parts.append(f"  - Demand: {approval_result.demand_percent:.1f}% of bulk minimum")
        parts.append("")
        
        # Security
        approved_users = sum(1 for sr in security_results if sr.approved)
        total_users = len(security_results)
        parts.append(f"Security: {approved_users}/{total_users} users verified")
        
        if not all_users_approved:
            parts.append("  ⚠️ Some users require additional verification")
        
        # Summary
        parts.append("")
        if overall_approved:
            parts.append("✓ All checks passed. Ready to proceed with bulk buy.")
        else:
            issues = []
            if not approval_result.approved:
                if not approval_result.price_check_passed:
                    issues.append("insufficient savings")
                if not approval_result.distance_check_passed:
                    issues.append("users too spread out")
                if not approval_result.demand_check_passed:
                    issues.append("not enough demand")
            if not all_users_approved:
                issues.append("security verification needed")
            
            parts.append(f"✗ Issues: {', '.join(issues)}")
        
        return "\n".join(parts)
    
    def quick_check(self, item_name: str, quantity: float, lat: float, long: float) -> dict:
        """
        Quick check for a single user's bulk buy.
        
        Simplified interface for testing.
        
        Args:
            item_name: Name of the item
            quantity: Quantity wanted
            lat: User's latitude
            long: User's longitude
            
        Returns:
            Simplified evaluation result
        """
        user_location = UserLocation(
            user_id="quick-check-user",
            location=Location(latitude=lat, longitude=long),
            quantity=quantity
        )
        
        input_data = EvaluateBulkBuyInput(
            item_name=item_name,
            user_locations=[user_location]
        )
        
        result = self.evaluate(input_data)
        
        return {
            "approved": result.approved,
            "confidence": result.confidence,
            "retail_price": result.price_comparison.retail_price,
            "bulk_price": result.price_comparison.bulk_price,
            "savings_percent": result.price_comparison.savings_percent,
            "min_cost": result.min_price_per_user.get("quick-check-user", 0),
            "max_cost": result.max_price_per_user.get("quick-check-user", 0),
            "reasoning": result.reasoning
        }

    def evaluate_simple(self, input_data: SimpleBulkEvaluationInput) -> SimpleBulkEvaluationOutput:
        """
        Simplified bulk evaluation using new Agent 1 + Agent 2 flow.

        This is the new recommended flow:
        1. Agent 1: Find retail price with 25% markup (worst case)
        2. Agent 2: Find bulk price from CSV and calculate breakeven
        3. Return progress and savings info

        Args:
            input_data: SimpleBulkEvaluationInput with product and pledges

        Returns:
            SimpleBulkEvaluationOutput with retail + bulk analysis
        """
        # Step 1: Get retail price (worst case) from Agent 1
        print(f"🔍 Agent 1: Finding retail price for {input_data.product_name}...")
        retail_input = RetailPriceInput(
            product_name=input_data.product_name,
            location=input_data.location
        )
        retail_result = self.retail_agent.find_retail_price(retail_input)

        # Step 2: Analyze bulk pricing from CSV with Agent 2
        print(f"📊 Agent 2: Analyzing bulk pricing from CSV...")
        bulk_input = BulkPriceInput(
            product_name=input_data.product_name,
            retail_unit_price=retail_result.retail_unit_price,
            current_pledges=input_data.current_pledges,
            pledged_unit=input_data.pledged_unit
        )
        bulk_result = self.bulk_agent.analyze(bulk_input)

        # Step 3: Build recommendation
        recommendation = {
            "should_proceed": bulk_result.ready_to_order,
            "progress_percent": bulk_result.progress_percent,
            "quantity_remaining": bulk_result.quantity_remaining,
            "savings_if_ordered": bulk_result.total_savings,
            "savings_percent": bulk_result.savings_percent * 100,  # Convert to percentage
            "breakeven_quantity": bulk_result.breakeven_quantity,
            "current_pledges": bulk_result.current_pledges,
            "bulk_minimum": bulk_result.bulk_minimum,
        }

        return SimpleBulkEvaluationOutput(
            product_name=input_data.product_name,
            retail=retail_result,
            bulk=bulk_result,
            recommendation=recommendation
        )

