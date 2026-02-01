"""
Test suite for tool functions.

Run with:
    pytest tests/test_tools.py -v
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from models.schemas import Location, UserLocation
from tools.price_tools import get_price_data, search_item_prices, calculate_unit_savings
from tools.location_tools import (
    calculate_distance,
    calculate_centroid,
    calculate_geographic_spread,
    is_within_radius,
    find_outliers,
)
from tools.calculation_tools import (
    calculate_effective_price,
    calculate_savings,
    calculate_user_share,
    calculate_price_range,
    should_rollover,
)


# ============================================
# PRICE TOOLS TESTS
# ============================================

class TestPriceTools:
    """Tests for price lookup tools."""
    
    def test_get_price_data_found(self):
        """Test getting price data for a known item."""
        result = get_price_data("jasmine rice")
        
        assert result["found"] == True
        assert result["item_name"] == "jasmine rice"
        assert result["retail"]["price"] > 0
        assert result["bulk"]["price"] > 0
    
    def test_get_price_data_not_found(self):
        """Test getting price data for an unknown item."""
        result = get_price_data("nonexistent item 12345")
        
        assert result["found"] == False
        # Should still return default prices
        assert result["retail"]["price"] > 0
        assert result["bulk"]["price"] > 0
    
    def test_get_price_data_by_alias(self):
        """Test finding item by alias."""
        result = get_price_data("rice")  # Alias for "jasmine rice"
        
        assert result["found"] == True
    
    def test_search_item_prices(self):
        """Test searching for items."""
        results = search_item_prices("rice")
        
        assert len(results) > 0
        assert all("score" in r for r in results)
        assert all("savings_percent" in r for r in results)
    
    def test_calculate_unit_savings(self):
        """Test calculating unit savings."""
        result = calculate_unit_savings(retail_price=1.50, bulk_price=1.00)
        
        assert result["savings_per_unit"] == 0.50
        assert result["savings_percent"] == pytest.approx(33.3, rel=0.1)
        assert result["is_bulk_cheaper"] == True


# ============================================
# LOCATION TOOLS TESTS
# ============================================

class TestLocationTools:
    """Tests for geospatial tools."""
    
    def test_calculate_distance_same_location(self):
        """Test distance calculation for same location."""
        loc = Location(latitude=41.8236, longitude=-71.4222)
        distance = calculate_distance(loc, loc)
        
        assert distance == pytest.approx(0, abs=0.001)
    
    def test_calculate_distance_known(self):
        """Test distance calculation for known locations."""
        # Providence to Boston is approximately 50 miles
        providence = Location(latitude=41.8236, longitude=-71.4222)
        boston = Location(latitude=42.3601, longitude=-71.0589)
        
        distance = calculate_distance(providence, boston)
        
        # Should be roughly 40-50 miles
        assert 35 < distance < 55
    
    def test_calculate_centroid(self):
        """Test centroid calculation."""
        users = [
            UserLocation(
                user_id="1",
                location=Location(latitude=40.0, longitude=-70.0),
                quantity=10
            ),
            UserLocation(
                user_id="2",
                location=Location(latitude=42.0, longitude=-72.0),
                quantity=10
            ),
        ]
        
        centroid = calculate_centroid(users)
        
        assert centroid.latitude == pytest.approx(41.0, abs=0.01)
        assert centroid.longitude == pytest.approx(-71.0, abs=0.01)
    
    def test_calculate_centroid_weighted(self):
        """Test weighted centroid calculation."""
        users = [
            UserLocation(
                user_id="1",
                location=Location(latitude=40.0, longitude=-70.0),
                quantity=10  # Higher weight
            ),
            UserLocation(
                user_id="2",
                location=Location(latitude=42.0, longitude=-72.0),
                quantity=5   # Lower weight
            ),
        ]
        
        centroid = calculate_centroid(users)
        
        # Should be closer to user 1 (higher weight)
        assert centroid.latitude < 41.0
        assert centroid.longitude > -71.0
    
    def test_calculate_geographic_spread(self):
        """Test geographic spread calculation."""
        users = [
            UserLocation(
                user_id="1",
                location=Location(latitude=41.82, longitude=-71.42),
                quantity=10
            ),
            UserLocation(
                user_id="2",
                location=Location(latitude=41.83, longitude=-71.41),
                quantity=10
            ),
        ]
        
        spread = calculate_geographic_spread(users)
        
        assert "max_distance" in spread
        assert "avg_distance_from_centroid" in spread
        assert spread["user_count"] == 2
    
    def test_is_within_radius(self):
        """Test radius check."""
        center = Location(latitude=41.82, longitude=-71.42)
        nearby = Location(latitude=41.821, longitude=-71.421)
        far = Location(latitude=42.0, longitude=-71.0)
        
        assert is_within_radius(nearby, center, 5) == True
        assert is_within_radius(far, center, 5) == False
    
    def test_find_outliers(self):
        """Test outlier detection."""
        users = [
            UserLocation(
                user_id="close-1",
                location=Location(latitude=41.82, longitude=-71.42),
                quantity=10
            ),
            UserLocation(
                user_id="close-2",
                location=Location(latitude=41.821, longitude=-71.421),
                quantity=10
            ),
            UserLocation(
                user_id="far",
                location=Location(latitude=42.5, longitude=-71.0),
                quantity=10
            ),
        ]
        
        outliers = find_outliers(users, max_distance_miles=5)
        
        assert "far" in outliers
        assert "close-1" not in outliers
        assert "close-2" not in outliers


# ============================================
# CALCULATION TOOLS TESTS
# ============================================

class TestCalculationTools:
    """Tests for financial calculation tools."""
    
    def test_calculate_effective_price_exact_demand(self):
        """Test effective price when demand matches minimum."""
        result = calculate_effective_price(
            bulk_price=1.00,
            bulk_minimum=50,
            total_demand=50
        )
        
        assert result["effective_price"] == 1.00
        assert result["excess_quantity"] == 0
    
    def test_calculate_effective_price_excess_demand(self):
        """Test effective price when demand exceeds minimum."""
        result = calculate_effective_price(
            bulk_price=1.00,
            bulk_minimum=50,
            total_demand=75
        )
        
        assert result["effective_price"] == 1.00
        assert result["total_cost"] == 75.00
    
    def test_calculate_effective_price_below_minimum(self):
        """Test effective price when demand is below minimum (PRD example)."""
        # From PRD: 50 lb bulk at $1/lb, 45 demanded
        result = calculate_effective_price(
            bulk_price=1.00,
            bulk_minimum=50,
            total_demand=45
        )
        
        # Effective price should be 50/45 = $1.11
        assert result["effective_price"] == pytest.approx(1.11, rel=0.01)
        assert result["quantity_to_buy"] == 50
        assert result["excess_quantity"] == 5
    
    def test_calculate_savings(self):
        """Test savings calculation."""
        result = calculate_savings(
            retail_price=1.50,
            bulk_price=1.00,
            quantity=50
        )
        
        assert result["retail_total"] == 75.00
        assert result["bulk_total"] == 50.00
        assert result["savings"] == 25.00
        assert result["savings_percent"] == pytest.approx(33.3, rel=0.1)
    
    def test_calculate_user_share(self):
        """Test user share calculation."""
        result = calculate_user_share(
            total_cost=100.00,
            user_quantities={
                "user-1": 30,
                "user-2": 20,
            },
            excess_quantity=0
        )
        
        assert result["user-1"]["cost"] == 60.00
        assert result["user-2"]["cost"] == 40.00
    
    def test_calculate_user_share_with_excess(self):
        """Test user share with excess distribution."""
        result = calculate_user_share(
            total_cost=100.00,
            user_quantities={
                "user-1": 25,
                "user-2": 25,
            },
            excess_quantity=10,  # 10 extra units to distribute
            distribute_excess=True
        )
        
        # Each user should get 5 bonus units
        assert result["user-1"]["bonus_quantity"] == 5
        assert result["user-2"]["bonus_quantity"] == 5
    
    def test_calculate_price_range(self):
        """Test price range calculation for authorization."""
        result = calculate_price_range(
            retail_price=1.50,
            bulk_price=1.00,
            quantity=10
        )
        
        assert result["min_price"] == 10.00
        assert result["max_price"] == 15.00
        assert result["potential_savings"] == 5.00
    
    def test_should_rollover_below_threshold(self):
        """Test rollover decision when below threshold."""
        result = should_rollover(
            current_demand=20,
            bulk_minimum=50,
            min_demand_percent=0.60
        )
        
        assert result["should_rollover"] == True
        assert result["should_execute"] == False
    
    def test_should_rollover_above_threshold(self):
        """Test rollover decision when above threshold."""
        result = should_rollover(
            current_demand=35,  # 70% of 50
            bulk_minimum=50,
            min_demand_percent=0.60
        )
        
        assert result["should_rollover"] == False
        assert result["should_execute"] == True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

