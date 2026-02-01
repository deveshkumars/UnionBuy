#!/usr/bin/env python3
"""
Test script for new Agent 1 (Retail Price) + Agent 2 (Bulk Price from CSV) flow.

Run this to verify the agents work correctly:
    python test_new_agents.py
"""

import sys
from pathlib import Path

# Add agentcore to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.retail_price_agent import RetailPriceAgent
from agents.bulk_price_agent import BulkPriceAgent
from models.schemas import RetailPriceInput, BulkPriceInput


def test_agent_1_retail_price():
    """Test Agent 1: Retail Price Finder"""
    print("=" * 60)
    print("Testing Agent 1: Retail Price Finder")
    print("=" * 60)

    agent = RetailPriceAgent()

    # Test with rice
    input_data = RetailPriceInput(
        product_name="rice",
        location={"zip": "10001"}
    )

    result = agent.find_retail_price(input_data)

    print(f"\n✅ Agent 1 Results for '{result.product_name}':")
    print(f"   Average retail price: ${result.average_retail_price:.2f}/{result.unit_type}")
    print(f"   Worst-case price (25% markup): ${result.retail_unit_price:.2f}/{result.unit_type}")
    print(f"   Sources: {', '.join(result.sources)}")
    print()

    return result


def test_agent_2_bulk_price(retail_price: float):
    """Test Agent 2: Bulk Price Analyzer from CSV"""
    print("=" * 60)
    print("Testing Agent 2: Bulk Price Analyzer (CSV)")
    print("=" * 60)

    agent = BulkPriceAgent()

    # Test with rice, simulating 45 lbs pledged
    input_data = BulkPriceInput(
        product_name="rice",
        retail_unit_price=retail_price,
        current_pledges=45.0,
        pledged_unit="lb"
    )

    try:
        result = agent.analyze(input_data)

        print(f"\n✅ Agent 2 Results for '{result.product_name}':")
        print(f"\n📦 Bulk Product Found:")
        print(f"   {result.product_title}")
        print(f"\n💰 Pricing:")
        print(f"   Bulk total cost: ${result.bulk_total_cost:.2f}")
        print(f"   Bulk unit price: ${result.bulk_unit_price:.2f}/{result.bulk_unit_type}")
        print(f"   Bulk minimum: {result.bulk_minimum} {result.bulk_unit_type}")
        print(f"\n💵 Fees:")
        print(f"   Runner fee: ${result.runner_fee:.2f}")
        print(f"   Platform fee (5%): ${result.platform_fee:.2f}")
        print(f"   Total with fees: ${result.total_cost_with_fees:.2f}")
        print(f"   Effective unit price: ${result.effective_unit_price:.2f}/{result.bulk_unit_type}")
        print(f"\n📊 Comparison vs Retail (${result.retail_unit_price:.2f}/{result.bulk_unit_type}):")
        print(f"   Savings per unit: ${result.savings_per_unit:.2f}")
        print(f"   Savings percent: {result.savings_percent * 100:.1f}%")
        print(f"   Total savings: ${result.total_savings:.2f}")
        print(f"\n📈 Progress:")
        print(f"   Current pledges: {result.current_pledges} {result.bulk_unit_type}")
        print(f"   Bulk minimum: {result.bulk_minimum} {result.bulk_unit_type}")
        print(f"   Progress: {result.progress_percent:.1f}%")
        print(f"   Remaining: {result.quantity_remaining} {result.bulk_unit_type}")
        print(f"   Breakeven quantity: {result.breakeven_quantity} {result.bulk_unit_type}")
        print(f"   Ready to order: {'✅ YES' if result.ready_to_order else '❌ NO'}")
        print()

        return result

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure GroceryDataset.csv is in agentcore/data/")
        return None


def test_orchestrator():
    """Test the full orchestration flow"""
    print("=" * 60)
    print("Testing Full Orchestrator Flow")
    print("=" * 60)

    from handlers.orchestrator import Orchestrator
    from models.schemas import SimpleBulkEvaluationInput

    orchestrator = Orchestrator()

    input_data = SimpleBulkEvaluationInput(
        product_name="rice",
        location={"zip": "10001"},
        current_pledges=45.0,
        pledged_unit="lb"
    )

    try:
        result = orchestrator.evaluate_simple(input_data)

        print(f"\n✅ Orchestrator Results:")
        print(f"\n📦 Product: {result.product_name}")
        print(f"\n🏪 Retail (Worst Case):")
        print(f"   ${result.retail.retail_unit_price:.2f}/{result.retail.unit_type}")
        print(f"\n🏬 Bulk (Best Case):")
        print(f"   ${result.bulk.effective_unit_price:.2f}/{result.bulk.bulk_unit_type}")
        print(f"\n💡 Recommendation:")
        for key, value in result.recommendation.items():
            print(f"   {key}: {value}")
        print()

        # Visual progress bar
        progress = result.recommendation['progress_percent']
        bar_length = 40
        filled = int(bar_length * progress / 100)
        bar = '█' * filled + '░' * (bar_length - filled)
        print(f"📊 Progress Bar:")
        print(f"   [{bar}] {progress:.1f}%")
        print(f"   {result.recommendation['current_pledges']:.0f} / {result.recommendation['bulk_minimum']:.0f} {result.bulk.bulk_unit_type}")
        print()

        if result.recommendation['should_proceed']:
            print("✅ READY TO ORDER!")
        else:
            print(f"⏳ Need {result.recommendation['quantity_remaining']:.1f} more {result.bulk.bulk_unit_type}")
        print()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 Testing New Agent Flow (Agent 1 + Agent 2)\n")

    # Test Agent 1
    retail_result = test_agent_1_retail_price()

    # Test Agent 2
    if retail_result:
        bulk_result = test_agent_2_bulk_price(retail_result.retail_unit_price)

    # Test full orchestrator
    print()
    test_orchestrator()

    print("\n✨ Testing Complete!\n")
