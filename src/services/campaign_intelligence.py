"""
ADVANCED CAMPAIGN INTELLIGENCE PLATFORM
AI-powered campaign optimization and predictive analytics
"""

import json
import math
import statistics
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Optional
import random

class AdvancedCampaignIntelligence:
    def __init__(self):
        # Statistical significance thresholds
        self.significance_threshold = 0.05  # 95% confidence
        self.min_sample_size = 30
        
        # Performance prediction models
        self.performance_weights = {
            'historical_ctr': 0.30,
            'audience_quality': 0.25,
            'content_optimization': 0.20,
            'timing_optimization': 0.15,
            'channel_effectiveness': 0.10
        }
        
        # Audience segmentation criteria
        self.segmentation_factors = [
            'device_type', 'country', 'referrer_category', 
            'time_of_day', 'day_of_week', 'browser'
        ]

    def analyze_campaign_performance(self, campaign_data: Dict) -> Dict:
        """Comprehensive campaign performance analysis"""
        analysis = {
            'performance_score': 0.0,
            'optimization_opportunities': [],
            'audience_insights': {},
            'predictive_metrics': {},
            'ab_test_recommendations': [],
            'risk_assessment': {}
        }
        
        # Calculate performance score
        analysis['performance_score'] = self._calculate_performance_score(campaign_data)
        
        # Identify optimization opportunities
        analysis['optimization_opportunities'] = self._identify_optimization_opportunities(campaign_data)
        
        # Generate audience insights
        analysis['audience_insights'] = self._generate_audience_insights(campaign_data)
        
        # Predictive analytics
        analysis['predictive_metrics'] = self._predict_campaign_performance(campaign_data)
        
        # A/B testing recommendations
        analysis['ab_test_recommendations'] = self._recommend_ab_tests(campaign_data)
        
        # Risk assessment
        analysis['risk_assessment'] = self._assess_campaign_risks(campaign_data)
        
        return analysis

    def _calculate_performance_score(self, campaign_data: Dict) -> float:
        """Calculate comprehensive performance score (0-100)"""
        metrics = campaign_data.get('metrics', {})
        
        # Base metrics
        clicks = metrics.get('clicks', 0)
        conversions = metrics.get('conversions', 0)
        unique_visitors = metrics.get('unique_visitors', 0)
        
        if clicks == 0:
            return 0.0
        
        # Calculate individual scores
        ctr_score = min((clicks / max(metrics.get('impressions', clicks), 1)) * 1000, 100)
        conversion_score = (conversions / clicks) * 100 if clicks > 0 else 0
        engagement_score = min((unique_visitors / clicks) * 100, 100) if clicks > 0 else 0
        
        # Weighted performance score
        performance_score = (
            ctr_score * 0.4 +
            conversion_score * 0.4 +
            engagement_score * 0.2
        )
        
        return min(performance_score, 100.0)

    def _identify_optimization_opportunities(self, campaign_data: Dict) -> List[Dict]:
        """Identify specific optimization opportunities"""
        opportunities = []
        metrics = campaign_data.get('metrics', {})
        events = campaign_data.get('events', [])
        
        # Low conversion rate opportunity
        clicks = metrics.get('clicks', 0)
        conversions = metrics.get('conversions', 0)
        if clicks > 50 and (conversions / clicks if clicks > 0 else 0) < 0.02:
            opportunities.append({
                'type': 'conversion_optimization',
                'priority': 'high',
                'description': 'Conversion rate below 2% - optimize landing page and targeting',
                'potential_impact': 'high',
                'recommended_actions': [
                    'A/B test landing page design',
                    'Improve call-to-action placement',
                    'Refine audience targeting'
                ]
            })
        
        # Device optimization
        device_performance = self._analyze_device_performance(events)
        worst_device = min(device_performance.items(), key=lambda x: x[1]['conversion_rate']) if device_performance else None
        if worst_device and worst_device[1]['conversion_rate'] < 0.01:
            opportunities.append({
                'type': 'device_optimization',
                'priority': 'medium',
                'description': f'{worst_device[0]} performance significantly below average',
                'potential_impact': 'medium',
                'recommended_actions': [
                    f'Optimize for {worst_device[0]} users',
                    'Create device-specific landing pages',
                    'Adjust bidding by device type'
                ]
            })
        
        # Geographic optimization
        geo_performance = self._analyze_geographic_performance(events)
        if geo_performance:
            top_countries = sorted(geo_performance.items(), key=lambda x: x[1]['conversion_rate'], reverse=True)[:3]
            if len(top_countries) > 0 and top_countries[0][1]['conversion_rate'] > 0.05:
                opportunities.append({
                    'type': 'geographic_expansion',
                    'priority': 'medium',
                    'description': f'High-performing countries identified: {", ".join([c[0] for c in top_countries])}',
                    'potential_impact': 'high',
                    'recommended_actions': [
                        'Increase budget allocation to top-performing countries',
                        'Create country-specific campaigns',
                        'Localize content for top markets'
                    ]
                })
        
        # Timing optimization
        time_performance = self._analyze_time_performance(events)
        if time_performance:
            best_hours = [hour for hour, data in time_performance.items() if data['conversion_rate'] > 0.03]
            if best_hours:
                opportunities.append({
                    'type': 'timing_optimization',
                    'priority': 'medium',
                    'description': f'Peak performance hours identified: {best_hours}',
                    'potential_impact': 'medium',
                    'recommended_actions': [
                        'Increase bid adjustments during peak hours',
                        'Schedule campaigns for optimal times',
                        'Create time-specific ad content'
                    ]
                })
        
        return opportunities

    def _generate_audience_insights(self, campaign_data: Dict) -> Dict:
        """Generate detailed audience insights"""
        events = campaign_data.get('events', [])
        
        insights = {
            'audience_segments': {},
            'behavioral_patterns': {},
            'demographic_analysis': {},
            'engagement_patterns': {}
        }
        
        # Audience segmentation
        for factor in self.segmentation_factors:
            segment_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0, 'unique_visitors': set()})
            
            for event in events:
                value = event.get(factor, 'unknown')
                segment_data[value]['clicks'] += 1
                if event.get('captured_email'):
                    segment_data[value]['conversions'] += 1
                if event.get('ip_address'):
                    segment_data[value]['unique_visitors'].add(event['ip_address'])
            
            # Calculate segment performance
            segments = {}
            for value, data in segment_data.items():
                if data['clicks'] > 0:
                    segments[value] = {
                        'clicks': data['clicks'],
                        'conversions': data['conversions'],
                        'unique_visitors': len(data['unique_visitors']),
                        'conversion_rate': data['conversions'] / data['clicks'],
                        'engagement_rate': len(data['unique_visitors']) / data['clicks']
                    }
            
            insights['audience_segments'][factor] = segments
        
        # Behavioral patterns
        insights['behavioral_patterns'] = self._analyze_behavioral_patterns(events)
        
        # Demographic analysis
        insights['demographic_analysis'] = self._analyze_demographics(events)
        
        # Engagement patterns
        insights['engagement_patterns'] = self._analyze_engagement_patterns(events)
        
        return insights

    def _predict_campaign_performance(self, campaign_data: Dict) -> Dict:
        """Predict future campaign performance"""
        metrics = campaign_data.get('metrics', {})
        events = campaign_data.get('events', [])
        
        predictions = {
            'next_7_days': {},
            'next_30_days': {},
            'confidence_intervals': {},
            'trend_analysis': {}
        }
        
        # Historical trend analysis
        daily_performance = self._calculate_daily_performance(events)
        
        if len(daily_performance) >= 7:
            # Calculate trends
            recent_days = list(daily_performance.values())[-7:]
            clicks_trend = self._calculate_trend([d['clicks'] for d in recent_days])
            conversion_trend = self._calculate_trend([d['conversions'] for d in recent_days])
            
            # Predict next 7 days
            avg_daily_clicks = statistics.mean([d['clicks'] for d in recent_days])
            avg_daily_conversions = statistics.mean([d['conversions'] for d in recent_days])
            
            predictions['next_7_days'] = {
                'predicted_clicks': int(avg_daily_clicks * 7 * (1 + clicks_trend)),
                'predicted_conversions': int(avg_daily_conversions * 7 * (1 + conversion_trend)),
                'confidence': self._calculate_prediction_confidence(recent_days)
            }
            
            # Predict next 30 days
            predictions['next_30_days'] = {
                'predicted_clicks': int(avg_daily_clicks * 30 * (1 + clicks_trend)),
                'predicted_conversions': int(avg_daily_conversions * 30 * (1 + conversion_trend)),
                'confidence': self._calculate_prediction_confidence(recent_days)
            }
            
            predictions['trend_analysis'] = {
                'clicks_trend': f"{clicks_trend:.2f}",
                'conversion_trend': f"{conversion_trend:.2f}"
            }
            
        return predictions

    def _calculate_daily_performance(self, events: List[Dict]) -> Dict:
        """Aggregate performance metrics by day"""
        daily_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        for event in events:
            if 'timestamp' in event:
                day = datetime.fromisoformat(event['timestamp']).date().isoformat()
                daily_data[day]['clicks'] += 1
                if event.get('captured_email'):
                    daily_data[day]['conversions'] += 1
                    
        return dict(daily_data)

    def _calculate_trend(self, data: List[int]) -> float:
        """Simple linear trend calculation (slope)"""
        if len(data) < 2:
            return 0.0
        
        x = list(range(len(data)))
        y = data
        
        # Simple linear regression slope
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_x_sq = sum(xi**2 for xi in x)
        
        try:
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x_sq - sum_x**2)
            # Convert slope to a percentage change over the period
            return slope / statistics.mean(y) if statistics.mean(y) != 0 else 0.0
        except ZeroDivisionError:
            return 0.0

    def _calculate_prediction_confidence(self, daily_data: List[Dict]) -> float:
        """Calculate confidence based on data variance"""
        if len(daily_data) < 2:
            return 0.5
        
        clicks = [d['clicks'] for d in daily_data]
        conversions = [d['conversions'] for d in daily_data]
        
        try:
            clicks_variance = statistics.variance(clicks)
            conversions_variance = statistics.variance(conversions)
            
            # Inverse of variance (higher variance = lower confidence)
            # Normalize to a 0-1 range (simplified)
            confidence = 1.0 - min((clicks_variance + conversions_variance) / 1000, 1.0)
            return max(0.1, confidence) # Minimum confidence of 10%
        except statistics.StatisticsError:
            return 0.5

    def _recommend_ab_tests(self, campaign_data: Dict) -> List[Dict]:
        """Recommend A/B tests based on statistical significance"""
        events = campaign_data.get('events', [])
        recommendations = []
        
        # Placeholder for A/B test data (e.g., two versions of a link)
        ab_test_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        # Simulate finding two link versions for A/B test
        link_versions = defaultdict(list)
        for event in events:
            link_versions[event.get('link_id')].append(event)
            
        # Simple A/B test simulation: compare two links with high traffic
        high_traffic_links = sorted(link_versions.items(), key=lambda x: len(x[1]), reverse=True)[:2]
        
        if len(high_traffic_links) == 2 and len(high_traffic_links[0][1]) >= self.min_sample_size and len(high_traffic_links[1][1]) >= self.min_sample_size:
            link_a_id, link_a_events = high_traffic_links[0]
            link_b_id, link_b_events = high_traffic_links[1]
            
            link_a_clicks = len(link_a_events)
            link_a_conversions = sum(1 for e in link_a_events if e.get('captured_email'))
            
            link_b_clicks = len(link_b_events)
            link_b_conversions = sum(1 for e in link_b_events if e.get('captured_email'))
            
            # Perform a simple Z-test for two proportions (conversion rates)
            cr_a = link_a_conversions / link_a_clicks
            cr_b = link_b_conversions / link_b_clicks
            
            # Pooled proportion
            p_pooled = (link_a_conversions + link_b_conversions) / (link_a_clicks + link_b_clicks)
            
            try:
                # Standard error
                se = math.sqrt(p_pooled * (1 - p_pooled) * (1/link_a_clicks + 1/link_b_clicks))
                
                # Z-score
                z_score = (cr_a - cr_b) / se
                
                # For 95% confidence, Z-score > 1.96 is significant
                if abs(z_score) > 1.96:
                    winner = link_a_id if cr_a > cr_b else link_b_id
                    recommendations.append({
                        'type': 'ab_test_result',
                        'description': f'A/B Test between Link {link_a_id} and Link {link_b_id} is statistically significant.',
                        'winner': f'Link {winner}',
                        'confidence': '95%',
                        'action': f'Deactivate the losing link and focus traffic on Link {winner}.'
                    })
                else:
                    recommendations.append({
                        'type': 'ab_test_inconclusive',
                        'description': f'A/B Test between Link {link_a_id} and Link {link_b_id} is inconclusive.',
                        'action': 'Continue running the test or redesign the experiment.'
                    })
            except ZeroDivisionError:
                pass
                
        return recommendations

    def _assess_campaign_risks(self, campaign_data: Dict) -> Dict:
        """Assess security and performance risks"""
        events = campaign_data.get('events', [])
        risk_score = 0
        risk_factors = {}
        
        # Bot traffic risk
        bot_traffic = sum(1 for e in events if e.get('is_bot'))
        total_traffic = len(events)
        bot_percentage = (bot_traffic / total_traffic) * 100 if total_traffic > 0 else 0
        
        if bot_percentage > 10:
            risk_score += 30
            risk_factors['bot_traffic'] = f"High bot traffic detected ({bot_percentage:.1f}%). Implement stronger bot blocking."
        elif bot_percentage > 5:
            risk_score += 15
            risk_factors['bot_traffic'] = f"Moderate bot traffic detected ({bot_percentage:.1f}%). Monitor closely."
        
        # Geographic risk (e.g., high traffic from sanctioned or high-fraud countries)
        geo_counts = Counter(e.get('country') for e in events)
        high_risk_countries = ['North Korea', 'Iran', 'Russia'] # Example
        high_risk_traffic = sum(geo_counts.get(c, 0) for c in high_risk_countries)
        high_risk_percentage = (high_risk_traffic / total_traffic) * 100 if total_traffic > 0 else 0
        
        if high_risk_percentage > 5:
            risk_score += 25
            risk_factors['geo_risk'] = f"Significant traffic from high-risk countries ({high_risk_percentage:.1f}%). Review geo-blocking settings."
            
        # Performance stability risk (high variance)
        daily_performance = self._calculate_daily_performance(events)
        if len(daily_performance) >= 7:
            clicks = [d['clicks'] for d in daily_performance.values()]
            try:
                clicks_cv = statistics.stdev(clicks) / statistics.mean(clicks) if statistics.mean(clicks) != 0 else 0
                if clicks_cv > 0.5:
                    risk_score += 20
                    risk_factors['performance_volatility'] = f"High click volatility detected (CV: {clicks_cv:.2f}). Indicates unstable traffic source."
            except statistics.StatisticsError:
                pass
                
        return {
            'score': min(risk_score, 100),
            'factors': risk_factors,
            'assessment': 'High' if risk_score >= 50 else ('Medium' if risk_score >= 25 else 'Low')
        }

    # Helper methods for audience insights (stubs)
    def _analyze_device_performance(self, events: List[Dict]) -> Dict:
        """Analyze conversion rate by device type"""
        # Implementation required
        return {}

    def _analyze_geographic_performance(self, events: List[Dict]) -> Dict:
        """Analyze conversion rate by country"""
        # Implementation required
        return {}

    def _analyze_time_performance(self, events: List[Dict]) -> Dict:
        """Analyze conversion rate by time of day"""
        # Implementation required
        return {}

    def _analyze_behavioral_patterns(self, events: List[Dict]) -> Dict:
        """Analyze user journey and common drop-off points"""
        # Implementation required
        return {}

    def _analyze_demographics(self, events: List[Dict]) -> Dict:
        """Analyze inferred demographics (e.g., language, time zone)"""
        # Implementation required
        return {}

    def _analyze_engagement_patterns(self, events: List[Dict]) -> Dict:
        """Analyze time on page, scroll depth, etc."""
        # Implementation required
        return {}

# Initialize the intelligence system
campaign_intel = AdvancedCampaignIntelligence()
