"""
CLI tool for testing Bulk Buy Agents from the command line.

Usage:
    python -m cli.test_agents price-compare --item "jasmine rice"
    python -m cli.test_agents bulk-approval --item "rice" --quantity 10
    python -m cli.test_agents security-check --user-lat 41.82 --user-long -71.42
    python -m cli.test_agents demo-flow
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from typing import Optional

from config.settings import settings
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


app = typer.Typer(
    name="test-agents",
    help="CLI tool for testing Bulk Buy Agents",
    add_completion=False,
)
console = Console()


def print_header():
    """Print CLI header."""
    console.print(Panel.fit(
        "[bold cyan]Bulk Buy Agents CLI[/bold cyan]\n"
        f"Mode: [yellow]{'MOCK' if settings.mock_mode else 'BEDROCK'}[/yellow]",
        border_style="cyan"
    ))
    console.print()


@app.command("price-compare")
def price_compare(
    item: str = typer.Option(..., "--item", "-i", help="Item name to look up")
):
    """
    Test Agent 2: Price Comparison
    
    Look up retail vs bulk prices for an item.
    """
    print_header()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("Fetching prices...", total=None)
        
        agent = PriceComparisonAgent()
        result = agent.compare(PriceComparisonInput(item_name=item))
    
    # Display results
    table = Table(title=f"Price Comparison: {result.item_name}")
    table.add_column("Source", style="cyan")
    table.add_column("Type", style="white")
    table.add_column("Price", style="green")
    table.add_column("Unit", style="white")
    
    table.add_row(
        result.retail_source.store_name,
        "Retail",
        f"${result.retail_price:.2f}",
        result.unit
    )
    table.add_row(
        result.bulk_source.store_name,
        f"Bulk (min {result.bulk_minimum})",
        f"${result.bulk_price:.2f}",
        result.unit
    )
    
    console.print(table)
    console.print()
    console.print(f"[bold green]Savings: {result.savings_percent:.1f}%[/bold green]")


@app.command("bulk-approval")
def bulk_approval(
    item: str = typer.Option(..., "--item", "-i", help="Item name"),
    quantity: float = typer.Option(10, "--quantity", "-q", help="Quantity requested"),
    lat: float = typer.Option(41.8236, "--lat", help="User latitude"),
    long: float = typer.Option(-71.4222, "--long", help="User longitude"),
):
    """
    Test Agent 1: Bulk Approval
    
    Evaluate if a bulk buy makes sense.
    """
    print_header()
    
    # First get prices
    price_agent = PriceComparisonAgent()
    prices = price_agent.compare(PriceComparisonInput(item_name=item))
    
    # Create mock user locations (simulate a few neighbors)
    user_locations = [
        UserLocation(
            user_id="user-1",
            location=Location(latitude=lat, longitude=long),
            quantity=quantity
        ),
        UserLocation(
            user_id="user-2",
            location=Location(latitude=lat + 0.01, longitude=long - 0.005),
            quantity=quantity * 0.8
        ),
        UserLocation(
            user_id="user-3",
            location=Location(latitude=lat - 0.008, longitude=long + 0.01),
            quantity=quantity * 1.2
        ),
    ]
    
    total_quantity = sum(ul.quantity for ul in user_locations)
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("Evaluating bulk buy...", total=None)
        
        agent = BulkApprovalAgent()
        result = agent.evaluate(BulkApprovalInput(
            item_name=item,
            total_quantity_requested=total_quantity,
            user_locations=user_locations,
            retail_price=prices.retail_price,
            bulk_price=prices.bulk_price,
            bulk_minimum=prices.bulk_minimum
        ))
    
    # Display results
    status_color = "green" if result.approved else "red"
    status_text = "APPROVED" if result.approved else "NOT APPROVED"
    
    console.print(Panel(
        f"[bold {status_color}]{status_text}[/bold {status_color}]\n"
        f"Confidence: {result.confidence}%",
        title="Decision",
        border_style=status_color
    ))
    console.print()
    
    # Checks table
    table = Table(title="Evaluation Checks")
    table.add_column("Check", style="cyan")
    table.add_column("Result", style="white")
    table.add_column("Status", style="white")
    
    def check_status(passed: bool) -> str:
        return "[green]✓ PASS[/green]" if passed else "[red]✗ FAIL[/red]"
    
    table.add_row(
        "Price Savings",
        f"{result.savings_percent:.1f}% (threshold: 20%)",
        check_status(result.price_check_passed)
    )
    table.add_row(
        "Geographic Spread",
        f"{result.geographic_spread_miles:.1f} mi (limit: 5 mi)",
        check_status(result.distance_check_passed)
    )
    table.add_row(
        "Demand Level",
        f"{result.demand_percent:.1f}% (threshold: 60%)",
        check_status(result.demand_check_passed)
    )
    
    console.print(table)
    console.print()
    console.print(f"[dim]Reasoning:[/dim]\n{result.reasoning}")


@app.command("security-check")
def security_check(
    user_lat: float = typer.Option(..., "--user-lat", help="User latitude"),
    user_long: float = typer.Option(..., "--user-long", help="User longitude"),
    trust_score: float = typer.Option(4.5, "--trust-score", "-t", help="Trust score (0-5)"),
    drop_lat: float = typer.Option(41.8215, "--drop-lat", help="Drop zone latitude"),
    drop_long: float = typer.Option(-71.4190, "--drop-long", help="Drop zone longitude"),
):
    """
    Test Agent 3: Security Check
    
    Verify user location and trust score.
    """
    print_header()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("Running security check...", total=None)
        
        agent = SecurityAgent()
        result = agent.check(SecurityCheckInput(
            user_id="cli-test-user",
            user_location=Location(latitude=user_lat, longitude=user_long),
            drop_zone=Location(latitude=drop_lat, longitude=drop_long),
            trust_score=trust_score
        ))
    
    # Display results
    risk_colors = {"low": "green", "medium": "yellow", "high": "red"}
    risk_color = risk_colors.get(result.risk_level, "white")
    
    status_color = "green" if result.approved else "red"
    status_text = "APPROVED" if result.approved else "NOT APPROVED"
    
    console.print(Panel(
        f"[bold {status_color}]{status_text}[/bold {status_color}]\n"
        f"Risk Level: [{risk_color}]{result.risk_level.upper()}[/{risk_color}]\n"
        f"Distance to Drop Zone: {result.distance_to_drop_zone:.2f} miles",
        title="Security Check Result",
        border_style=status_color
    ))
    console.print()
    
    # Reasons
    console.print("[bold]Findings:[/bold]")
    for reason in result.reasons:
        console.print(f"  • {reason}")
    
    if result.recommended_actions:
        console.print()
        console.print("[bold yellow]Recommended Actions:[/bold yellow]")
        for action in result.recommended_actions:
            console.print(f"  ⚠ {action}")


@app.command("demo-flow")
def demo_flow(
    item: str = typer.Option("jasmine rice", "--item", "-i", help="Item for demo"),
    num_users: int = typer.Option(5, "--users", "-u", help="Number of users"),
):
    """
    Run the complete demo flow from the PRD.
    
    Simulates the bulk rice purchase example:
    - 50 lbs bulk at $1/lb
    - Multiple neighbors
    - Compare vs $1.50 retail
    """
    print_header()
    console.print("[bold]Running Demo Flow...[/bold]\n")
    
    # Generate mock user locations
    base_lat, base_long = 41.8236, -71.4222
    quantities = [10, 8, 12, 7, 8][:num_users]
    
    user_locations = []
    for i, qty in enumerate(quantities):
        offset = (i - 2) * 0.01
        user_locations.append(UserLocation(
            user_id=f"neighbor-{i+1}",
            location=Location(
                latitude=base_lat + offset,
                longitude=base_long + (offset * 0.5),
                address=f"{100 + i * 10} Demo St, Providence, RI"
            ),
            quantity=qty
        ))
    
    total_quantity = sum(quantities)
    
    console.print(f"[cyan]Item:[/cyan] {item}")
    console.print(f"[cyan]Users:[/cyan] {num_users}")
    console.print(f"[cyan]Total Quantity:[/cyan] {total_quantity} units")
    console.print()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Running full evaluation...", total=4)
        
        orchestrator = Orchestrator()
        
        progress.update(task, advance=1, description="Getting prices...")
        progress.update(task, advance=1, description="Evaluating bulk approval...")
        progress.update(task, advance=1, description="Running security checks...")
        
        result = orchestrator.evaluate(EvaluateBulkBuyInput(
            item_name=item,
            user_locations=user_locations
        ))
        
        progress.update(task, advance=1, description="Complete!")
    
    console.print()
    
    # Overall result
    status_color = "green" if result.approved else "red"
    status_text = "APPROVED" if result.approved else "NOT APPROVED"
    
    console.print(Panel(
        f"[bold {status_color}]{status_text}[/bold {status_color}]\n"
        f"Confidence: {result.confidence}%",
        title="Overall Decision",
        border_style=status_color
    ))
    console.print()
    
    # Price comparison
    pc = result.price_comparison
    console.print("[bold]Price Comparison:[/bold]")
    console.print(f"  Retail: ${pc.retail_price:.2f}/{pc.unit} at {pc.retail_source.store_name}")
    console.print(f"  Bulk: ${pc.bulk_price:.2f}/{pc.unit} at {pc.bulk_source.store_name}")
    console.print(f"  [green]Savings: {pc.savings_percent:.1f}%[/green]")
    console.print()
    
    # User cost breakdown
    table = Table(title="User Cost Breakdown")
    table.add_column("User", style="cyan")
    table.add_column("Quantity", style="white")
    table.add_column("Min Cost", style="green")
    table.add_column("Max Cost", style="yellow")
    
    for user_loc in user_locations:
        uid = user_loc.user_id
        table.add_row(
            uid,
            f"{user_loc.quantity} {pc.unit}",
            f"${result.min_price_per_user[uid]:.2f}",
            f"${result.max_price_per_user[uid]:.2f}"
        )
    
    console.print(table)
    console.print()
    
    # Reasoning
    console.print("[bold]Analysis:[/bold]")
    console.print(result.reasoning)


@app.command("search")
def search_items(
    query: str = typer.Option(..., "--query", "-q", help="Search query"),
    limit: int = typer.Option(5, "--limit", "-l", help="Max results"),
):
    """
    Search for items in the price database.
    """
    print_header()
    
    agent = PriceComparisonAgent()
    results = agent.search(query, limit)
    
    if not results:
        console.print(f"[yellow]No items found matching '{query}'[/yellow]")
        return
    
    table = Table(title=f"Search Results for '{query}'")
    table.add_column("Item", style="cyan")
    table.add_column("Retail", style="white")
    table.add_column("Bulk", style="white")
    table.add_column("Savings", style="green")
    
    for item in results:
        table.add_row(
            item.item_name,
            f"${item.retail_price:.2f}/{item.unit}",
            f"${item.bulk_price:.2f}/{item.unit}",
            f"{item.savings_percent:.1f}%"
        )
    
    console.print(table)


def main():
    """Entry point for the CLI."""
    app()


if __name__ == "__main__":
    main()

