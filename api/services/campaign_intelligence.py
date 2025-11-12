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
                'confidence': max(0.6, self._calculate_prediction_confidence(recent_days) - 0.2)
            }
            
            predictions['trend_analysis'] = {
                'clicks_trend': 'increasing' if clicks_trend > 0.05 else 'decreasing' if clicks_trend < -0.05 else 'stable',
                'conversion_trend': 'increasing' if conversion_trend > 0.05 else 'decreasing' if conversion_trend < -0.05 else 'stable',
                'trend_strength': abs(clicks_trend) + abs(conversion_trend)
            }
        
        return predictions

    def _recommend_ab_tests(self, campaign_data: Dict) -> List[Dict]:
        """Recommend A/B tests based on performance analysis"""
        recommendations = []
        metrics = campaign_data.get('metrics', {})
        events = campaign_data.get('events', [])
        
        clicks = metrics.get('clicks', 0)
        conversions = metrics.get('conversions', 0)
        
        # Only recommend tests if we have sufficient data
        if clicks < self.min_sample_size:
            return recommendations
        
        conversion_rate = conversions / clicks if clicks > 0 else 0
        
        # Landing page optimization test
        if conversion_rate < 0.03:
            recommendations.append({
                'test_type': 'landing_page_optimization',
                'priority': 'high',
                'description': 'Test different landing page designs to improve conversion rate',
                'variants': [
                    'Current design (Control)',
                    'Simplified design with larger CTA',
                    'Video-based landing page',
                    'Mobile-optimized design'
                ],
                'success_metric': 'conversion_rate',
                'minimum_duration': '14 days',
                'required_sample_size': max(self.min_sample_size * 2, clicks),
                'expected_impact': 'high'
            })
        
        # Call-to-action test
        recommendations.append({
            'test_type': 'call_to_action',
            'priority': 'medium',
            'description': 'Test different call-to-action buttons and messaging',
            'variants': [
                'Get Started Now',
                'Try Free Today',
                'Learn More',
                'Join Now'
            ],
            'success_metric': 'click_through_rate',
            'minimum_duration': '7 days',
            'required_sample_size': self.min_sample_size,
            'expected_impact': 'medium'
        })
        
        # Audience targeting test
        device_performance = self._analyze_device_performance(events)
        if len(device_performance) > 1:
            recommendations.append({
                'test_type': 'audience_targeting',
                'priority': 'medium',
                'description': 'Test device-specific targeting and bidding strategies',
                'variants': [
                    'Equal targeting across devices',
                    'Mobile-focused targeting',
                    'Desktop-focused targeting',
                    'Dynamic device bidding'
                ],
                'success_metric': 'cost_per_conversion',
                'minimum_duration': '10 days',
                'required_sample_size': self.min_sample_size * 3,
                'expected_impact': 'medium'
            })
        
        return recommendations

    def _assess_campaign_risks(self, campaign_data: Dict) -> Dict:
        """Assess campaign risks and provide mitigation strategies"""
        risks = {
            'risk_score': 0.0,
            'risk_factors': [],
            'mitigation_strategies': []
        }
        
        metrics = campaign_data.get('metrics', {})
        events = campaign_data.get('events', [])
        
        clicks = metrics.get('clicks', 0)
        conversions = metrics.get('conversions', 0)
        
        # Low volume risk
        if clicks < 100:
            risks['risk_factors'].append({
                'type': 'low_volume',
                'severity': 'medium',
                'description': 'Low traffic volume may lead to unreliable data',
                'impact': 'Statistical significance issues'
            })
            risks['mitigation_strategies'].append('Increase budget or expand targeting')
        
        # High cost per conversion risk
        if conversions > 0:
            estimated_cpc = 1.50  # Placeholder - would come from actual cost data
            cost_per_conversion = (clicks * estimated_cpc) / conversions
            if cost_per_conversion > 50:
                risks['risk_factors'].append({
                    'type': 'high_cost_per_conversion',
                    'severity': 'high',
                    'description': f'Cost per conversion (${cost_per_conversion:.2f}) exceeds recommended threshold',
                    'impact': 'Poor ROI and budget efficiency'
                })
                risks['mitigation_strategies'].append('Optimize targeting and improve conversion rate')
        
        # Audience concentration risk
        country_distribution = Counter(event.get('country', 'unknown') for event in events)
        if country_distribution:
            top_country_percentage = max(country_distribution.values()) / len(events)
            if top_country_percentage > 0.8:
                risks['risk_factors'].append({
                    'type': 'audience_concentration',
                    'severity': 'medium',
                    'description': 'Over 80% of traffic from single country',
                    'impact': 'Vulnerability to market changes'
                })
                risks['mitigation_strategies'].append('Diversify geographic targeting')
        
        # Calculate overall risk score
        risk_weights = {'low': 1, 'medium': 2, 'high': 3}
        total_risk = sum(risk_weights.get(risk['severity'], 1) for risk in risks['risk_factors'])
        risks['risk_score'] = min(total_risk * 10, 100)
        
        return risks

    def _analyze_device_performance(self, events: List[Dict]) -> Dict:
        """Analyze performance by device type"""
        device_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        for event in events:
            device = event.get('device_type', 'unknown')
            device_data[device]['clicks'] += 1
            if event.get('captured_email'):
                device_data[device]['conversions'] += 1
        
        # Calculate conversion rates
        device_performance = {}
        for device, data in device_data.items():
            if data['clicks'] > 0:
                device_performance[device] = {
                    'clicks': data['clicks'],
                    'conversions': data['conversions'],
                    'conversion_rate': data['conversions'] / data['clicks']
                }
        
        return device_performance

    def _analyze_geographic_performance(self, events: List[Dict]) -> Dict:
        """Analyze performance by geography"""
        geo_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        for event in events:
            country = event.get('country', 'unknown')
            geo_data[country]['clicks'] += 1
            if event.get('captured_email'):
                geo_data[country]['conversions'] += 1
        
        # Calculate conversion rates
        geo_performance = {}
        for country, data in geo_data.items():
            if data['clicks'] >= 10:  # Only include countries with significant traffic
                geo_performance[country] = {
                    'clicks': data['clicks'],
                    'conversions': data['conversions'],
                    'conversion_rate': data['conversions'] / data['clicks']
                }
        
        return geo_performance

    def _analyze_time_performance(self, events: List[Dict]) -> Dict:
        """Analyze performance by time of day"""
        time_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        for event in events:
            if event.get('timestamp'):
                try:
                    hour = datetime.fromisoformat(event['timestamp']).hour
                    time_data[hour]['clicks'] += 1
                    if event.get('captured_email'):
                        time_data[hour]['conversions'] += 1
                except:
                    continue
        
        # Calculate conversion rates
        time_performance = {}
        for hour, data in time_data.items():
            if data['clicks'] > 0:
                time_performance[hour] = {
                    'clicks': data['clicks'],
                    'conversions': data['conversions'],
                    'conversion_rate': data['conversions'] / data['clicks']
                }
        
        return time_performance

    def _analyze_behavioral_patterns(self, events: List[Dict]) -> Dict:
        """Analyze user behavioral patterns"""
        patterns = {
            'session_duration_analysis': {},
            'click_patterns': {},
            'conversion_journey': {}
        }
        
        # Session duration analysis
        durations = [event.get('session_duration', 0) for event in events if event.get('session_duration', 0) > 0]
        if durations:
            patterns['session_duration_analysis'] = {
                'average': statistics.mean(durations),
                'median': statistics.median(durations),
                'std_dev': statistics.stdev(durations) if len(durations) > 1 else 0
            }
        
        return patterns

    def _analyze_demographics(self, events: List[Dict]) -> Dict:
        """Analyze demographic patterns"""
        demographics = {
            'browser_distribution': Counter(event.get('browser', 'unknown') for event in events),
            'os_distribution': Counter(event.get('os', 'unknown') for event in events),
            'country_distribution': Counter(event.get('country', 'unknown') for event in events)
        }
        
        return demographics

    def _analyze_engagement_patterns(self, events: List[Dict]) -> Dict:
        """Analyze user engagement patterns"""
        engagement = {
            'bounce_rate': 0.0,
            'repeat_visitors': 0,
            'conversion_funnel': {}
        }
        
        # Calculate bounce rate (simplified)
        total_sessions = len(set(event.get('ip_address', '') for event in events))
        bounced_sessions = len([event for event in events if event.get('session_duration', 0) < 30])
        
        if total_sessions > 0:
            engagement['bounce_rate'] = bounced_sessions / total_sessions
        
        return engagement

    def _calculate_daily_performance(self, events: List[Dict]) -> Dict:
        """Calculate daily performance metrics"""
        daily_data = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        
        for event in events:
            if event.get('timestamp'):
                try:
                    date = datetime.fromisoformat(event['timestamp']).date()
                    daily_data[date]['clicks'] += 1
                    if event.get('captured_email'):
                        daily_data[date]['conversions'] += 1
                except:
                    continue
        
        return dict(daily_data)

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate trend coefficient using linear regression"""
        if len(values) < 2:
            return 0.0
        
        n = len(values)
        x_values = list(range(n))
        
        # Simple linear regression
        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(values)
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, values))
        denominator = sum((x - x_mean) ** 2 for x in x_values)
        
        if denominator == 0:
            return 0.0
        
        slope = numerator / denominator
        return slope / y_mean if y_mean != 0 else 0.0

    def _calculate_prediction_confidence(self, recent_data: List[Dict]) -> float:
        """Calculate confidence level for predictions"""
        if len(recent_data) < 3:
            return 0.5
        
        # Calculate variance in recent performance
        clicks_values = [d['clicks'] for d in recent_data]
        conversion_values = [d['conversions'] for d in recent_data]
        
        clicks_cv = statistics.stdev(clicks_values) / statistics.mean(clicks_values) if statistics.mean(clicks_values) > 0 else 1
        conversion_cv = statistics.stdev(conversion_values) / statistics.mean(conversion_values) if statistics.mean(conversion_values) > 0 else 1
        
        # Lower variance = higher confidence
        avg_cv = (clicks_cv + conversion_cv) / 2
        confidence = max(0.3, 1.0 - avg_cv)
        
        return min(confidence, 0.95)

# Global campaign intelligence instance
campaign_intel = AdvancedCampaignIntelligence()
