"""
Pydantic models for agent inputs and outputs.
These schemas define the contracts between the React Native app and the agents.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# COMMON TYPES
# ============================================

class Location(BaseModel):
    """Geographic location with latitude and longitude."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    address: Optional[str] = Field(None, description="Optional human-readable address")


class UserLocation(BaseModel):
    """User location with associated quantity for weighted calculations."""
    user_id: str = Field(..., description="Unique user identifier")
    location: Location
    quantity: float = Field(..., gt=0, description="Quantity this user wants")


# ============================================
# AGENT 1: RETAIL PRICE FINDER
# ============================================

class RetailPriceInput(BaseModel):
    """Input for the Retail Price Agent (Agent 1)."""
    product_name: str = Field(..., min_length=1, description="Name of the product")
    location: dict = Field(..., description="Location dict with zip, lat/lng, etc.")


class RetailPriceOutput(BaseModel):
    """Output from the Retail Price Agent (Agent 1)."""
    product_name: str
    average_retail_price: float = Field(..., ge=0, description="Average retail price per unit")
    retail_unit_price: float = Field(..., ge=0, description="Worst-case retail price (avg + 25%)")
    unit_type: str = Field(..., description="Unit of measurement (lb, oz, etc.)")
    markup_percent: float = Field(..., description="Markup percentage applied (0.25 = 25%)")
    sources: list[str] = Field(..., description="List of retail sources checked")
    location_searched: dict = Field(..., description="Location that was searched")


# ============================================
# AGENT 2: BULK PRICE ANALYZER
# ============================================

class BulkPriceInput(BaseModel):
    """Input for the Bulk Price Agent (Agent 2)."""
    product_name: str = Field(..., min_length=1, description="Name of the product")
    retail_unit_price: float = Field(..., ge=0, description="Retail unit price from Agent 1")
    current_pledges: float = Field(..., ge=0, description="Total quantity currently pledged")
    pledged_unit: str = Field(default="lb", description="Unit of pledged quantity")


class BulkPriceOutput(BaseModel):
    """Output from the Bulk Price Agent (Agent 2)."""
    product_name: str
    product_title: str = Field(..., description="Full product title from CSV")
    bulk_unit_price: float = Field(..., ge=0, description="Base bulk price per unit (no fees)")
    bulk_total_cost: float = Field(..., ge=0, description="Total cost of bulk package")
    bulk_minimum: float = Field(..., ge=0, description="Minimum bulk quantity")
    bulk_unit_type: str = Field(..., description="Unit type from bulk product")
    effective_unit_price: float = Field(..., ge=0, description="Price per unit including fees")
    runner_fee: float = Field(..., ge=0, description="Fixed runner delivery fee")
    platform_fee: float = Field(..., ge=0, description="Platform fee (percentage of bulk cost)")
    total_cost_with_fees: float = Field(..., ge=0, description="Total cost including all fees")
    retail_unit_price: float = Field(..., ge=0, description="Retail price for comparison")
    savings_per_unit: float = Field(..., description="Savings per unit vs retail")
    savings_percent: float = Field(..., description="Savings percentage vs retail")
    total_savings: float = Field(..., description="Total savings for current pledges")
    breakeven_quantity: float = Field(..., ge=0, description="Quantity needed to break even")
    current_pledges: float = Field(..., ge=0, description="Current pledged quantity")
    progress_percent: float = Field(..., ge=0, description="Progress toward bulk minimum (percentage, can exceed 100)")
    ready_to_order: bool = Field(..., description="Whether enough pledges to order")
    quantity_remaining: float = Field(..., ge=0, description="Quantity still needed")
    source: str = Field(..., description="Source of bulk pricing (e.g., Costco)")


# ============================================
# LEGACY: PRICE COMPARISON (keeping for compatibility)
# ============================================

class PriceComparisonInput(BaseModel):
    """Input for the Price Comparison Agent."""
    item_name: str = Field(..., min_length=1, description="Name of the item to look up")


class PriceSource(BaseModel):
    """Source information for a price."""
    store_name: str
    store_type: str  # "retail" or "wholesale"
    unit: str


class PriceComparisonOutput(BaseModel):
    """Output from the Price Comparison Agent."""
    item_name: str
    retail_price: float = Field(..., ge=0, description="Per-unit retail price")
    bulk_price: float = Field(..., ge=0, description="Per-unit bulk/wholesale price")
    bulk_minimum: int = Field(..., ge=1, description="Minimum quantity for bulk pricing")
    unit: str = Field(..., description="Unit of measurement (lb, oz, each, etc.)")
    retail_source: PriceSource
    bulk_source: PriceSource
    savings_percent: float = Field(..., description="Percentage savings with bulk")


