"""
Agent 3: Security Agent

Performs security and location verification checks on users.

Input: user_id, user_location, drop_zone, trust_score
Output: approval status, risk level, reasons, recommended actions

This agent verifies:
1. User is within reasonable distance of the drop zone
2. User has acceptable trust score
3. No anomalies detected
"""

import json
from typing import Optional

from config.settings import settings
from models.schemas import (
    SecurityCheckInput,
    SecurityCheckOutput,
    Location,
)
from tools.location_tools import calculate_distance


class SecurityAgent:
    """
    Agent responsible for security and location verification.
    
    Protects the community by:
    - Verifying user locations are legitimate
    - Checking trust scores
    - Flagging potential fraud or abuse
    """
    
    # Trust score thresholds
    HIGH_TRUST_THRESHOLD = 4.5
    MEDIUM_TRUST_THRESHOLD = 3.5
    LOW_TRUST_THRESHOLD = 2.0
    
    # Distance thresholds (miles)
    OPTIMAL_DISTANCE = 3.0
    ACCEPTABLE_DISTANCE = 7.0
    MAX_DISTANCE = 15.0
    
    def __init__(self, use_bedrock: bool = None):
        """
        Initialize the Security Agent.
        
        Args:
            use_bedrock: Whether to use Bedrock for enhanced analysis.
                        If None, uses settings.mock_mode to decide.
        """
        self.use_bedrock = not settings.mock_mode if use_bedrock is None else use_bedrock
        
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
            print("Falling back to mock mode")
            self.use_bedrock = False
    
    def check(self, input_data: SecurityCheckInput) -> SecurityCheckOutput:
        """
        Perform security check on a user.
        
        Args:
            input_data: SecurityCheckInput with user details
            
        Returns:
            SecurityCheckOutput with verification results
        """
        if self.use_bedrock:
            return self._check_with_bedrock(input_data)
        else:
            return self._check_with_rules(input_data)
    
    def _check_with_rules(self, input_data: SecurityCheckInput) -> SecurityCheckOutput:
        """
        Rule-based security check for mock mode.
        """
        reasons = []
        recommended_actions = []
        risk_score = 0
        
        # 1. Calculate distance to drop zone
        distance = calculate_distance(input_data.user_location, input_data.drop_zone)
        
        # 2. Evaluate distance
        if distance <= self.OPTIMAL_DISTANCE:
            reasons.append(f"User is within optimal pickup range ({distance:.1f} miles)")
        elif distance <= self.ACCEPTABLE_DISTANCE:
            reasons.append(f"User is at moderate distance from drop zone ({distance:.1f} miles)")
            risk_score += 1
        elif distance <= self.MAX_DISTANCE:
            reasons.append(f"User is far from drop zone ({distance:.1f} miles) - verify address")
            risk_score += 2
            recommended_actions.append("Verify delivery address matches profile")
        else:
            reasons.append(f"User is very far from drop zone ({distance:.1f} miles) - possible address mismatch")
            risk_score += 3
            recommended_actions.append("Require address verification")
            recommended_actions.append("Consider separate delivery arrangement")
        
        # 3. Evaluate trust score
        trust_score = input_data.trust_score
        
        if trust_score >= self.HIGH_TRUST_THRESHOLD:
            reasons.append(f"High trust score ({trust_score:.1f}/5.0) - trusted community member")
        elif trust_score >= self.MEDIUM_TRUST_THRESHOLD:
            reasons.append(f"Moderate trust score ({trust_score:.1f}/5.0)")
            risk_score += 1
        elif trust_score >= self.LOW_TRUST_THRESHOLD:
            reasons.append(f"Low trust score ({trust_score:.1f}/5.0) - additional verification recommended")
            risk_score += 2
            recommended_actions.append("Request ID verification")
        else:
            reasons.append(f"Very low trust score ({trust_score:.1f}/5.0) - high risk")
            risk_score += 3
            recommended_actions.append("Require ID verification before participation")
            recommended_actions.append("Consider cash-on-delivery only")
        
        # 4. Determine risk level
        if risk_score <= 1:
            risk_level = "low"
        elif risk_score <= 3:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        # 5. Make approval decision
        approved = risk_level != "high"
        
        if not approved:
            recommended_actions.append("Manual review required before proceeding")
        
        return SecurityCheckOutput(
            approved=approved,
            risk_level=risk_level,
            reasons=reasons,
            recommended_actions=recommended_actions,
            distance_to_drop_zone=round(distance, 2)
        )
    
    def _check_with_bedrock(self, input_data: SecurityCheckInput) -> SecurityCheckOutput:
        """
        LLM-enhanced security check using Amazon Bedrock.
        
        Uses the LLM to provide additional context and detect
        patterns that rule-based systems might miss.
        """
        # First run rule-based check
        rules_result = self._check_with_rules(input_data)
        
        # Build prompt for enhanced analysis
        prompt = self._build_security_prompt(input_data, rules_result)
        
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 300,
                        "temperature": 0.2,
                    }
                })
            )
            
            response_body = json.loads(response["body"].read())
            llm_analysis = response_body.get("results", [{}])[0].get("outputText", "")
            
            # Parse LLM suggestions and add to recommendations
            if llm_analysis and "recommend" in llm_analysis.lower():
                rules_result.recommended_actions.append(
                    f"AI Insight: {llm_analysis[:200]}"
                )
            
        except Exception as e:
            print(f"Bedrock security analysis failed: {e}")
        
        return rules_result
    
    def _build_security_prompt(
        self,
        input_data: SecurityCheckInput,
        rules_result: SecurityCheckOutput
    ) -> str:
        """Build prompt for Bedrock security analysis."""
        return f"""You are a security analyst for a community bulk buying app.

Review this user verification and identify any additional concerns:

User ID: {input_data.user_id}
Trust Score: {input_data.trust_score}/5.0
Distance to Drop Zone: {rules_result.distance_to_drop_zone} miles
Current Risk Level: {rules_result.risk_level}

Rule-based findings:
{chr(10).join('- ' + r for r in rules_result.reasons)}

Are there any additional security considerations? If so, provide ONE brief recommendation.
If everything looks fine, respond with "No additional concerns."
"""
    
    def batch_check(
        self,
        users: list[SecurityCheckInput]
    ) -> tuple[list[SecurityCheckOutput], bool]:
        """
        Check multiple users and return whether all pass.
        
        Args:
            users: List of SecurityCheckInput for each user
            
        Returns:
            Tuple of (list of results, all_approved boolean)
        """
        results = [self.check(user) for user in users]
        all_approved = all(r.approved for r in results)
        
        return results, all_approved
    
    def calculate_group_risk(
        self,
        results: list[SecurityCheckOutput]
    ) -> dict:
        """
        Calculate aggregate risk for a group of users.
        
        Args:
            results: List of security check results
            
        Returns:
            Dictionary with group risk analysis
        """
        if not results:
            return {"overall_risk": "unknown", "approved_count": 0, "total": 0}
        
        risk_counts = {"low": 0, "medium": 0, "high": 0}
        for r in results:
            risk_counts[r.risk_level] += 1
        
        approved_count = sum(1 for r in results if r.approved)
        
        # Determine overall group risk
        if risk_counts["high"] > 0:
            overall_risk = "high"
        elif risk_counts["medium"] > len(results) * 0.3:
            overall_risk = "medium"
        else:
            overall_risk = "low"
        
        return {
            "overall_risk": overall_risk,
            "approved_count": approved_count,
            "total": len(results),
            "approval_rate": round(approved_count / len(results) * 100, 1),
            "risk_breakdown": risk_counts
        }


# Convenience function for direct tool usage
def check_user_security(
    user_id: str,
    user_lat: float,
    user_long: float,
    drop_lat: float,
    drop_long: float,
    trust_score: float
) -> dict:
    """
    Tool function to check user security.
    
    This is the function that can be registered as a Strands Agent tool.
    """
    agent = SecurityAgent(use_bedrock=False)
    
    input_data = SecurityCheckInput(
        user_id=user_id,
        user_location=Location(latitude=user_lat, longitude=user_long),
        drop_zone=Location(latitude=drop_lat, longitude=drop_long),
        trust_score=trust_score
    )
    
    result = agent.check(input_data)
    return result.model_dump()

