"""
Price lookup tools for the Price Comparison Agent.
Uses the @tool decorator pattern compatible with Strands Agents SDK.
"""

import json
from pathlib import Path
from typing import Optional
from functools import lru_cache

from config.settings import settings


@lru_cache(maxsize=1)
def _load_mock_prices() -> dict:
    """Load mock price data from JSON file."""
    data_file = settings.data_dir / "mock_prices.json"
    if data_file.exists():
        with open(data_file, "r") as f:
            return json.load(f)
    return {"items": []}


def _normalize_item_name(name: str) -> str:
    """Normalize item name for matching."""
    return name.lower().strip()


def _find_item(item_name: str) -> Optional[dict]:
    """Find an item in the mock database by name or alias."""
    normalized_name = _normalize_item_name(item_name)
    data = _load_mock_prices()
    
    for item in data.get("items", []):
        # Check exact name match
        if _normalize_item_name(item["name"]) == normalized_name:
            return item
        
        # Check aliases
        aliases = [_normalize_item_name(a) for a in item.get("aliases", [])]
        if normalized_name in aliases:
            return item
        
        # Check partial match
        if normalized_name in _normalize_item_name(item["name"]):
            return item
        
        # Check if any alias contains the search term
        for alias in aliases:
            if normalized_name in alias or alias in normalized_name:
                return item
    
    return None


def get_price_data(item_name: str) -> dict:
    """
    Get price data for an item from the mock database.
    
    This is the main tool function that agents use to look up prices.
    In production, this would query external APIs.
    
    Args:
        item_name: Name of the item to look up
        
    Returns:
        Dictionary containing retail and bulk price information
    """
    item = _find_item(item_name)
    
    if item is None:
        # Return default/estimated prices if item not found
        return {
            "found": False,
            "item_name": item_name,
            "retail": {
                "price": 2.99,
                "unit": "each",
                "store": "Generic Retail",
                "store_type": "retail"
            },
            "bulk": {
                "price": 1.99,
                "unit": "each",
                "minimum": 20,
                "store": "Generic Wholesale",
                "store_type": "wholesale"
            },
            "message": f"Item '{item_name}' not found in database. Using estimated prices."
        }
    
    return {
        "found": True,
        "item_name": item["name"],
        "retail": item["retail"],
        "bulk": item["bulk"],
        "message": f"Found exact match for '{item_name}'"
    }


def search_item_prices(query: str, limit: int = 5) -> list[dict]:
    """
    Search for items matching a query.
    
    Args:
        query: Search query string
        limit: Maximum number of results to return
        
    Returns:
        List of matching items with their prices
    """
    normalized_query = _normalize_item_name(query)
    data = _load_mock_prices()
    results = []
    
    for item in data.get("items", []):
        score = 0
        
        # Check name match
        item_name = _normalize_item_name(item["name"])
        if normalized_query == item_name:
            score = 100
        elif normalized_query in item_name:
            score = 80
        
        # Check alias matches
        for alias in item.get("aliases", []):
            alias_normalized = _normalize_item_name(alias)
            if normalized_query == alias_normalized:
                score = max(score, 90)
            elif normalized_query in alias_normalized:
                score = max(score, 70)
        
        if score > 0:
            results.append({
                "item": item,
                "score": score,
                "savings_percent": round(
                    (1 - item["bulk"]["price"] / item["retail"]["price"]) * 100, 1
                )
            })
    
    # Sort by score and return top results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_unit_savings(retail_price: float, bulk_price: float) -> dict:
    """
    Calculate savings between retail and bulk prices.
    
    Args:
        retail_price: Per-unit retail price
        bulk_price: Per-unit bulk price
        
    Returns:
        Dictionary with savings information
    """
    savings = retail_price - bulk_price
    savings_percent = (savings / retail_price) * 100 if retail_price > 0 else 0
    
    return {
        "savings_per_unit": round(savings, 2),
        "savings_percent": round(savings_percent, 1),
        "is_bulk_cheaper": bulk_price < retail_price
    }


# Tool decorator pattern for Strands Agents SDK
# When using with strands-agents, wrap these functions with @tool
def tool(func):
    """
    Decorator to mark a function as a tool for Strands Agents.
    This is a placeholder that will be replaced with the actual
    strands-agents @tool decorator in production.
    """
    func._is_tool = True
    func._tool_name = func.__name__
    return func


# Mark functions as tools
get_price_data = tool(get_price_data)
search_item_prices = tool(search_item_prices)
calculate_unit_savings = tool(calculate_unit_savings)

