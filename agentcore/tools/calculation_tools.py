"""
Financial calculation tools for bulk buy evaluations.
"""

from typing import Optional


def calculate_effective_price(
    bulk_price: float,
    bulk_minimum: int,
    total_demand: float
) -> dict:
    """
    Calculate the effective per-unit price when buying in bulk.
    
    Handles the "modulo problem" where demand doesn't perfectly
    match bulk quantities.
    
    Args:
        bulk_price: Per-unit bulk price
        bulk_minimum: Minimum quantity for bulk pricing
        total_demand: Total quantity demanded by all users
        
    Returns:
        Dictionary with effective pricing information
    """
    if total_demand <= 0:
        return {
            "effective_price": bulk_price,
            "total_cost": 0,
            "quantity_to_buy": 0,
            "excess_quantity": 0,
            "message": "No demand"
        }
    
    # Calculate how many bulk units we need to buy
    if total_demand >= bulk_minimum:
        # We can buy bulk - calculate if we need to round up
        quantity_to_buy = total_demand
        excess = 0
    else:
        # Demand is less than minimum - we'd have excess
        quantity_to_buy = bulk_minimum
        excess = bulk_minimum - total_demand
    
    total_cost = quantity_to_buy * bulk_price
    
    # Effective price is total cost divided by actual demand
    effective_price = total_cost / total_demand if total_demand > 0 else bulk_price
    
    return {
        "effective_price": round(effective_price, 4),
        "total_cost": round(total_cost, 2),
        "quantity_to_buy": quantity_to_buy,
        "excess_quantity": round(excess, 2),
        "bulk_minimum": bulk_minimum,
        "total_demand": total_demand,
        "message": "Buying at bulk price" if total_demand >= bulk_minimum else "Buying minimum bulk quantity with excess"
    }


def calculate_savings(
    retail_price: float,
    bulk_price: float,
    quantity: float,
    effective_price: Optional[float] = None
) -> dict:
    """
    Calculate savings from buying bulk vs retail.
    
    Args:
        retail_price: Per-unit retail price
        bulk_price: Per-unit bulk price
        quantity: Quantity being purchased
        effective_price: Optional effective price (accounting for modulo)
        
    Returns:
        Dictionary with savings information
    """
    actual_bulk_price = effective_price if effective_price is not None else bulk_price
    
    retail_total = retail_price * quantity
    bulk_total = actual_bulk_price * quantity
    
    savings = retail_total - bulk_total
    savings_percent = (savings / retail_total * 100) if retail_total > 0 else 0
    
    return {
        "retail_total": round(retail_total, 2),
        "bulk_total": round(bulk_total, 2),
        "savings": round(savings, 2),
        "savings_percent": round(savings_percent, 1),
        "per_unit_savings": round(retail_price - actual_bulk_price, 2),
        "is_worth_it": savings > 0
    }


def calculate_user_share(
    total_cost: float,
    user_quantities: dict[str, float],
    excess_quantity: float = 0,
    distribute_excess: bool = True
) -> dict[str, dict]:
    """
    Calculate each user's share of the total cost.
    
    Optionally distributes excess quantity evenly among users.
    
    Args:
        total_cost: Total cost of the bulk purchase
        user_quantities: Dictionary mapping user_id to requested quantity
        excess_quantity: Excess quantity from bulk minimum
        distribute_excess: Whether to distribute excess to users
        
    Returns:
        Dictionary mapping user_id to their cost and quantity details
    """
    total_quantity = sum(user_quantities.values())
    
    if total_quantity <= 0:
        return {}
    
    results = {}
    num_users = len(user_quantities)
    
    # Calculate excess per user if distributing
    excess_per_user = (excess_quantity / num_users) if (distribute_excess and num_users > 0) else 0
    
    for user_id, quantity in user_quantities.items():
        # User's share of the cost based on their proportion
        proportion = quantity / total_quantity
        user_cost = total_cost * proportion
        
        # User's final quantity (including any distributed excess)
        final_quantity = quantity + excess_per_user
        
        # Effective price for this user
        effective_price = user_cost / quantity if quantity > 0 else 0
        
        results[user_id] = {
            "requested_quantity": quantity,
            "final_quantity": round(final_quantity, 2),
            "bonus_quantity": round(excess_per_user, 2),
            "cost": round(user_cost, 2),
            "effective_price_per_unit": round(effective_price, 4),
            "proportion": round(proportion, 4)
        }
    
    return results


def calculate_price_range(
    retail_price: float,
    bulk_price: float,
    quantity: float
) -> dict:
    """
    Calculate min/max price range for pre-authorization holds.
    
    Min = best case (bulk price)
    Max = worst case (retail price, for card authorization)
    
    Args:
        retail_price: Per-unit retail price
        bulk_price: Per-unit bulk price
        quantity: User's requested quantity
        
    Returns:
        Dictionary with min/max prices for authorization
    """
    min_price = bulk_price * quantity
    max_price = retail_price * quantity
    
    return {
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "estimated_price": round((min_price + max_price) / 2, 2),
        "potential_savings": round(max_price - min_price, 2),
        "quantity": quantity
    }


def should_rollover(
    current_demand: float,
    bulk_minimum: int,
    min_demand_percent: float = 0.6
) -> dict:
    """
    Determine if an order should rollover to the next day.
    
    Args:
        current_demand: Current total demand
        bulk_minimum: Minimum quantity for bulk pricing
        min_demand_percent: Minimum percentage of bulk minimum needed
        
    Returns:
        Dictionary with rollover decision and details
    """
    demand_percent = current_demand / bulk_minimum if bulk_minimum > 0 else 0
    needed_for_minimum = max(0, bulk_minimum - current_demand)
    threshold = bulk_minimum * min_demand_percent
    
    should_execute = current_demand >= threshold
    
    return {
        "should_rollover": not should_execute,
        "should_execute": should_execute,
        "current_demand": current_demand,
        "bulk_minimum": bulk_minimum,
        "demand_percent": round(demand_percent * 100, 1),
        "threshold_percent": round(min_demand_percent * 100, 1),
        "needed_for_minimum": round(needed_for_minimum, 2),
        "message": "Execute bulk buy" if should_execute else f"Rollover - need {needed_for_minimum} more units"
    }


# Tool decorator pattern for Strands Agents SDK
def tool(func):
    """Decorator to mark a function as a tool for Strands Agents."""
    func._is_tool = True
    func._tool_name = func.__name__
    return func


# Mark functions as tools
calculate_effective_price = tool(calculate_effective_price)
calculate_savings = tool(calculate_savings)
calculate_user_share = tool(calculate_user_share)
calculate_price_range = tool(calculate_price_range)
should_rollover = tool(should_rollover)

