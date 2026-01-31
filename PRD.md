Award Tracks: 
AWS: AI agent tools + hosting + security features
Marshall Wace: we’re using agents and AI
Monitor prices across platforms
Should cover Visa, Capital One, Metropolis, 
Funds into block fund or single-use card
Does not use credit or overspending
Urban design theme

Extra: 
Capital One: ?
Vultr: Recommendation/rank algorithms (homestretch)
Solana: Maybe? Probably not 
Tasks
Step 1
React-native app initialization (All)
	
Step 2: Create UI, create AWS bedrock infra, create backend
Creating UI outline (Aaron)
AWS bedrock infra
Backend: firebase
Step 3
Integrate prompts for Agents 1-2
Start figuring out AWS location thing
Integrate backend for auth and storing item lists  (Nathan) 
		- 
Outline
Sourcing (total cost):
Not just look for cheapest on shelf, but the total cost
Unit price * quantity + distance*gas + time*wage of runner
Scrape all the necessary information at different stores
Calculate and get the best result

Distribution:
Where will the runner drop off the goods?
Average location of all buyers, weighted centroid
Some weighted coordinate average of everyone’s purchase (make sure that it is some place easily accessible for everyone)

Driver selection:
Assign an agent to auction the job
Look at who is near the store, who is near the “center”

