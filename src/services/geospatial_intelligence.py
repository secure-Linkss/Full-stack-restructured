"""
ADVANCED GEOSPATIAL INTELLIGENCE SYSTEM
AI-powered geographic analytics with demographic modeling and predictive insights
"""

import json
import math
import statistics
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Optional

class AdvancedGeospatialIntelligence:
    def __init__(self):
        # Geographic clustering parameters
        self.clustering_radius = 100  # km
        self.min_cluster_size = 5
        
        # Economic and demographic data (simplified - in production would come from external sources)
        self.country_data = {
            'United States': {'gdp_per_capita': 65000, 'internet_penetration': 0.89, 'mobile_penetration': 1.07, 'timezone_offset': -5},
            'Canada': {'gdp_per_capita': 46000, 'internet_penetration': 0.91, 'mobile_penetration': 0.85, 'timezone_offset': -5},
            'United Kingdom': {'gdp_per_capita': 42000, 'internet_penetration': 0.95, 'mobile_penetration': 1.20, 'timezone_offset': 0},
            'Germany': {'gdp_per_capita': 46000, 'internet_penetration': 0.89, 'mobile_penetration': 1.28, 'timezone_offset': 1},
            'France': {'gdp_per_capita': 39000, 'internet_penetration': 0.85, 'mobile_penetration': 1.08, 'timezone_offset': 1},
            'Australia': {'gdp_per_capita': 55000, 'internet_penetration': 0.88, 'mobile_penetration': 1.08, 'timezone_offset': 10},
            'Japan': {'gdp_per_capita': 39000, 'internet_penetration': 0.83, 'mobile_penetration': 1.71, 'timezone_offset': 9},
            'India': {'gdp_per_capita': 2100, 'internet_penetration': 0.50, 'mobile_penetration': 0.85, 'timezone_offset': 5.5},
            'Brazil': {'gdp_per_capita': 8600, 'internet_penetration': 0.71, 'mobile_penetration': 1.04, 'timezone_offset': -3},
            'Mexico': {'gdp_per_capita': 9700, 'internet_penetration': 0.70, 'mobile_penetration': 0.88, 'timezone_offset': -6}
        }
        
        # City coordinates for distance calculations
        self.major_cities = {
            'New York': {'lat': 40.7128, 'lon': -74.0060, 'country': 'United States'},
            'Los Angeles': {'lat': 34.0522, 'lon': -118.2437, 'country': 'United States'},
            'London': {'lat': 51.5074, 'lon': -0.1278, 'country': 'United Kingdom'},
            'Paris': {'lat': 48.8566, 'lon': 2.3522, 'country': 'France'},
            'Berlin': {'lat': 52.5200, 'lon': 13.4050, 'country': 'Germany'},
            'Tokyo': {'lat': 35.6762, 'lon': 139.6503, 'country': 'Japan'},
            'Sydney': {'lat': -33.8688, 'lon': 151.2093, 'country': 'Australia'},
            'Toronto': {'lat': 43.6532, 'lon': -79.3832, 'country': 'Canada'},
            'Mumbai': {'lat': 19.0760, 'lon': 72.8777, 'country': 'India'},
            'São Paulo': {'lat': -23.5505, 'lon': -46.6333, 'country': 'Brazil'}
        }

    def analyze_geographic_intelligence(self, events_data: List[Dict]) -> Dict:
        """Comprehensive geographic intelligence analysis"""
        try:
            analysis = {
                'geographic_clusters': [],
                'performance_heatmap': {},
                'timezone_analysis': {},
                'demographic_insights': {},
                'market_opportunities': [],
                'travel_patterns': {},
                'economic_correlations': {},
                'predictive_expansion': {}
            }
            
            if not events_data:
                return analysis
            
            # Safe geographic clustering analysis
            try:
                analysis['geographic_clusters'] = self._identify_geographic_clusters(events_data)
            except Exception as e:
                print(f"Error in geographic clustering: {e}")
                analysis['geographic_clusters'] = []
            
            # Safe performance heatmap data
            try:
                analysis['performance_heatmap'] = self._generate_performance_heatmap(events_data)
            except Exception as e:
                print(f"Error in performance heatmap: {e}")
                analysis['performance_heatmap'] = {'countries': {}, 'intensity_levels': {}}
            
            # Safe timezone analysis
            try:
                analysis['timezone_analysis'] = self._analyze_timezone_patterns(events_data)
            except Exception as e:
                print(f"Error in timezone analysis: {e}")
                analysis['timezone_analysis'] = {}
            
            # Safe demographic insights
            try:
                analysis['demographic_insights'] = self._generate_demographic_insights(events_data)
            except Exception as e:
                print(f"Error in demographic insights: {e}")
                analysis['demographic_insights'] = {}
            
            # Safe market opportunities
            try:
                analysis['market_opportunities'] = self._identify_market_opportunities(events_data)
            except Exception as e:
                print(f"Error in market opportunities: {e}")
                analysis['market_opportunities'] = []
            
            # Safe travel patterns
            try:
                analysis['travel_patterns'] = self._analyze_travel_patterns(events_data)
            except Exception as e:
                print(f"Error in travel patterns: {e}")
                analysis['travel_patterns'] = {}
            
            # Safe economic correlations
            try:
                analysis['economic_correlations'] = self._analyze_economic_correlations(events_data)
            except Exception as e:
                print(f"Error in economic correlations: {e}")
                analysis['economic_correlations'] = {}
            
            # Safe predictive expansion
            try:
                analysis['predictive_expansion'] = self._predict_expansion_opportunities(events_data)
            except Exception as e:
                print(f"Error in predictive expansion: {e}")
                analysis['predictive_expansion'] = {}
            
            return analysis
            
        except Exception as e:
            print(f"Error in geographic intelligence analysis: {e}")
            return {
                'geographic_clusters': [],
                'performance_heatmap': {'countries': {}, 'intensity_levels': {}},
                'timezone_analysis': {},
                'demographic_insights': {},
                'market_opportunities': [],
                'travel_patterns': {},
                'economic_correlations': {},
                'predictive_expansion': {}
            }

    def _identify_geographic_clusters(self, events_data: List[Dict]) -> List[Dict]:
        """Identify geographic clusters of high activity"""
        clusters = []
        
        # Group events by city
        city_data = defaultdict(lambda: {
            'events': [],
            'clicks': 0,
            'conversions': 0,
            'unique_visitors': set(),
            'coordinates': None
        })
        
        for event in events_data:
            city = event.get('city', 'Unknown')
            country = event.get('country', 'Unknown')
            city_key = f"{city}, {country}"
            
            city_data[city_key]['events'].append(event)
            city_data[city_key]['clicks'] += 1
            if event.get('captured_email'):
                city_data[city_key]['conversions'] += 1
            if event.get('ip_address'):
                city_data[city_key]['unique_visitors'].add(event['ip_address'])
            
            # Set coordinates if available
            if city in self.major_cities:
                city_data[city_key]['coordinates'] = self.major_cities[city]
        
        # Identify significant clusters
        for city_key, data in city_data.items():
            if data['clicks'] and isinstance(data['clicks'], int) and data['clicks'] >= self.min_cluster_size:
                conversion_rate = data['conversions'] / data['clicks'] if data['clicks'] > 0 else 0
                engagement_rate = len(data['unique_visitors']) / data['clicks'] if data['clicks'] > 0 else 0
                
                cluster = {
                    'city': city_key,
                    'clicks': data['clicks'],
                    'conversions': data['conversions'],
                    'unique_visitors': len(data['unique_visitors']),
                    'conversion_rate': conversion_rate,
                    'engagement_rate': engagement_rate,
                    'performance_score': (conversion_rate * 0.6 + engagement_rate * 0.4) * 100,
                    'coordinates': data['coordinates'],
                    'cluster_size': 'large' if data['clicks'] > 50 else 'medium' if data['clicks'] > 20 else 'small'
                }
                clusters.append(cluster)
        
        # Sort by performance score
        clusters.sort(key=lambda x: x['performance_score'], reverse=True)
        
        return clusters[:20]  # Top 20 clusters

    def _generate_performance_heatmap(self, events_data: List[Dict]) -> Dict:
        """Generate heatmap data for geographic performance visualization"""
        heatmap_data = {
            'countries': {},
            'regions': {},
            'intensity_levels': {}
        }
        
        if not events_data:
            return heatmap_data
        
        # Country-level heatmap
        country_performance = {}
        
        for event in events_data:
            country = event.get('country')
            if not country or country == 'Unknown':
                continue
                
            if country not in country_performance:
                country_performance[country] = {
                    'clicks': 0,
                    'conversions': 0,
                    'unique_visitors': set(),
                    'avg_session_duration': []
                }
            
            country_performance[country]['clicks'] += 1
            
            if event.get('captured_email'):
                country_performance[country]['conversions'] += 1
            
            if event.get('ip_address'):
                country_performance[country]['unique_visitors'].add(event['ip_address'])
            
            session_duration = event.get('session_duration')
            if session_duration and isinstance(session_duration, (int, float)) and session_duration > 0:
                country_performance[country]['avg_session_duration'].append(session_duration)
        
        if not country_performance:
            return heatmap_data
        
        # Calculate heatmap intensity
        max_clicks = max(data['clicks'] for data in country_performance.values())
        
        for country, data in country_performance.items():
            clicks = data['clicks']
            conversions = data['conversions']
            unique_visitors = len(data['unique_visitors'])
            
            conversion_rate = conversions / clicks if clicks > 0 else 0
            engagement_rate = unique_visitors / clicks if clicks > 0 else 0
            avg_duration = statistics.mean(data['avg_session_duration']) if data['avg_session_duration'] else 0
            
            # Calculate intensity (0-100)
            intensity = (
                (clicks / max_clicks) * 0.4 +
                conversion_rate * 0.3 +
                engagement_rate * 0.2 +
                min(avg_duration / 60, 1) * 0.1
            ) * 100
            
            heatmap_data['countries'][country] = {
                'intensity': round(intensity, 2),
                'clicks': clicks,
                'conversions': conversions,
                'conversion_rate': round(conversion_rate, 4),
                'engagement_rate': round(engagement_rate, 4),
                'avg_session_duration': round(avg_duration, 2)
            }
        
        # Define intensity levels for visualization
        countries = heatmap_data['countries']
        heatmap_data['intensity_levels'] = {
            'very_high': [c for c, d in countries.items() if d['intensity'] >= 80],
            'high': [c for c, d in countries.items() if 60 <= d['intensity'] < 80],
            'medium': [c for c, d in countries.items() if 40 <= d['intensity'] < 60],
            'low': [c for c, d in countries.items() if 20 <= d['intensity'] < 40],
            'very_low': [c for c, d in countries.items() if d['intensity'] < 20]
        }
        
        return heatmap_data

    def _analyze_timezone_patterns(self, events_data: List[Dict]) -> Dict:
        """Analyze engagement patterns across different timezones"""
        timezone_analysis = {
            'hourly_patterns': defaultdict(lambda: {'clicks': 0, 'conversions': 0}),
            'country_peak_hours': {},
            'global_optimization': {},
            'timezone_performance': {}
        }
        
        # Analyze hourly patterns by country
        country_hourly = defaultdict(lambda: defaultdict(lambda: {'clicks': 0, 'conversions': 0}))
        
        for event in events_data:
            if event.get('timestamp'):
                try:
                    dt = datetime.fromisoformat(event['timestamp'])
                    country = event.get('country', 'Unknown')
                    
                    # Adjust for timezone if country data available
                    if country in self.country_data:
                        timezone_offset = self.country_data[country]['timezone_offset']
                        local_dt = dt + timedelta(hours=timezone_offset)
                        hour = local_dt.hour
                    else:
                        hour = dt.hour
                    
                    country_hourly[country][hour]['clicks'] += 1
                    timezone_analysis['hourly_patterns'][hour]['clicks'] += 1
                    
                    if event.get('captured_email'):
                        country_hourly[country][hour]['conversions'] += 1
                        timezone_analysis['hourly_patterns'][hour]['conversions'] += 1
                        
                except:
                    continue
        
        # Identify peak hours for each country
        for country, hourly_data in country_hourly.items():
            if sum(data['clicks'] for data in hourly_data.values()) >= 10:  # Minimum data threshold
                peak_hours = sorted(
                    hourly_data.items(),
                    key=lambda x: x[1]['clicks'] + x[1]['conversions'] * 2,  # Weight conversions higher
                    reverse=True
                )[:3]  # Top 3 peak hours
                
                timezone_analysis['country_peak_hours'][country] = [
                    {
                        'hour': hour,
                        'clicks': data['clicks'],
                        'conversions': data['conversions'],
                        'performance_score': data['clicks'] + data['conversions'] * 2
                    }
                    for hour, data in peak_hours
                ]
        
        # Global optimization recommendations
        global_peak_hours = sorted(
            timezone_analysis['hourly_patterns'].items(),
            key=lambda x: x[1]['clicks'] + x[1]['conversions'] * 2,
            reverse=True
        )[:5]
        
        timezone_analysis['global_optimization'] = {
            'recommended_hours': [hour for hour, _ in global_peak_hours],
            'peak_performance_window': f"{global_peak_hours[0][0]:02d}:00 - {(global_peak_hours[2][0] + 1) % 24:02d}:00 UTC"
        }
        
        return dict(timezone_analysis)

    def _generate_demographic_insights(self, events_data: List[Dict]) -> Dict:
        """Generate demographic insights with economic correlations"""
        insights = {
            'economic_segments': {},
            'technology_adoption': {},
            'cultural_patterns': {},
            'purchasing_power_analysis': {}
        }
        
        # Economic segmentation
        country_metrics = defaultdict(lambda: {
            'clicks': 0,
            'conversions': 0,
            'devices': Counter(),
            'browsers': Counter(),
            'avg_session_duration': []
        })
        
        for event in events_data:
            country = event.get('country', 'Unknown')
            country_metrics[country]['clicks'] += 1
            
            if event.get('captured_email'):
                country_metrics[country]['conversions'] += 1
            
            if event.get('device_type'):
                country_metrics[country]['devices'][event['device_type']] += 1
            
            if event.get('browser'):
                country_metrics[country]['browsers'][event['browser']] += 1
            
            session_duration = event.get('session_duration', 0)
            if session_duration > 0:
                country_metrics[country]['avg_session_duration'].append(session_duration)
        
        # Categorize countries by economic segments
        for country, metrics in country_metrics.items():
            if metrics['clicks'] >= 5:  # Minimum threshold
                conversion_rate = metrics['conversions'] / metrics['clicks']
                avg_duration = statistics.mean(metrics['avg_session_duration']) if metrics['avg_session_duration'] else 0
                
                # Get economic data
                economic_data = self.country_data.get(country, {
                    'gdp_per_capita': 10000,  # Default
                    'internet_penetration': 0.6,
                    'mobile_penetration': 0.8
                })
                
                # Determine economic segment
                gdp_per_capita = economic_data['gdp_per_capita']
                if gdp_per_capita >= 40000:
                    segment = 'high_income'
                elif gdp_per_capita >= 15000:
                    segment = 'upper_middle_income'
                elif gdp_per_capita >= 5000:
                    segment = 'lower_middle_income'
                else:
                    segment = 'low_income'
                
                if segment not in insights['economic_segments']:
                    insights['economic_segments'][segment] = {
                        'countries': [],
                        'total_clicks': 0,
                        'total_conversions': 0,
                        'avg_conversion_rate': 0,
                        'avg_session_duration': 0
                    }
                
                insights['economic_segments'][segment]['countries'].append({
                    'country': country,
                    'clicks': metrics['clicks'],
                    'conversions': metrics['conversions'],
                    'conversion_rate': conversion_rate,
                    'avg_session_duration': avg_duration,
                    'gdp_per_capita': gdp_per_capita
                })
                
                insights['economic_segments'][segment]['total_clicks'] += metrics['clicks']
                insights['economic_segments'][segment]['total_conversions'] += metrics['conversions']
        
        # Calculate segment averages
        for segment_data in insights['economic_segments'].values():
            if segment_data['total_clicks'] > 0:
                segment_data['avg_conversion_rate'] = segment_data['total_conversions'] / segment_data['total_clicks']
                segment_data['avg_session_duration'] = statistics.mean([
                    c['avg_session_duration'] for c in segment_data['countries']
                    if c['avg_session_duration'] > 0
                ]) if segment_data['countries'] else 0
        
        # Technology adoption analysis
        insights['technology_adoption'] = self._analyze_technology_adoption(country_metrics)
        
        return insights

    def _identify_market_opportunities(self, events_data: List[Dict]) -> List[Dict]:
        """Identify untapped market opportunities"""
        opportunities = []
        
        # Analyze current market penetration
        country_performance = defaultdict(lambda: {
            'clicks': 0,
            'conversions': 0,
            'potential_score': 0
        })
        
        for event in events_data:
            country = event.get('country', 'Unknown')
            country_performance[country]['clicks'] += 1
            if event.get('captured_email'):
                country_performance[country]['conversions'] += 1
        
        # Identify opportunities based on economic data and current performance
        for country, economic_data in self.country_data.items():
            current_performance = country_performance.get(country, {'clicks': 0, 'conversions': 0})
            
            # Calculate opportunity score
            gdp_factor = min(economic_data['gdp_per_capita'] / 50000, 1.0)
            internet_factor = economic_data['internet_penetration']
            mobile_factor = min(economic_data['mobile_penetration'], 1.0)
            
            # Current penetration (inverse - lower is better for opportunity)
            current_penetration = min(current_performance['clicks'] / 100, 1.0)
            penetration_factor = 1.0 - current_penetration
            
            opportunity_score = (
                gdp_factor * 0.3 +
                internet_factor * 0.25 +
                mobile_factor * 0.2 +
                penetration_factor * 0.25
            ) * 100
            
            if opportunity_score >= 60 and current_performance['clicks'] < 20:
                opportunities.append({
                    'country': country,
                    'opportunity_score': opportunity_score,
                    'current_clicks': current_performance['clicks'],
                    'current_conversions': current_performance['conversions'],
                    'gdp_per_capita': economic_data['gdp_per_capita'],
                    'internet_penetration': economic_data['internet_penetration'],
                    'mobile_penetration': economic_data['mobile_penetration'],
                    'recommended_actions': self._generate_market_entry_recommendations(country, economic_data),
                    'estimated_potential': self._estimate_market_potential(country, economic_data)
                })
        
        # Sort by opportunity score
        opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
        
        return opportunities[:10]  # Top 10 opportunities

    def _analyze_travel_patterns(self, events_data: List[Dict]) -> Dict:
        """Analyze impossible travel patterns and user mobility"""
        travel_analysis = {
            'suspicious_patterns': [],
            'mobility_insights': {},
            'geographic_consistency': {}
        }
        
        # Group events by IP address to track user journeys
        ip_journeys = defaultdict(list)
        
        for event in events_data:
            if event.get('ip_address') and event.get('country') and event.get('timestamp'):
                ip_journeys[event['ip_address']].append({
                    'country': event['country'],
                    'city': event.get('city', 'Unknown'),
                    'timestamp': event['timestamp'],
                    'coordinates': self.major_cities.get(event.get('city', ''), {})
                })
        
        # Analyze each IP's journey
        for ip, journey in ip_journeys.items():
            if len(journey) > 1:
                # Sort by timestamp
                journey.sort(key=lambda x: x['timestamp'])
                
                # Check for impossible travel
                for i in range(1, len(journey)):
                    prev_location = journey[i-1]
                    curr_location = journey[i]
                    
                    if prev_location['country'] != curr_location['country']:
                        try:
                            prev_time = datetime.fromisoformat(prev_location['timestamp'])
                            curr_time = datetime.fromisoformat(curr_location['timestamp'])
                            time_diff_hours = (curr_time - prev_time).total_seconds() / 3600
                            
                            # If different countries within 2 hours, flag as suspicious
                            if time_diff_hours < 2:
                                travel_analysis['suspicious_patterns'].append({
                                    'ip_address': ip,
                                    'from_country': prev_location['country'],
                                    'to_country': curr_location['country'],
                                    'time_difference_hours': time_diff_hours,
                                    'suspicion_level': 'high' if time_diff_hours < 0.5 else 'medium'
                                })
                        except:
                            continue
        
        return travel_analysis

    def _analyze_economic_correlations(self, events_data: List[Dict]) -> Dict:
        """Analyze correlations between economic indicators and performance"""
        correlations = {
            'gdp_correlation': 0.0,
            'internet_penetration_correlation': 0.0,
            'mobile_penetration_correlation': 0.0,
            'insights': []
        }
        
        # Collect data for correlation analysis
        country_data_points = []
        
        country_performance = defaultdict(lambda: {'clicks': 0, 'conversions': 0})
        for event in events_data:
            country = event.get('country', 'Unknown')
            country_performance[country]['clicks'] += 1
            if event.get('captured_email'):
                country_performance[country]['conversions'] += 1
        
        for country, performance in country_performance.items():
            if country in self.country_data and performance['clicks'] >= 5:
                economic_data = self.country_data[country]
                conversion_rate = performance['conversions'] / performance['clicks']
                
                country_data_points.append({
                    'country': country,
                    'conversion_rate': conversion_rate,
                    'gdp_per_capita': economic_data['gdp_per_capita'],
                    'internet_penetration': economic_data['internet_penetration'],
                    'mobile_penetration': economic_data['mobile_penetration']
                })
        
        # Calculate correlations (simplified Pearson correlation)
        if len(country_data_points) >= 3:
            conversion_rates = [dp['conversion_rate'] for dp in country_data_points]
            gdp_values = [dp['gdp_per_capita'] for dp in country_data_points]
            internet_values = [dp['internet_penetration'] for dp in country_data_points]
            mobile_values = [dp['mobile_penetration'] for dp in country_data_points]
            
            correlations['gdp_correlation'] = self._calculate_correlation(conversion_rates, gdp_values)
            correlations['internet_penetration_correlation'] = self._calculate_correlation(conversion_rates, internet_values)
            correlations['mobile_penetration_correlation'] = self._calculate_correlation(conversion_rates, mobile_values)
            
            # Generate insights
            if correlations['gdp_correlation'] > 0.5:
                correlations['insights'].append("Strong positive correlation between GDP per capita and conversion rates")
            if correlations['internet_penetration_correlation'] > 0.3:
                correlations['insights'].append("Internet penetration positively impacts conversion performance")
            if correlations['mobile_penetration_correlation'] > 0.3:
                correlations['insights'].append("Mobile adoption correlates with better engagement")
        
        return correlations

    def _predict_expansion_opportunities(self, events_data: List[Dict]) -> Dict:
        """Predict optimal expansion opportunities using trend analysis"""
        predictions = {
            'recommended_markets': [],
            'expansion_timeline': {},
            'resource_allocation': {},
            'risk_assessment': {}
        }
        
        # Analyze current market trends
        current_markets = defaultdict(lambda: {'clicks': 0, 'conversions': 0, 'growth_trend': 0})
        
        # Calculate monthly trends (simplified)
        for event in events_data:
            country = event.get('country', 'Unknown')
            current_markets[country]['clicks'] += 1
            if event.get('captured_email'):
                current_markets[country]['conversions'] += 1
        
        # Predict expansion based on current performance and economic factors
        for country, economic_data in self.country_data.items():
            current_performance = current_markets.get(country, {'clicks': 0, 'conversions': 0})
            
            if current_performance['clicks'] >= 10:  # Established market
                continue
            
            # Calculate expansion potential
            market_size_factor = economic_data['gdp_per_capita'] / 50000
            digital_readiness = (economic_data['internet_penetration'] + economic_data['mobile_penetration']) / 2
            competition_factor = 1.0 - min(current_performance['clicks'] / 50, 1.0)
            
            expansion_score = (
                market_size_factor * 0.4 +
                digital_readiness * 0.4 +
                competition_factor * 0.2
            ) * 100
            
            if expansion_score >= 70:
                predictions['recommended_markets'].append({
                    'country': country,
                    'expansion_score': expansion_score,
                    'market_size_factor': market_size_factor,
                    'digital_readiness': digital_readiness,
                    'current_presence': current_performance['clicks'],
                    'recommended_budget_allocation': min(expansion_score / 10, 20),  # Percentage
                    'expected_timeline': '3-6 months' if expansion_score >= 85 else '6-12 months'
                })
        
        # Sort by expansion score
        predictions['recommended_markets'].sort(key=lambda x: x['expansion_score'], reverse=True)
        
        return predictions

    def _analyze_technology_adoption(self, country_metrics: Dict) -> Dict:
        """Analyze technology adoption patterns by country"""
        tech_analysis = {
            'mobile_vs_desktop': {},
            'browser_preferences': {},
            'technology_trends': {}
        }
        
        for country, metrics in country_metrics.items():
            if metrics['clicks'] >= 10:
                # Device distribution
                total_devices = sum(metrics['devices'].values())
                if total_devices > 0:
                    device_distribution = {
                        device: count / total_devices
                        for device, count in metrics['devices'].items()
                    }
                    tech_analysis['mobile_vs_desktop'][country] = device_distribution
                
                # Browser preferences
                total_browsers = sum(metrics['browsers'].values())
                if total_browsers > 0:
                    browser_distribution = {
                        browser: count / total_browsers
                        for browser, count in metrics['browsers'].most_common(3)
                    }
                    tech_analysis['browser_preferences'][country] = browser_distribution
        
        return tech_analysis

    def _generate_market_entry_recommendations(self, country: str, economic_data: Dict) -> List[str]:
        """Generate specific recommendations for market entry"""
        recommendations = []
        
        if economic_data['mobile_penetration'] > 1.0:
            recommendations.append("Focus on mobile-first strategy")
        
        if economic_data['internet_penetration'] > 0.8:
            recommendations.append("Leverage digital marketing channels")
        
        if economic_data['gdp_per_capita'] > 30000:
            recommendations.append("Premium positioning strategy")
        else:
            recommendations.append("Value-focused positioning")
        
        recommendations.append(f"Localize content for {country} market")
        recommendations.append("Partner with local influencers or businesses")
        
        return recommendations

    def _estimate_market_potential(self, country: str, economic_data: Dict) -> Dict:
        """Estimate market potential for a country"""
        # Simplified market potential calculation
        base_potential = economic_data['gdp_per_capita'] / 1000
        digital_multiplier = economic_data['internet_penetration'] * economic_data['mobile_penetration']
        
        estimated_monthly_clicks = int(base_potential * digital_multiplier * 10)
        estimated_monthly_conversions = int(estimated_monthly_clicks * 0.02)  # 2% conversion rate assumption
        
        return {
            'estimated_monthly_clicks': estimated_monthly_clicks,
            'estimated_monthly_conversions': estimated_monthly_conversions,
            'confidence_level': 'medium'
        }

    def _calculate_correlation(self, x_values: List[float], y_values: List[float]) -> float:
        """Calculate Pearson correlation coefficient"""
        if len(x_values) != len(y_values) or len(x_values) < 2:
            return 0.0
        
        n = len(x_values)
        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(y_values)
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, y_values))
        x_variance = sum((x - x_mean) ** 2 for x in x_values)
        y_variance = sum((y - y_mean) ** 2 for y in y_values)
        
        denominator = math.sqrt(x_variance * y_variance)
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator

# Global geospatial intelligence instance
geo_intel = AdvancedGeospatialIntelligence()
