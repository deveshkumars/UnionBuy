<p align="center">
  <img src="reactnativeapp/assets/images/logo.png" alt="UnionBuy Logo" width="120" />
</p>

<h1 align="center">UnionBuy</h1>

<p align="center">
  <strong>Community-powered bulk buying that makes groceries affordable for everyone</strong>
</p>

<p align="center">
  <a href="#inspiration">Inspiration</a> •
  <a href="#what-it-does">What It Does</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## 🌟 Inspiration

In the U.S., everyday grocery prices are rising and affordability is a growing pain point. Studies show that **buying in bulk could cut costs by about 27% on average** compared to buying smaller quantities, saving households hundreds of dollars a year if they could unlock wholesale pricing at scale.

But here's the problem: not everyone can afford to buy a 50-pound bag of rice, even if it would save them money in the long run. That's where **UnionBuy** comes in.

## 💡 What It Does

**UnionBuy** makes groceries more affordable by making bulk products available as individually sold products for those unable to afford the entire bulk package.

By pooling demand from neighbors in your area, we unlock wholesale pricing that individual shoppers could never access alone. Our AI agents handle the complexity of:
- Finding the best bulk deals
- Verifying that bulk buying actually saves money
- Clustering nearby users for efficient distribution
- Coordinating runners to purchase and distribute items

## ✨ Features

### For Customers
- **📦 Browse & Pledge** — Search for items, see real-time bulk vs retail price comparisons, and pledge to join bulk orders
- **💰 Transparent Pricing** — AI agents calculate effective unit prices including all costs
- **🗺️ Smart Clustering** — Automatic grouping of nearby neighbors to minimize delivery logistics
- **💳 Secure Holds** — Pre-authorization holds protect against flaking while ensuring fair pricing
- **📊 Savings Dashboard** — Track your savings and see community impact

### For Runners
- **🎯 Mission Board** — Accept delivery missions with clear earnings estimates
- **✅ Smart Checklists** — AI-verified shopping lists with quantity tracking
- **📍 Optimized Routes** — AWS Location Services for efficient multi-stop delivery
- **📷 Proof System** — Receipt scanning and delivery verification

### AI-Powered Backend
- **Bulk Approval Agent** — Determines if bulk buying is financially viable
- **Price Comparison Agent** — Finds and compares retail vs wholesale prices
- **Security Agent** — Verifies user locations and trust scores

## 🛠️ Tech Stack

### Mobile App
| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile app |
| **Expo** | Development framework & tooling |
| **AWS Amplify** | Authentication, database, and cloud integration |
| **TypeScript** | Type-safe development |

### AI & Backend
| Technology | Purpose |
|------------|---------|
| **AWS Bedrock** | Foundation models for agentic AI |
| **Strands Agent SDK** | Agent orchestration and tool calling |
| **FastAPI** | Local development server |
| **AWS Lambda** | Serverless production deployment |
| **Python** | Agent logic and data processing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **AWS DynamoDB** | User data and pledge storage |
| **AWS Location Services** | Geospatial routing and mapping |
| **AWS Cognito** | User authentication |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Native App                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Customer│  │ Runner  │  │ Wallet  │  │ Account │            │
│  │  View   │  │  View   │  │  View   │  │  View   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Amplify Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Cognito    │  │   DynamoDB   │  │   Location   │          │
│  │    Auth      │  │   Database   │  │   Services   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AgentCore (AI Layer)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Orchestrator                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│        │                    │                    │              │
│        ▼                    ▼                    ▼              │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│  │  Bulk    │        │  Price   │        │ Security │          │
│  │ Approval │        │Comparison│        │  Agent   │          │
│  │  Agent   │        │  Agent   │        │          │          │
│  └──────────┘        └──────────┘        └──────────┘          │
│        │                    │                    │              │
│        ▼                    ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AWS Bedrock (Foundation Models)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- AWS Account with Bedrock access
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/unionbuy.git
cd unionbuy
```

### 2. Start the AWS Amplify Sandbox
From the **main project directory**, run:
```bash
npm install
npx ampx sandbox --outputs-out-dir ./reactnativeapp
```
This starts the Amplify sandbox and outputs the configuration to the React Native app. Keep this running in a separate terminal.

See `reactnativeapp/docs/` for detailed Amplify setup instructions.

### 3. Set Up the Mobile App
In a new terminal:
```bash
cd reactnativeapp
npm install
npx expo start
```

### 4. Set Up the Agent Backend
In another terminal:
```bash
cd agentcore
pip install -r requirements.txt

# For local development (no AWS credentials needed)
export MOCK_MODE=true

# Start the server
python -m server.main
```

The API server runs at `http://localhost:8000`. Visit `/docs` for Swagger UI.

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| **Home / Browse** | Live trading floor-style view of bulk opportunities |
| **Item Details** | Price comparison, savings breakdown, and pledge action |
| **Operations** | Track active pledges and order status |
| **Wallet** | View realized savings and transaction history |
| **Runner Dashboard** | Accept missions and manage deliveries |
| **Mission HUD** | Navigation, checklist, and delivery verification |

## 🤖 AI Agents

### Bulk Approval Agent
Determines if a bulk buy makes financial and logistical sense.

**Checks:**
- Price savings ≥ 20% compared to retail
- Users within 5-mile radius
- Demand meets 60% of bulk minimum

### Price Comparison Agent
Finds and compares retail vs wholesale prices for items.

**Output:**
- Retail price and source
- Bulk price and source  
- Minimum quantity for bulk pricing

### Security Agent
Verifies user locations and trust scores for fraud prevention.

## 🏆 Challenges We Ran Into

With all the different sources of data available (all in different formats), we faced the challenge of figuring out how to effectively funnel all this data into one cohesive result. For example, when determining retail prices, we had to reconcile options from many different stores like Whole Foods, Erewhon, Costco, and local grocers.

## 🎉 Accomplishments We're Proud Of

Being able to put everything together—product listings, bulk thresholds, pricing, route mapping—in such a short amount of time. Our communication as a team really helped when it came to assembling so many moving parts and ensuring that the agent outputs, product listings, and route mapping worked end to end.

## 📚 What We Learned

**The less hard coding, the fewer problems down the line.** Instead of hard-coding regex patterns and scraping to extract information, we used agents to semantically extract product information. This made our system more robust and adaptable to different data sources.

## 🔮 What's Next for UnionBuy

- **Real Payments** — Integration with payment processors for actual transactions
- **VLM Receipt Scanning** — Vision language models for in-store price verification
- **Runner Verification** — Background checks and trust scores for delivery runners
- **Expanded Coverage** — Support for more stores and geographic regions
- **Smart Recommendations** — AI-powered suggestions based on neighborhood buying patterns

---

<p align="center">
  Built with ❤️ at HackBrown '26
</p>

