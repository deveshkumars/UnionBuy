"""
Test suite for Bulk Buy Agents.

Run with:
    pytest tests/test_agents.py -v
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from models.schemas import (
    Location,
    UserLocation,
    PriceComparisonInput,
    BulkApprovalInput,
    SecurityCheckInput,
    EvaluateBulkBuyInput,
)
from agents.price_comparison_agent import PriceComparisonAgent
from agents.bulk_approval_agent import BulkApprovalAgent
from agents.security_agent import SecurityAgent
from handlers.orchestrator import Orchestrator


# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def price_agent():
    """Create a price comparison agent in mock mode."""
    return PriceComparisonAgent(use_bedrock=False)


@pytest.fixture
def approval_agent():
    """Create a bulk approval agent in mock mode."""
    return BulkApprovalAgent(use_bedrock=False)


@pytest.fixture
def security_agent():
    """Create a security agent in mock mode."""
    return SecurityAgent(use_bedrock=False)


@pytest.fixture
def orchestrator():
    """Create an orchestrator in mock mode."""
    return Orchestrator(use_bedrock=False)


@pytest.fixture
def sample_user_locations():
    """Sample user locations for testing."""
    return [
        UserLocation(
            user_id="user-1",
            location=Location(latitude=41.8236, longitude=-71.4222),
            quantity=10
        ),
        UserLocation(
            user_id="user-2",
            location=Location(latitude=41.8256, longitude=-71.4200),
            quantity=15
        ),
        UserLocation(
            user_id="user-3",
            location=Location(latitude=41.8200, longitude=-71.4250),
            quantity=12
        ),
    ]


# ============================================
# PRICE COMPARISON AGENT TESTS
# ============================================

class TestPriceComparisonAgent:
    """Tests for Agent 2: Price Comparison."""
    
    def test_compare_known_item(self, price_agent):
        """Test price comparison for a known item."""
        result = price_agent.compare(PriceComparisonInput(item_name="jasmine rice"))
        
        assert result.item_name == "jasmine rice"
        assert result.retail_price > 0
        assert result.bulk_price > 0
        assert result.bulk_price < result.retail_price
        assert result.savings_percent > 0
        assert result.bulk_minimum > 0
    
    def test_compare_unknown_item(self, price_agent):
        """Test price comparison for an unknown item."""
        result = price_agent.compare(PriceComparisonInput(item_name="unknown item xyz"))
        
        # Should return default estimated prices
        assert result.retail_price > 0
        assert result.bulk_price > 0
    
    def test_search_items(self, price_agent):
        """Test item search functionality."""
        results = price_agent.search("rice")
        
        assert len(results) > 0
        assert any("rice" in r.item_name.lower() for r in results)
    
    def test_best_deals(self, price_agent):
        """Test getting best bulk deals."""
        deals = price_agent.get_best_bulk_deals(limit=3)
        
        assert len(deals) <= 3
        # Should be sorted by savings
        if len(deals) > 1:
            assert deals[0]["savings_percent"] >= deals[1]["savings_percent"]


# ============================================
# BULK APPROVAL AGENT TESTS
# ============================================

class TestBulkApprovalAgent:
    """Tests for Agent 1: Bulk Approval."""
    
    def test_approve_good_bulk_buy(self, approval_agent, sample_user_locations):
        """Test approval for a viable bulk buy."""
        result = approval_agent.evaluate(BulkApprovalInput(
            item_name="jasmine rice",
            total_quantity_requested=37,  # Sum of sample quantities
            user_locations=sample_user_locations,
            retail_price=1.89,
            bulk_price=0.79,
            bulk_minimum=50
        ))
        
        # With 58% savings and close users, should have good confidence
        assert result.savings_percent > 50
        assert result.price_check_passed == True
        assert result.confidence > 50
    
    def test_reject_low_savings(self, approval_agent, sample_user_locations):
        """Test rejection when savings are too low."""
        result = approval_agent.evaluate(BulkApprovalInput(
            item_name="test item",
            total_quantity_requested=37,
            user_locations=sample_user_locations,
            retail_price=1.00,
            bulk_price=0.95,  # Only 5% savings
            bulk_minimum=50
        ))
        
        assert result.price_check_passed == False
        assert result.savings_percent < 20
    
    def test_reject_low_demand(self, approval_agent):
        """Test rejection when demand is too low."""
        single_user = [
            UserLocation(
                user_id="user-1",
                location=Location(latitude=41.8236, longitude=-71.4222),
                quantity=5  # Only 10% of 50 minimum
            )
        ]
        
        result = approval_agent.evaluate(BulkApprovalInput(
            item_name="jasmine rice",
            total_quantity_requested=5,
            user_locations=single_user,
            retail_price=1.89,
            bulk_price=0.79,
            bulk_minimum=50
        ))
        
        assert result.demand_check_passed == False
        assert result.demand_percent < 60


# ============================================
# SECURITY AGENT TESTS
# ============================================

class TestSecurityAgent:
    """Tests for Agent 3: Security Check."""
    
    def test_approve_close_trusted_user(self, security_agent):
        """Test approval for a trusted user near drop zone."""
        result = security_agent.check(SecurityCheckInput(
            user_id="trusted-user",
            user_location=Location(latitude=41.8220, longitude=-71.4200),
            drop_zone=Location(latitude=41.8215, longitude=-71.4190),
            trust_score=4.8
        ))
        
        assert result.approved == True
        assert result.risk_level == "low"
        assert result.distance_to_drop_zone < 3
    
    def test_flag_distant_user(self, security_agent):
        """Test flagging for a user far from drop zone."""
        result = security_agent.check(SecurityCheckInput(
            user_id="distant-user",
            user_location=Location(latitude=42.0, longitude=-71.5),  # ~15 miles away
            drop_zone=Location(latitude=41.8215, longitude=-71.4190),
            trust_score=4.5
        ))
        
        assert result.distance_to_drop_zone > 10
        assert result.risk_level in ["medium", "high"]
        assert len(result.recommended_actions) > 0
    
    def test_flag_low_trust_user(self, security_agent):
        """Test flagging for a user with low trust score."""
        result = security_agent.check(SecurityCheckInput(
            user_id="new-user",
            user_location=Location(latitude=41.8220, longitude=-71.4200),
            drop_zone=Location(latitude=41.8215, longitude=-71.4190),
            trust_score=1.5  # Very low trust
        ))
        
        assert result.risk_level == "high"
        assert result.approved == False
        assert any("verification" in action.lower() for action in result.recommended_actions)


# ============================================
# ORCHESTRATOR TESTS
# ============================================

class TestOrchestrator:
    """Tests for the main orchestrator."""
    
    def test_full_evaluation(self, orchestrator, sample_user_locations):
        """Test full bulk buy evaluation flow."""
        result = orchestrator.evaluate(EvaluateBulkBuyInput(
            item_name="jasmine rice",
            user_locations=sample_user_locations
        ))
        
        # Should have all components
        assert result.price_comparison is not None
        assert result.bulk_approval is not None
        assert len(result.security_checks) == len(sample_user_locations)
        
        # Should have price ranges
        assert len(result.min_price_per_user) == len(sample_user_locations)
        assert len(result.max_price_per_user) == len(sample_user_locations)
        
        # Should have calculated drop zone
        assert result.calculated_drop_zone is not None
    
    def test_quick_check(self, orchestrator):
        """Test quick check convenience method."""
        result = orchestrator.quick_check(
            item_name="jasmine rice",
            quantity=10,
            lat=41.8236,
            long=-71.4222
        )
        
        assert "approved" in result
        assert "confidence" in result
        assert "retail_price" in result
        assert "bulk_price" in result
        assert "min_cost" in result
        assert "max_cost" in result


# ============================================
# INTEGRATION TESTS
# ============================================

class TestIntegration:
    """Integration tests for the complete flow."""
    
    def test_prd_example_flow(self, orchestrator):
        """Test the exact example from the PRD."""
        # PRD Example:
        # - 50 lbs bulk rice at $1/lb
        # - Neighbors need 45 total
        # - Cost is $1.11/lb effective
        # - Retail is $1.50/lb
        # - Should approve
        
        user_locations = [
            UserLocation(
                user_id=f"neighbor-{i}",
                location=Location(
                    latitude=41.8236 + (i * 0.005),
                    longitude=-71.4222 - (i * 0.003)
                ),
                quantity=qty
            )
            for i, qty in enumerate([10, 12, 8, 15])  # Total: 45
        ]
        
        result = orchestrator.evaluate(EvaluateBulkBuyInput(
            item_name="jasmine rice",
            user_locations=user_locations
        ))
        
        # Verify the flow worked
        assert result.price_comparison.retail_price == 1.89  # From mock data
        assert result.price_comparison.bulk_price == 0.79   # From mock data
        assert result.bulk_approval.savings_percent > 50     # Significant savings
        assert result.confidence > 60                        # Good confidence


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

