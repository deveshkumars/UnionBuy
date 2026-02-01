"""
Agent 2: Bulk Price Analyzer

Finds bulk prices from CSV dataset (Costco data) and calculates:
1. Unit price from bulk package (e.g., $49.99 for 50 lbs = $1.00/lb)
2. Total cost including fees (runner + platform)
3. Breakeven quantity needed to beat retail
4. Progress toward bulk minimum
5. Savings vs worst-case retail price
"""

import pandas as pd
import re
from typing import Optional
from pathlib import Path

from config.settings import settings
from models.schemas import BulkPriceInput, BulkPriceOutput


class BulkPriceAgent:
    """
    Agent responsible for analyzing bulk pricing from CSV dataset.

    Example:
    - Input: "rice", retail_price=1.87, current_pledges=45
    - Searches GroceryDataset.csv for "rice"
    - Finds: "Kirkland Long Grain White Rice, 50 lbs" at $49.99
    - Calculates: bulk_unit_price = $49.99 / 50 = $1.00/lb
    - Adds fees: runner=$15, platform=5%
    - Effective price: $67.50 / 50 = $1.35/lb
    - Savings vs retail ($1.87): 28%
    - Progress: 45 lbs / 50 lbs = 90%
    """

    # Fixed fee constants
    RUNNER_FEE = 15.00  # Flat delivery fee
    PLATFORM_FEE_PERCENT = 0.05  # 5% platform fee

    def __init__(self, csv_path: Optional[str] = None):
        """
        Initialize the Bulk Price Agent.

        Args:
            csv_path: Path to GroceryDataset.csv. If None, uses default location.
        """
        if csv_path:
            self.csv_path = Path(csv_path)
        else:
            self.csv_path = settings.data_dir / "GroceryDataset.csv"

        # Cache the dataframe
        self._df = None

    def _load_csv(self) -> pd.DataFrame:
        """Load CSV data with caching."""
        if self._df is None:
            if not self.csv_path.exists():
                raise FileNotFoundError(
                    f"GroceryDataset.csv not found at {self.csv_path}. "
                    "Please ensure the CSV file is in the agentcore/data/ directory."
                )
            self._df = pd.read_csv(self.csv_path)
        return self._df

    def _parse_quantity_from_text(self, text: str) -> Optional[tuple[float, str]]:
        """
        Extract quantity and unit from text.

        Examples:
            "50 lbs" -> (50.0, "lb")
            "32 oz" -> (32.0, "oz")
            "100 count" -> (100.0, "count")
            "6.8 lbs" -> (6.8, "lb")

        Args:
            text: Text to parse

        Returns:
            Tuple of (quantity, unit) or None if not found
        """
        if pd.isna(text):
            return None

        # Common patterns for quantities
        patterns = [
            r'(\d+\.?\d*)\s*(lbs?|pounds?)',
            r'(\d+\.?\d*)\s*(oz|ounces?)',
            r'(\d+\.?\d*)\s*(gallon|gal)',
            r'(\d+\.?\d*)\s*(count|ct|pcs?|pieces?)',
            r'(\d+\.?\d*)\s*(kg|kilograms?)',
            r'(\d+\.?\d*)\s*(servings?)',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                quantity = float(match.group(1))
                unit = match.group(2).lower()
                # Normalize units
                if unit in ['lbs', 'pounds', 'pound']:
                    unit = 'lb'
                elif unit in ['ounces', 'ounce']:
                    unit = 'oz'
                elif unit in ['gal', 'gallons', 'gallon']:
                    unit = 'gallon'
                elif unit in ['ct', 'pcs', 'pieces', 'piece']:
                    unit = 'count'
                elif unit in ['kilograms', 'kilogram']:
                    unit = 'kg'
                elif unit in ['servings', 'serving']:
                    unit = 'serving'

                return (quantity, unit)

        return None

    def analyze(self, input_data: BulkPriceInput) -> BulkPriceOutput:
        """
        Analyze bulk pricing from CSV and calculate breakeven.

        Args:
            input_data: BulkPriceInput with product name, retail info, and pledges

        Returns:
            BulkPriceOutput with complete bulk pricing analysis
        """
        df = self._load_csv()

        # Search for product in Title column
        product_name = input_data.product_name.lower()
        matches = df[df['Title'].str.contains(product_name, case=False, na=False)]

        if matches.empty:
            # Try searching in Category or Description as fallback
            matches = df[
                df['Sub Category'].str.contains(product_name, case=False, na=False) |
                df['Product Description'].str.contains(product_name, case=False, na=False)
            ]

        if matches.empty:
            raise ValueError(
                f"Product '{input_data.product_name}' not found in bulk catalog (CSV). "
                "Try a different product name or check the dataset."
            )

        # Filter matches to prefer larger bulk quantities (actual bulk items, not treats/snacks)
        # Parse quantities for all matches and sort by size
        scored_matches = []
        for idx, row in matches.iterrows():
            qty_info = self._parse_quantity_from_text(str(row['Title']))
            if not qty_info:
                qty_info = self._parse_quantity_from_text(str(row.get('Feature', '')))

            if qty_info:
                quantity, unit = qty_info
                # Prefer larger quantities and avoid "count" items unless they're very large
                if unit in ['lb', 'oz', 'kg', 'gallon']:
                    score = quantity  # Prefer larger weights/volumes
                elif unit == 'count' and quantity >= 20:
                    score = quantity * 0.1  # Counts get lower priority unless large
                else:
                    score = 0.01  # Very low score for small count items

                scored_matches.append((idx, score, quantity, unit))

        if scored_matches:
            # Sort by score (descending) and take the highest scoring match
            scored_matches.sort(key=lambda x: x[1], reverse=True)
            best_idx = scored_matches[0][0]
            matches = matches.loc[[best_idx]]

        # Get best match (first result for now, could add ranking)
        row = matches.iloc[0]

        # Parse price
        price_str = str(row['Price']).replace('$', '').replace(',', '').strip()
        try:
            bulk_total_cost = float(price_str)
        except ValueError:
            raise ValueError(f"Could not parse price: {row['Price']}")

        # Extract quantity from Title
        title = str(row['Title'])
        qty_info = self._parse_quantity_from_text(title)

        # If not in title, try Features column
        if not qty_info:
            features = str(row.get('Feature', ''))
            qty_info = self._parse_quantity_from_text(features)

        if not qty_info:
            raise ValueError(
                f"Cannot determine bulk quantity for '{title}'. "
                "Product title/features don't contain parseable quantity."
            )

        bulk_quantity, bulk_unit = qty_info

        # Calculate base unit price
        bulk_unit_price = bulk_total_cost / bulk_quantity

        # Calculate total cost with fees
        platform_fee = bulk_total_cost * self.PLATFORM_FEE_PERCENT
        total_cost_with_fees = bulk_total_cost + self.RUNNER_FEE + platform_fee
        effective_unit_price = total_cost_with_fees / bulk_quantity

        # Calculate savings vs retail worst case
        retail_unit = input_data.retail_unit_price
        savings_per_unit = retail_unit - effective_unit_price
        savings_percent = (savings_per_unit / retail_unit) if retail_unit > 0 else 0
        total_savings = savings_per_unit * input_data.current_pledges

        # Calculate breakeven quantity
        # Need to cover fixed costs (runner fee) with per-unit savings
        if savings_per_unit > 0:
            breakeven_qty = self.RUNNER_FEE / savings_per_unit
        else:
            # No savings, need full bulk quantity
            breakeven_qty = bulk_quantity

        # Calculate progress
        progress = input_data.current_pledges / bulk_quantity if bulk_quantity > 0 else 0
        ready_to_order = input_data.current_pledges >= bulk_quantity
        remaining = max(0, bulk_quantity - input_data.current_pledges)

        return BulkPriceOutput(
            product_name=input_data.product_name,
            product_title=title,
            bulk_unit_price=round(bulk_unit_price, 2),
            bulk_total_cost=round(bulk_total_cost, 2),
            bulk_minimum=bulk_quantity,
            bulk_unit_type=bulk_unit,
            effective_unit_price=round(effective_unit_price, 2),
            runner_fee=self.RUNNER_FEE,
            platform_fee=round(platform_fee, 2),
            total_cost_with_fees=round(total_cost_with_fees, 2),
            retail_unit_price=retail_unit,
            savings_per_unit=round(savings_per_unit, 2),
            savings_percent=round(savings_percent, 2),
            total_savings=round(total_savings, 2),
            breakeven_quantity=round(breakeven_qty, 1),
            current_pledges=input_data.current_pledges,
            progress_percent=round(progress * 100, 1),
            ready_to_order=ready_to_order,
            quantity_remaining=round(remaining, 1),
            source="Costco (CSV Dataset)"
        )

    def search_products(self, query: str, limit: int = 5) -> list[dict]:
        """
        Search for products in CSV by name.

        Args:
            query: Search term
            limit: Max results to return

        Returns:
            List of matching products with basic info
        """
        df = self._load_csv()

        query_lower = query.lower()
        matches = df[df['Title'].str.contains(query_lower, case=False, na=False)]

        results = []
        for _, row in matches.head(limit).iterrows():
            # Try to parse quantity
            qty_info = self._parse_quantity_from_text(str(row['Title']))
            if not qty_info:
                qty_info = self._parse_quantity_from_text(str(row.get('Feature', '')))

            price_str = str(row['Price']).replace('$', '').replace(',', '').strip()
            try:
                price = float(price_str)
            except ValueError:
                price = 0.0

            results.append({
                "title": str(row['Title']),
                "price": price,
                "quantity": qty_info[0] if qty_info else None,
                "unit": qty_info[1] if qty_info else None,
                "category": str(row.get('Sub Category', '')),
                "rating": str(row.get('Rating', ''))
            })

        return results


# Convenience function for direct tool usage
def analyze_bulk_price(
    product_name: str,
    retail_unit_price: float,
    current_pledges: float,
    pledged_unit: str = "lb"
) -> dict:
    """
    Tool function to analyze bulk pricing from CSV.

    Args:
        product_name: Name of the product
        retail_unit_price: Retail price per unit (from Agent 1)
        current_pledges: Total quantity pledged by users
        pledged_unit: Unit of measurement

    Returns:
        Dictionary with bulk price analysis
    """
    agent = BulkPriceAgent()
    input_data = BulkPriceInput(
        product_name=product_name,
        retail_unit_price=retail_unit_price,
        current_pledges=current_pledges,
        pledged_unit=pledged_unit
    )
    result = agent.analyze(input_data)
    return result.model_dump()
