import httpx

# Call the orchestrator
response = httpx.post("http://localhost:8000/api/evaluate-bulk-buy", json={
    "item_name": "jasmine rice",
    "user_locations": [
        {"user_id": "user-1", "location": {"latitude": 41.82, "longitude": -71.42}, "quantity": 10}
    ]
})
result = response.json()
print(result)