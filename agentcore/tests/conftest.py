"""
Pytest configuration and fixtures for the test suite.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest


@pytest.fixture(autouse=True)
def set_mock_mode(monkeypatch):
    """Ensure tests run in mock mode."""
    monkeypatch.setenv("MOCK_MODE", "true")


@pytest.fixture
def sample_location():
    """Sample location in Providence, RI."""
    from models.schemas import Location
    return Location(latitude=41.8236, longitude=-71.4222, address="Providence, RI")


@pytest.fixture
def sample_drop_zone():
    """Sample drop zone location."""
    from models.schemas import Location
    return Location(
        latitude=41.8215,
        longitude=-71.4190,
        address="Providence Community Center"
    )

