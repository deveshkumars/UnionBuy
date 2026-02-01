"""
Agent 1: Retail Price Finder

Uses LLM to find real retail prices from markets based on location and product.
Adds 25% markup to establish the "worst case" retail price baseline.

This creates a conservative estimate for comparison against bulk prices.
"""

import json
from typing import Optional

from config.settings import settings
from models.schemas import RetailPriceInput, RetailPriceOutput


class RetailPriceAgent:
    """
    Agent responsible for finding retail prices using LLM to search markets.

    Example:
    - Input: "rice", location: {"zip": "10001"}
    - Uses LLM to find retail prices from local markets
    - Finds average retail: $1.50/lb
    - Applies 25% markup: $1.87/lb (worst case)
    - Output: retail_unit_price = 1.87

    This worst-case price is used by Agent 2 to calculate bulk savings.
    """

    def __init__(self, use_bedrock: bool = None):
        """
        Initialize the Retail Price Agent.

        Args:
            use_bedrock: Whether to use Bedrock for pricing lookup.
                        If None, uses settings.mock_mode to decide.
        """
        self.use_bedrock = not settings.mock_mode if use_bedrock is None else use_bedrock
        self.markup_percent = 0.25  # 25% markup for worst case

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
            print("Falling back to estimated prices")
            self.use_bedrock = False

    def _query_llm_for_price(self, product_name: str, location: dict) -> dict:
        """
        Use LLM to find retail prices from markets.

        Args:
            product_name: Name of the product
            location: Location dict with zip or coordinates

        Returns:
            Dictionary with price info
        """
        location_str = location.get("zip", location.get("city", "unknown location"))

        prompt = f"""Find the current average retail price for "{product_name}" at grocery stores/supermarkets near location: {location_str}.

Provide the response in JSON format:
{{
    "average_price": <price as float>,
    "unit": "<unit type: lb, oz, each, etc>",
    "stores": ["<store1>", "<store2>"],
    "confidence": "<high/medium/low>"
}}

Base your answer on typical grocery store prices for this product. Be realistic and use market knowledge."""

        try:
            # Call Bedrock
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 500,
                        "temperature": 0.3,
                    }
                })
            )

            response_body = json.loads(response['body'].read())
            llm_output = response_body.get('results', [{}])[0].get('outputText', '')

            # Parse JSON from LLM output
            # Extract JSON from response (handle markdown code blocks)
            llm_output = llm_output.strip()
            if '```json' in llm_output:
                llm_output = llm_output.split('```json')[1].split('```')[0].strip()
            elif '```' in llm_output:
                llm_output = llm_output.split('```')[1].split('```')[0].strip()

            price_data = json.loads(llm_output)
            return price_data

        except Exception as e:
            print(f"Error querying LLM: {e}")
            # Fallback to estimated price
            return {
                "average_price": 2.99,
                "unit": "lb",
                "stores": ["Estimated"],
                "confidence": "low"
            }

    def find_retail_price(self, input_data: RetailPriceInput) -> RetailPriceOutput:
        """
        Find retail price with 25% markup (worst case scenario).

        Args:
            input_data: RetailPriceInput with product name and location

        Returns:
            RetailPriceOutput with retail price and markup details
        """
        if self.use_bedrock:
            # Use LLM to find real market prices
            price_data = self._query_llm_for_price(
                input_data.product_name,
                input_data.location
            )
            base_price = price_data["average_price"]
            unit = price_data["unit"]
            sources = price_data.get("stores", ["LLM Market Research"])
        else:
            # Fallback to simple estimation
            base_price = 2.99
            unit = "lb"
            sources = ["Estimated"]

        # Calculate worst-case price (average + 25% markup)
        worst_case_price = base_price * (1 + self.markup_percent)

        # Build output
        output = RetailPriceOutput(
            product_name=input_data.product_name,
            average_retail_price=base_price,
            retail_unit_price=round(worst_case_price, 2),
            unit_type=unit,
            markup_percent=self.markup_percent,
            sources=sources,
            location_searched=input_data.location
        )

        return output

    def find_retail_price_dict(self, product_name: str, location: dict) -> dict:
        """
        Convenience method that returns a dictionary instead of Pydantic model.

        Args:
            product_name: Name of the product
            location: Location dict (e.g., {"zip": "10001"})

        Returns:
            Dictionary with retail price information
        """
        input_data = RetailPriceInput(
            product_name=product_name,
            location=location
        )
        result = self.find_retail_price(input_data)
        return result.model_dump()


# Convenience function for direct tool usage
def find_retail_price(product_name: str, location: dict) -> dict:
    """
    Tool function to find retail price for a product using LLM.

    This is the function that can be registered as a Strands Agent tool.

    Args:
        product_name: Name of the product to look up
        location: Location dict with zip code or lat/lng

    Returns:
        Dictionary with retail price data including 25% markup
    """
    agent = RetailPriceAgent()  # Uses settings.mock_mode to decide LLM usage
    result = agent.find_retail_price_dict(product_name, location)
    return result