Location stack:
Tracking runner in real time
Aws location service, react native aws amplify geo sdk
Routing the driver (order of stores, etc)
Aws location server route, matrix API and optimizer
Displaying movement:
Amazon location service and maplibre GL
react map gl, aws appsync, graphql, etc
Flow of transaction once a person enters: 
Financial Logic for ordering:
Instead of pay up front, use pre-authorization (hold)
Step 1: Pledge or intent
User clicks to join an order (say 5 lbs rice)
Agent calculates single and bulk prices
App shows an estimated price range
Min = unit price * quantity, max = non-bulk unit price * quantity
Authorize a temporary hold on their card for the maximum amount. Money hasn't left yet but it’s locked to prevent flaking
Step 2 (let agent #1 handle this logic): 
Say the bulk is 50 pounds for 1$ a pound
Neighbors need 45 total
Cost is 1.11 per pound
Agent checks the local retail price and sees if bulk beats it (say walmart 1.5$)
Agent checks are these people close enough and are there enough people who want the thing
Agent sees wholesale beats, approves 
Step 3 (settlement)
Runner buys the 50 lb bag, calculates the split, captures the transaction at the fair price
Step 4: handling extra
5 pounds extra, distributed as extra evenly
Step 5: handling not enough:
Rollover basket into next day and collect more demand
Move this to the top of the priority tomorrow
Protect from overpaying
Modulo problem: 
Rollover remainder but put them higher priority

Agents:

Agent #1 ([item name, count, lat, long]):
Takes in inputs and returns (step 2 of flow):
Is it actually cheaper to buy in bulk + are these people close enough + are there enough people who want the thing
Give the example from the flow
Returns True or false

Agent #2: Figuring out the prices of buying something in bulk vs not in bulk 
Input: Item Name 
Where do you buy x item in bulk and where do you buy it normally
Output: [normal unit price, if you buy in bulk unit price]

Agent #3: 
Security check, their locations 

Timing:
Hard cutoffs instead of rolling orders
Trigger 1: time-based. The order window closes every day at x time (6 p.m.)
Trigger 2: volume-based. Order executes once we hit 50 units
Workflow:
Neighbors pledge in a certain window (8 am - 6 p.m.)
6 p.m.: agent reads the basket demand, executes, rollover other things for another day/time
6:05: confirm order and for what products, what price

Instacart or other ordering sites (catalog exists)

Ai agents for figuring out which things are best to buy in bulk. Agents can also group products.

AWS security features: 
Attestation
People cannot see what others bought or others location

Split the problem:
Location: clustering algorithm (later)
What should be bought and who all wants to buy: People add an item, Geolocation, count to the app (recommendations for similar area)
Drop zone
Location and time frame (maybe stagger times to avoid congestion/mishandling)
Reliability score (wrong item/quantity or late, best get discounts)
Where to buy it/what platform (Devesh): 
How to actually buy it:
Figuring out how much it costs and the default amount:
Critical mass (how much minimum per bulk order) 
When is 
Some visual features - orders in your area, savings possible, etc
Location servers 


Tech Stack

Frontend: React Native Mobile

Input Layer: Search, text processed by Gemini agent

Logic: DBSCAN or geofence clustering (python), optimizing with python maximize savings - cost (gas/time)

Financials: database tracking credits, card generations/pooled credit

Infrastructure: Vultr for computation, AWS for host, auth, location, AI


Metropolis Theme

Frontend design: smart city command center, high-tech infra

Design philosophy: logistics hud instead of shopping app
Bounding boxes, monospace fonts, high contrast, data overlay, scanning
Color palette: dark mode mandatory
Deep slate background
Electric cyan for safe or confirmed
Orange for safety, pending, or traffic
White for headers, gray for labels
UI components:
Use bounding boxes instead of rounded corners and drop shadows
Put rectangular border when listing items
Small metadata labels near border, confidence (AI agent has scanned and verified this product)
Lidar map style
Customize map style json
Matrix mode, roads dark gray, buildings lighter grey wireframes, route lines neon
Animations: instead of pins, maybe pulsing radar
Scanning for finding neighbors
Typography (terminal aesthetic)
Headers using sans-serif (inter or roboto)
Data points with monospace font for numbers, prices, times
Metropolis feel:
Tech border with subtle border, glassmorphism,, clip path or linear gradients
Glitch text effect, flickering 
UI Screens (Customer View):
Instead of static list, make it look like live trading floor
Tickers for top (trending items with most discounts, how many joined)
Item cards
Show progress bar for the products, how much pledged/needed, online price range, add (with quantity) to cart
Use a dark background 
Search for items/remove
Separate section to see rollover zone, be able to remove these
This temporary item cart has an option to initialize a pledge (lock funds)
This goes to live operations, locked funds
Show each time and how much pledged
Cancel only if bulk not met
Once agent executes the buy, grey out everything
Agentic modal (Show them how the savings happen)
Compute estimated prices
Comparison graph
Retail vs bulk buy with all costs considered
Confidence score in the corner
Visual verification:
Received the order or request an item
Camera with scanner overlay
Possible VLM for in-store cost recomputation
Mission control
Map with matrix style
Users, runner, route
Overlay for distribution with stats on like gas saved, cost
Proof screen for drop off
timestamp and watermark
Proof of pickup
Runner taps start distribution, people arrive, QR code to scan and item/quantity
Wallet: active pledge vs realized transaction, community trust score, discounts, etc
Account page (payment info, location, preferences, etc) (also for changing between customer and runner accounts)
Morning after: screen for day after, what was a success or fail potentially

UI Screens (Customer View):
Flip switches and change the UI
Job board: start screen
Visual: big card and high contrast
Data:
Costco run
Estimated earnings (base and tips)
Cargo (to determine transport)
Action: accept/reject mission
Mission hud: navigation and status
Main screen when driving
Map (aws) for route
Metropolis overlay
State indicator (step in progress, store, shopping, to drop, distribution)
Action: button based on state (arrived at store)
Pick and pay:
Arriving at the store, checklist appears
Checklist:
Contains items and quantity
Mission card: virtual card, payment code, specific limits
Verification: scan receipt (optional)
Drop-off scanner (distribution)
Camera viewfinder (qr scanner)
List of neighbors coming to meet and what items/quantity
Arrival/action:
Scan the code
Confirm and say what to give
Time automatically crossed off

Demo: 

simulate a bulk order, see how the agent decides the purchase/route, calculate savings

Talk about the problem, how we came up with the solution

Scene 1: Consumer View
Search for rice
Show retail price
Join bulk buy
Update to pledge locked, waiting for x more orders
Narrate something about this purchase

Scene 2: Simulation dashboard
Web dashboard
Map of the neighborhood
Action:
Simulate everyone buying, orders filling
Narrate the behind the scenes and logic

Scene 3: Logistics (Runner)
Notification for pop-up
Accept
Transition to the route line
(optional: scanning receipt and verifying payment/savings)

Scene 4: payoff
Mobile app
Push notifications
Pledge turns into realized receipt
Show final price and savings
Narrate the execution and savings

Questions: keep to 30 seconds per response
Lists of Concerns and Future Features
Real payments
Maximum spending limit
Time optimizations
Attestation
Stock images of base items on a new catalog home screen (if we can collect into backend)
VLMs for in-store prices (take picture of receipt)
Some background check/verification for runners
