"""
Agent 2: Price Comparison Agent

Determines retail vs bulk prices for items.

Input: Item Name
Output: [normal unit price, bulk unit price] along with sources

In production, this agent would query external APIs (Walmart, Costco, etc.)
In mock mode, it uses a local database of prices.
"""

import json
from typing import Optional

from config.settings import settings
from models.schemas import (
    PriceComparisonInput,
    PriceComparisonOutput,
    PriceSource,
)
from tools.price_tools import get_price_data, search_item_prices


class PriceComparisonAgent:
    """
    Agent responsible for looking up and comparing retail vs bulk prices.
    
    Example from PRD:
    - Input: "rice"
    - Finds Walmart price: $1.50/lb (retail)
    - Finds Costco price: $1.00/lb (bulk, 50lb minimum)
    - Output: [1.50, 1.00] with sources
    """
    
    def __init__(self, use_bedrock: bool = None):
        """
        Initialize the Price Comparison Agent.
        
        Args:
            use_bedrock: Whether to use Bedrock for enhanced reasoning.
                        If None, uses settings.mock_mode to decide.
        """
        self.use_bedrock = not settings.mock_mode if use_bedrock is None else use_bedrock
        
        if self.use_bedrock:
            self._init_bedrock_client()
    
    def _init_bedrock_client(self):
        """Initialize Amazon Bedrock client."""
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
    
    def compare(self, input_data: PriceComparisonInput) -> PriceComparisonOutput:
        """
        Compare retail vs bulk prices for an item.
        
        Args:
            input_data: PriceComparisonInput with item name
            
        Returns:
            PriceComparisonOutput with price comparison details
        """
        # Get price data from our database/API
        price_data = get_price_data(input_data.item_name)
        
        # Extract retail info
        retail = price_data["retail"]
        bulk = price_data["bulk"]
        
        # Calculate savings
        savings = retail["price"] - bulk["price"]
        savings_percent = (savings / retail["price"] * 100) if retail["price"] > 0 else 0
        
        # Build sources
        retail_source = PriceSource(
            store_name=retail["store"],
            store_type=retail["store_type"],
            unit=retail["unit"]
        )
        
        bulk_source = PriceSource(
            store_name=bulk["store"],
            store_type=bulk["store_type"],
            unit=bulk["unit"]
        )
        
        output = PriceComparisonOutput(
            item_name=price_data["item_name"],
            retail_price=retail["price"],
            bulk_price=bulk["price"],
            bulk_minimum=bulk["minimum"],
            unit=retail["unit"],
            retail_source=retail_source,
            bulk_source=bulk_source,
            savings_percent=round(savings_percent, 1)
        )
        
        # If using Bedrock, enhance with LLM insights
        if self.use_bedrock:
            output = self._enhance_with_bedrock(input_data.item_name, output)
        
        return output
    
    def search(self, query: str, limit: int = 5) -> list[PriceComparisonOutput]:
        """
        Search for items and return their price comparisons.
        
        Args:
            query: Search query
            limit: Maximum results to return
            
        Returns:
            List of PriceComparisonOutput for matching items
        """
        results = search_item_prices(query, limit)
        
        outputs = []
        for result in results:
            item = result["item"]
            retail = item["retail"]
            bulk = item["bulk"]
            
            retail_source = PriceSource(
                store_name=retail["store"],
                store_type=retail["store_type"],
                unit=retail["unit"]
            )
            
            bulk_source = PriceSource(
                store_name=bulk["store"],
                store_type=bulk["store_type"],
                unit=bulk["unit"]
            )
            
            outputs.append(PriceComparisonOutput(
                item_name=item["name"],
                retail_price=retail["price"],
                bulk_price=bulk["price"],
                bulk_minimum=bulk["minimum"],
                unit=retail["unit"],
                retail_source=retail_source,
                bulk_source=bulk_source,
                savings_percent=result["savings_percent"]
            ))
        
        return outputs
    
    def _enhance_with_bedrock(
        self,
        item_name: str,
        output: PriceComparisonOutput
    ) -> PriceComparisonOutput:
        """
        Use Bedrock to provide additional context or verify prices.
        
        In a production system, this could:
        - Validate prices against real-time data
        - Suggest alternative items with better deals
        - Provide seasonal pricing insights
        """
        prompt = f"""You are a price comparison assistant for a community bulk buying app.

Item: {item_name}
Current Prices Found:
- Retail: ${output.retail_price:.2f}/{output.unit} at {output.retail_source.store_name}
- Bulk: ${output.bulk_price:.2f}/{output.unit} at {output.bulk_source.store_name} (min {output.bulk_minimum} {output.unit})
- Savings: {output.savings_percent:.1f}%

Is this pricing reasonable for {item_name}? Respond with just "yes" or "no"."""
        
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 50,
                        "temperature": 0.1,
                    }
                })
            )
            
            # Parse response (basic validation)
            response_body = json.loads(response["body"].read())
            # Price validation would happen here in production
            
        except Exception as e:
            print(f"Bedrock enhancement failed: {e}")
        
        return output
    
    def get_best_bulk_deals(self, limit: int = 5) -> list[dict]:
        """
        Get items with the best bulk savings.
        
        Args:
            limit: Number of items to return
            
        Returns:
            List of items sorted by savings percentage
        """
        # Search all items
        all_results = search_item_prices("", limit=100)  # Get all
        
        # Sort by savings
        sorted_results = sorted(
            all_results,
            key=lambda x: x["savings_percent"],
            reverse=True
        )
        
        return sorted_results[:limit]


# Convenience function for direct tool usage
def compare_prices(item_name: str) -> dict:
    """
    Tool function to compare prices for an item.
    
    This is the function that can be registered as a Strands Agent tool.
    
    Args:
        item_name: Name of the item to look up
        
    Returns:
        Dictionary with price comparison data
    """
    agent = PriceComparisonAgent(use_bedrock=False)  # Always use local for tool
    result = agent.compare(PriceComparisonInput(item_name=item_name))
    return result.model_dump()

