"""
Configuration settings for the Bulk Buy Agents.
Loads from environment variables with sensible defaults.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # AWS Configuration
    aws_access_key_id: str = Field(default="", alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field(default="", alias="AWS_SECRET_ACCESS_KEY")
    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    
    # Bedrock Configuration
    mock_mode: bool = Field(default=True, alias="MOCK_MODE")
    bedrock_model_id: str = Field(
        default="amazon.titan-text-premier-v1:0",
        alias="BEDROCK_MODEL_ID"
    )
    
    # Bulk Buy Thresholds
    savings_threshold: float = Field(default=0.20, alias="SAVINGS_THRESHOLD")
    max_distance_miles: float = Field(default=5.0, alias="MAX_DISTANCE_MILES")
    min_demand_percent: float = Field(default=0.60, alias="MIN_DEMAND_PERCENT")
    
    # Server Configuration
    server_host: str = Field(default="0.0.0.0", alias="SERVER_HOST")
    server_port: int = Field(default=8000, alias="SERVER_PORT")
    debug: bool = Field(default=True, alias="DEBUG")
    
    # Paths
    @property
    def base_dir(self) -> Path:
        return Path(__file__).parent.parent
    
    @property
    def data_dir(self) -> Path:
        return self.base_dir / "data"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Global settings instance
settings = Settings()

