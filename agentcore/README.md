# Bulk Buy Agents - Amazon Bedrock Strands SDK

AI-powered agents for the Metropolis Bulk Buy application. These agents evaluate bulk purchasing decisions, compare prices, and perform security checks.

## Quick Start

### 1. Install Dependencies

```bash
cd agentcore
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the environment template and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

For development without AWS credentials, set `MOCK_MODE=true`.

### 3. Run Local Server

```bash
python -m server.main
```

Server runs at `http://localhost:8000`. Visit `/docs` for Swagger UI.

### 4. Test via CLI

```bash
# Test price comparison
python -m cli.test_agents price-compare --item "jasmine rice"

# Test bulk approval
python -m cli.test_agents bulk-approval --item "rice" --quantity 10

# Run demo flow
python -m cli.test_agents demo-flow
```

## Agents

### Agent 1: Bulk Approval Agent
Determines if a bulk buy makes financial and logistical sense.

**Checks:**
- Price savings >= 20% compared to retail
- Users within 5-mile radius
- Demand meets 60% of bulk minimum

### Agent 2: Price Comparison Agent
Finds and compares retail vs wholesale prices for items.

**Output:**
- Retail price and source
- Bulk price and source
- Minimum quantity for bulk pricing

### Agent 3: Security Agent
Verifies user locations and trust scores.

**Checks:**
- User proximity to drop zone
- Trust score thresholds
- Risk assessment

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/evaluate-bulk-buy` | POST | Full orchestration flow |
| `/api/agents/price-comparison` | POST | Price lookup only |
| `/api/agents/bulk-approval` | POST | Bulk approval check |
| `/api/agents/security-check` | POST | Security verification |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_MODE` | `true` | Use mock logic instead of Bedrock |
| `BEDROCK_MODEL_ID` | `amazon.titan-text-premier-v1:0` | Bedrock model ID |
| `SAVINGS_THRESHOLD` | `0.20` | Minimum savings percentage (20%) |
| `MAX_DISTANCE_MILES` | `5.0` | Maximum user spread |
| `MIN_DEMAND_PERCENT` | `0.60` | Minimum demand percentage |

## Project Structure

```
agentcore/
├── agents/           # Agent implementations
├── cli/              # Command-line testing tools
├── config/           # Configuration settings
├── data/             # Mock data for testing
├── handlers/         # Orchestrator and Lambda handlers
├── models/           # Pydantic schemas
├── server/           # FastAPI local server
├── tests/            # Test suite
└── tools/            # Strands @tool functions
```

## Deployment

For AWS Lambda deployment, use the SAM template:

```bash
sam build
sam deploy --guided
```