# ============================================
# AGENT 1: BULK APPROVAL
# ============================================

class BulkApprovalInput(BaseModel):
    """Input for the Bulk Approval Agent."""
    item_name: str = Field(..., description="Name of the item")
    total_quantity_requested: float = Field(..., gt=0, description="Total quantity requested by all users")
    user_locations: list[UserLocation] = Field(..., min_length=1, description="List of user locations")
    retail_price: float = Field(..., ge=0, description="Per-unit retail price")
    bulk_price: float = Field(..., ge=0, description="Per-unit bulk price")
    bulk_minimum: int = Field(..., ge=1, description="Minimum quantity for bulk pricing")


class BulkApprovalOutput(BaseModel):
    """Output from the Bulk Approval Agent."""
    approved: bool = Field(..., description="Whether the bulk buy is approved")
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0-100")
    reasoning: str = Field(..., description="Explanation of the decision")
    effective_price: float = Field(..., ge=0, description="Calculated effective per-unit price")
    total_savings: float = Field(..., description="Total savings compared to retail")
    savings_percent: float = Field(..., description="Percentage savings")
    geographic_spread_miles: float = Field(..., ge=0, description="Max distance between users")
    demand_percent: float = Field(..., ge=0, description="Percentage of bulk minimum met")
    
    # Checks breakdown
    price_check_passed: bool
    distance_check_passed: bool
    demand_check_passed: bool


# ============================================
# AGENT 3: SECURITY CHECK
# ============================================

class SecurityCheckInput(BaseModel):
    """Input for the Security Check Agent."""
    user_id: str = Field(..., description="User identifier")
    user_location: Location = Field(..., description="User's current location")
    drop_zone: Location = Field(..., description="Designated drop-off location")
    trust_score: float = Field(..., ge=0, le=5, description="User's trust score (0-5)")


class SecurityCheckOutput(BaseModel):
    """Output from the Security Check Agent."""
    approved: bool = Field(..., description="Whether the user passes security check")
    risk_level: str = Field(..., description="Risk level: low, medium, or high")
    reasons: list[str] = Field(..., description="List of reasons for the decision")
    recommended_actions: list[str] = Field(..., description="Recommended actions if any")
    distance_to_drop_zone: float = Field(..., ge=0, description="Distance to drop zone in miles")


# ============================================
# ORCHESTRATOR: FULL EVALUATION
# ============================================

class EvaluateBulkBuyInput(BaseModel):
    """Input for the full bulk buy evaluation orchestration."""
    item_name: str = Field(..., description="Name of the item to evaluate")
    user_locations: list[UserLocation] = Field(..., min_length=1, description="List of user locations with quantities")
    drop_zone: Optional[Location] = Field(None, description="Optional pre-specified drop zone")


class EvaluateBulkBuyOutput(BaseModel):
    """Complete output from the orchestrated bulk buy evaluation."""
    # Overall decision
    approved: bool
    confidence: int
    reasoning: str

    # Price information
    price_comparison: PriceComparisonOutput

    # Bulk approval details
    bulk_approval: BulkApprovalOutput

    # Security checks (per user)
    security_checks: list[SecurityCheckOutput]
    all_users_approved: bool

    # Calculated drop zone
    calculated_drop_zone: Location

    # Price range for authorization
    min_price_per_user: dict[str, float]  # user_id -> min price
    max_price_per_user: dict[str, float]  # user_id -> max price (for hold)


# ============================================
# NEW: SIMPLIFIED BULK EVALUATION
# ============================================

class SimpleBulkEvaluationInput(BaseModel):
    """Input for simplified bulk evaluation using new Agent 1 + 2 flow."""
    product_name: str = Field(..., min_length=1, description="Name of the product")
    location: dict = Field(..., description="User location (zip, lat/lng)")
    current_pledges: float = Field(..., ge=0, description="Total quantity pledged")
    pledged_unit: str = Field(default="lb", description="Unit of pledged quantity")


class SimpleBulkEvaluationOutput(BaseModel):
    """Output from simplified bulk evaluation."""
    product_name: str

    # Agent 1 results
    retail: RetailPriceOutput

    # Agent 2 results
    bulk: BulkPriceOutput

    # Recommendation
    recommendation: dict = Field(..., description="Decision and progress info")

