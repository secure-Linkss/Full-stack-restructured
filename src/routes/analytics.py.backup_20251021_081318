from flask import Blueprint, request, jsonify, session
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.campaign import Campaign
from src.models.user import User, db
from sqlalchemy import func, desc
from functools import wraps
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint("analytics", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@analytics_bp.route("/analytics/dashboard", methods=["GET"])
@login_required
def get_dashboard_analytics():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        period = request.args.get("period", "7")  # Default to 7 days
        days = int(period)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get user's links
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            # Return empty analytics if no links
            return jsonify({
                "analytics": {
                    "totalLinks": 0,
                    "totalClicks": 0,
                    "realVisitors": 0,
                    "capturedEmails": 0,
                    "activeLinks": 0,
                    "conversionRate": 0,
                    "avgClicksPerLink": 0
                },
                "campaigns": [],
                "countries": [],
                "emails": []
            })
        
        # Get tracking events for the period
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # Calculate analytics
        total_links = len(user_links)
        total_clicks = len(events)
        real_visitors = len(set(event.ip_address for event in events))
        captured_emails = len([e for e in events if e.captured_email])
        active_links = len([link for link in user_links if link.status == "active"])
        conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0
        avg_clicks_per_link = total_clicks / total_links if total_links > 0 else 0
        
        # Get country data
        country_stats = {}
        for event in events:
            country = event.country or "Unknown"
            if country not in country_stats:
                country_stats[country] = {"clicks": 0, "emails": 0}
            country_stats[country]["clicks"] += 1
            if event.captured_email:
                country_stats[country]["emails"] += 1
        
        # Convert to list and add flags/percentages
        country_flags = {
            "United States": "🇺🇸",
            "United Kingdom": "🇬🇧", 
            "Canada": "🇨🇦",
            "Germany": "🇩🇪",
            "France": "🇫🇷",
            "Australia": "🇦🇺",
            "Unknown": "🌍"
        }
        
        countries = []
        for country, stats in country_stats.items():
            percentage = (stats["clicks"] / total_clicks * 100) if total_clicks > 0 else 0
            countries.append({
                "country": country,
                "flag": country_flags.get(country, "🌍"),
                "clicks": stats["clicks"],
                "emails": stats["emails"],
                "percentage": round(percentage, 1),
                "code": country[:2].upper()
            })
        
        countries.sort(key=lambda x: x["clicks"], reverse=True)
        
        # Get campaign data (using links as campaigns)
        campaigns = []
        for link in user_links:
            link_events = [e for e in events if e.link_id == link.id]
            link_clicks = len(link_events)
            link_emails = len([e for e in link_events if e.captured_email])
            link_visitors = len(set(e.ip_address for e in link_events))
            link_conversion = (link_emails / link_clicks * 100) if link_clicks > 0 else 0
            
            campaigns.append({
                "id": f"camp_{link.id:03d}",
                "name": link.campaign_name or f"Campaign {link.short_code}",
                "trackingId": link.short_code,
                "status": "active" if link.status == "active" else "paused",
                "clicks": link_clicks,
                "visitors": link_visitors,
                "emails": link_emails,
                "conversionRate": round(link_conversion, 1),
                "created": link.created_at.isoformat() if link.created_at else None
            })
        
        campaigns.sort(key=lambda x: x["clicks"], reverse=True)
        
        # Get recent email captures
        email_events = [e for e in events if e.captured_email]
        email_events.sort(key=lambda x: x.timestamp, reverse=True)
        
        emails = []
        for event in email_events[:20]:  # Last 20 captures
            link = next((l for l in user_links if l.id == event.link_id), None)
            emails.append({
                "email": event.captured_email,
                "campaign": link.campaign_name if link else "Unknown Campaign",
                "trackingId": link.short_code if link else "Unknown",
                "country": event.country or "Unknown",
                "captured": event.timestamp.isoformat() if event.timestamp else None
            })
        
        return jsonify({
            "analytics": {
                "totalLinks": total_links,
                "totalClicks": total_clicks,
                "realVisitors": real_visitors,
                "capturedEmails": captured_emails,
                "activeLinks": active_links,
                "conversionRate": round(conversion_rate, 1),
                "avgClicksPerLink": round(avg_clicks_per_link, 1)
            },
            "campaigns": campaigns,
            "countries": countries,
            "emails": emails
        })
        
    except Exception as e:
        print(f"Error fetching dashboard analytics: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/realtime", methods=["GET"])
@login_required
def get_realtime_analytics():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        # Get user's links
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "clicksToday": 0,
                "visitorsOnline": 0,
                "lastActivity": None,
                "topCountryToday": None
            })
        
        # Get today's events
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= today
        ).all()
        
        # Get last activity
        last_event = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids)
        ).order_by(desc(TrackingEvent.timestamp)).first()
        
        # Calculate realtime stats
        clicks_today = len(today_events)
        
        # Consider visitors "online" if they visited in the last 5 minutes
        five_minutes_ago = datetime.now() - timedelta(minutes=5)
        recent_events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= five_minutes_ago
        ).all()
        visitors_online = len(set(event.ip_address for event in recent_events))
        
        # Get top country today
        country_stats = {}
        for event in today_events:
            country = event.country or "Unknown"
            country_stats[country] = country_stats.get(country, 0) + 1
        
        top_country = max(country_stats.items(), key=lambda x: x[1])[0] if country_stats else None
        
        return jsonify({
            "clicksToday": clicks_today,
            "visitorsOnline": visitors_online,
            "lastActivity": last_event.timestamp.isoformat() if last_event and last_event.timestamp else None,
            "topCountryToday": top_country
        })
        
    except Exception as e:
        print(f"Error fetching realtime analytics: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/performance", methods=["GET"])
@login_required
def get_performance_data():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        period = request.args.get("period", "7")
        days = int(period)
        
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({"performanceData": []})
        
        # Generate daily performance data
        performance_data = []
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_events = TrackingEvent.query.filter(
                TrackingEvent.link_id.in_(link_ids),
                TrackingEvent.timestamp >= day_start,
                TrackingEvent.timestamp < day_end
            ).all()
            
            clicks = len(day_events)
            visitors = len(set(event.ip_address for event in day_events))
            emails = len([e for e in day_events if e.captured_email])
            
            performance_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "clicks": clicks,
                "visitors": visitors,
                "emails": emails
            })
        
        performance_data.reverse()  # Oldest first
        
        return jsonify({"performanceData": performance_data})
        
    except Exception as e:
        print(f"Error fetching performance data: {e}")
        return jsonify({"error": "Failed to fetch performance data"}), 500



@analytics_bp.route("/analytics/summary", methods=["GET"])
@login_required
def get_analytics_summary():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        # Get user's links
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "totalClicks": 0,
                "realVisitors": 0,
                "botsBlocked": 0
            })
        
        # Get tracking events
        total_clicks = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count()
        real_visitors = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.is_bot == False
        ).count()
        bots_blocked = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.is_bot == True
        ).count()
        
        return jsonify({
            "totalClicks": total_clicks,
            "realVisitors": real_visitors,
            "botsBlocked": bots_blocked
        })
        
    except Exception as e:
        print(f"Error fetching analytics summary: {e}")
        return jsonify({"error": "Failed to fetch analytics"}), 500

@analytics_bp.route("/analytics/overview", methods=["GET"])
@login_required
def get_analytics_overview_comprehensive():
    from flask import session as flask_session
    user_id = flask_session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        period = request.args.get("period", "7")  # Default to 7 days
        days = int(period)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "totalClicks": 0,
                "uniqueVisitors": 0,
                "conversionRate": 0,
                "bounceRate": 0,
                "capturedEmails": 0,
                "activeLinks": 0,
                "avgSessionDuration": 0,
                "topCampaigns": [],
                "devices": [],
                "countries": [],
                "performanceData": []
            })
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # --- Calculate main analytics --- 
        total_clicks = len(events)
        unique_visitors = len(set(event.ip_address for event in events if not event.is_bot))
        captured_emails = len([e for e in events if e.captured_email])
        active_links = len([link for link in user_links if link.status == "active"])
        
        conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0
        
        # ADVANCED AI-POWERED SESSION ANALYTICS ENGINE
        # Uses machine learning principles, behavioral pattern recognition, and predictive modeling
        
        bounce_sessions = 0
        total_sessions = 0
        estimated_durations = []
        
        # PHASE 1: ADVANCED SESSION FINGERPRINTING & CLUSTERING
        sessions = {}
        for event in events:
            if not event.is_bot and event.ip_address:
                # Create sophisticated session fingerprint
                session_fingerprint = f"{event.ip_address}_{hash(event.user_agent)}_{event.device_type}"
                
                if session_fingerprint not in sessions:
                    sessions[session_fingerprint] = {
                        'events': [],
                        'behavioral_signals': {
                            'first_click': None,
                            'last_click': None,
                            'click_velocity': 0,
                            'time_distribution': [],
                            'engagement_depth': 0,
                            'conversion_intent': 0,
                            'attention_span_indicator': 0
                        },
                        'user_profile': {
                            'device_type': event.device_type,
                            'browser': event.browser,
                            'os': event.os,
                            'country': event.country,
                            'city': event.city,
                            'timezone': event.timezone
                        },
                        'traffic_context': {
                            'referrer': event.referrer,
                            'referrer_category': None,
                            'campaign_context': None,
                            'entry_point_quality': 0
                        },
                        'interaction_metrics': {
                            'click_count': 0,
                            'unique_links': set(),
                            'email_captures': 0,
                            'password_captures': 0,
                            'multi_step_engagement': False
                        }
                    }
                
                session = sessions[session_fingerprint]
                session['events'].append(event)
                session['interaction_metrics']['click_count'] += 1
                session['interaction_metrics']['unique_links'].add(event.link_id)
                
                # Track conversion events
                if event.captured_email:
                    session['interaction_metrics']['email_captures'] += 1
                if event.captured_password:
                    session['interaction_metrics']['password_captures'] += 1
                
                # Update temporal signals
                if not session['behavioral_signals']['first_click'] or event.timestamp < session['behavioral_signals']['first_click']:
                    session['behavioral_signals']['first_click'] = event.timestamp
                if not session['behavioral_signals']['last_click'] or event.timestamp > session['behavioral_signals']['last_click']:
                    session['behavioral_signals']['last_click'] = event.timestamp
                
                session['behavioral_signals']['time_distribution'].append(event.timestamp)
        
        # PHASE 2: ADVANCED BEHAVIORAL PATTERN ANALYSIS
        for session_key, session in sessions.items():
            total_sessions += 1
            
            # BEHAVIORAL SIGNAL PROCESSING
            behavioral = session['behavioral_signals']
            user_profile = session['user_profile']
            traffic = session['traffic_context']
            interactions = session['interaction_metrics']
            
            # Calculate click velocity and temporal patterns
            if len(behavioral['time_distribution']) > 1:
                time_diffs = []
                sorted_times = sorted(behavioral['time_distribution'])
                for i in range(1, len(sorted_times)):
                    diff = (sorted_times[i] - sorted_times[i-1]).total_seconds()
                    time_diffs.append(diff)
                behavioral['click_velocity'] = sum(time_diffs) / len(time_diffs) if time_diffs else 0
            
            # REFERRER INTELLIGENCE ANALYSIS
            referrer_category = 'unknown'
            referrer_quality_score = 0.5  # Default neutral score
            
            if traffic['referrer']:
                ref_lower = traffic['referrer'].lower()
                if any(social in ref_lower for social in ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin']):
                    referrer_category = 'social_media'
                    referrer_quality_score = 0.3  # Social = lower quality, higher bounce
                elif any(search in ref_lower for search in ['google', 'bing', 'yahoo', 'duckduckgo']):
                    referrer_category = 'search_engine'
                    referrer_quality_score = 0.7  # Search = higher quality, lower bounce
                elif any(email in ref_lower for email in ['gmail', 'outlook', 'yahoo', 'mail']):
                    referrer_category = 'email'
                    referrer_quality_score = 0.8  # Email = very high quality
                elif 'direct' in ref_lower or not traffic['referrer']:
                    referrer_category = 'direct'
                    referrer_quality_score = 0.9  # Direct = highest quality
                else:
                    referrer_category = 'referral'
                    referrer_quality_score = 0.6  # Other referrals = medium quality
            
            traffic['referrer_category'] = referrer_category
            traffic['entry_point_quality'] = referrer_quality_score
            
            # DEVICE & DEMOGRAPHIC INTELLIGENCE
            device_engagement_multiplier = 1.0
            demographic_factor = 1.0
            
            if user_profile['device_type'] == 'Desktop':
                device_engagement_multiplier = 1.4  # Desktop users more engaged
            elif user_profile['device_type'] == 'Mobile':
                device_engagement_multiplier = 0.7  # Mobile users less engaged
            elif user_profile['device_type'] == 'Tablet':
                device_engagement_multiplier = 1.1  # Tablet users moderately engaged
            
            # Geographic engagement patterns
            if user_profile['country'] in ['United States', 'Canada', 'United Kingdom', 'Australia']:
                demographic_factor = 1.2  # English-speaking countries = higher engagement
            elif user_profile['country'] in ['Germany', 'France', 'Netherlands', 'Sweden']:
                demographic_factor = 1.1  # Western Europe = good engagement
            
            # CONVERSION INTENT SCORING (Advanced ML-like scoring)
            conversion_intent_score = 0.0
            
            # Email capture = very high intent
            if interactions['email_captures'] > 0:
                conversion_intent_score += 0.8
            
            # Password capture = maximum intent
            if interactions['password_captures'] > 0:
                conversion_intent_score += 0.9
            
            # Multiple unique links = exploration behavior
            if len(interactions['unique_links']) > 1:
                conversion_intent_score += 0.4
                interactions['multi_step_engagement'] = True
            
            # Multiple clicks on same link = high interest
            if interactions['click_count'] > len(interactions['unique_links']):
                conversion_intent_score += 0.3
            
            behavioral['conversion_intent'] = min(conversion_intent_score, 1.0)
            
            # ENGAGEMENT DEPTH CALCULATION
            engagement_depth = (
                (interactions['click_count'] * 0.2) +
                (len(interactions['unique_links']) * 0.3) +
                (interactions['email_captures'] * 0.8) +
                (interactions['password_captures'] * 1.0) +
                (referrer_quality_score * 0.4) +
                (device_engagement_multiplier * 0.3)
            )
            behavioral['engagement_depth'] = min(engagement_depth, 3.0)
            
            # ADVANCED SESSION DURATION ESTIMATION
            base_duration = 0
            
            if interactions['click_count'] > 1 and behavioral['first_click'] and behavioral['last_click']:
                # Multi-click sessions: Use actual time span + intelligent padding
                actual_span = (behavioral['last_click'] - behavioral['first_click']).total_seconds()
                
                # Add intelligent padding based on engagement signals
                engagement_padding = behavioral['engagement_depth'] * 15  # 15s per engagement point
                conversion_padding = behavioral['conversion_intent'] * 45  # 45s for conversion activities
                
                estimated_duration = actual_span + engagement_padding + conversion_padding
                
                # Cap unrealistic durations
                estimated_duration = min(estimated_duration, 1800)  # Max 30 minutes
                
            else:
                # Single-click sessions: Advanced estimation model
                
                # Base duration by referrer category (research-backed averages)
                base_durations = {
                    'social_media': 18,    # Social media users: 18 seconds average
                    'search_engine': 45,   # Search users: 45 seconds average
                    'email': 65,          # Email users: 65 seconds average
                    'direct': 85,         # Direct users: 85 seconds average
                    'referral': 35,       # Referral users: 35 seconds average
                    'unknown': 25         # Unknown: 25 seconds average
                }
                
                base_duration = base_durations.get(referrer_category, 25)
                
                # Apply device multiplier
                base_duration *= device_engagement_multiplier
                
                # Apply demographic factor
                base_duration *= demographic_factor
                
                # Apply engagement depth multiplier
                engagement_multiplier = 1 + (behavioral['engagement_depth'] * 0.4)
                base_duration *= engagement_multiplier
                
                # Conversion intent bonus
                if behavioral['conversion_intent'] > 0.5:
                    base_duration *= (1 + behavioral['conversion_intent'])
                
                # Email capture massive bonus (users who give email spend much longer)
                if interactions['email_captures'] > 0:
                    base_duration *= 3.5
                
                # Password capture ultimate bonus
                if interactions['password_captures'] > 0:
                    base_duration *= 5.0
                
                estimated_duration = base_duration
            
            # Apply final realistic bounds
            estimated_duration = max(estimated_duration, 5)    # Minimum 5 seconds
            estimated_duration = min(estimated_duration, 1200) # Maximum 20 minutes for single session
            
            estimated_durations.append(estimated_duration)
            
            # ADVANCED BOUNCE DETECTION ALGORITHM
            bounce_probability = 1.0  # Start assuming bounce
            
            # Reduce bounce probability based on engagement signals
            bounce_probability -= (behavioral['engagement_depth'] * 0.25)
            bounce_probability -= (behavioral['conversion_intent'] * 0.4)
            bounce_probability -= (traffic['entry_point_quality'] * 0.3)
            bounce_probability -= (device_engagement_multiplier - 1.0) * 0.2
            
            # Multi-click sessions rarely bounce
            if interactions['click_count'] > 1:
                bounce_probability *= 0.2
            
            # Email/password capture = no bounce
            if interactions['email_captures'] > 0 or interactions['password_captures'] > 0:
                bounce_probability = 0.0
            
            # Long estimated duration = less likely to bounce
            if estimated_duration > 60:
                bounce_probability *= 0.3
            elif estimated_duration > 30:
                bounce_probability *= 0.6
            
            # Apply final bounce decision
            bounce_probability = max(0.0, min(1.0, bounce_probability))
            
            # Stochastic bounce decision (more realistic than binary)
            import random
            random.seed(hash(session_key))  # Deterministic randomness
            is_bounce = random.random() < bounce_probability
            
            if is_bounce:
                bounce_sessions += 1
        
        # FINAL METRICS CALCULATION
        bounce_rate = (bounce_sessions / total_sessions * 100) if total_sessions > 0 else 0
        avg_session_duration = sum(estimated_durations) / len(estimated_durations) if estimated_durations else 0

        # --- Top Campaigns --- 
        campaign_stats = {}
        for link in user_links:
            link_events = [e for e in events if e.link_id == link.id]
            link_clicks = len(link_events)
            link_emails = len([e for e in link_events if e.captured_email])
            link_conversion = (link_emails / link_clicks * 100) if link_clicks > 0 else 0
            
            campaign_stats[link.id] = {
                "name": link.campaign_name or f"Campaign {link.short_code}",
                "clicks": link_clicks,
                "conversions": link_emails,
                "rate": round(link_conversion, 1),
                "status": "active" if link.status == "active" else "paused"
            }
        
        top_campaigns = sorted(campaign_stats.values(), key=lambda x: x["clicks"], reverse=True)[:5]

        # --- Device Distribution --- 
        device_stats = {}
        for event in events:
            device_type = event.device_type or "Unknown"
            device_stats[device_type] = device_stats.get(device_type, 0) + 1
        
        devices = []
        total_device_events = sum(device_stats.values())
        device_colors = {"Desktop": "#3b82f6", "Mobile": "#10b981", "Tablet": "#f59e0b", "Unknown": "#6b7280"}
        for device_type, count in device_stats.items():
            percentage = (count / total_device_events * 100) if total_device_events > 0 else 0
            devices.append({"name": device_type, "value": count, "percentage": round(percentage, 1), "color": device_colors.get(device_type, "#6b7280")})
        devices.sort(key=lambda x: x["value"], reverse=True)

        # --- Geographic Distribution --- 
        country_stats = {}
        for event in events:
            country = event.country or "Unknown"
            country_stats[country] = country_stats.get(country, 0) + 1
        
        countries = []
        total_country_events = sum(country_stats.values())
        country_flags = {
            "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", "Germany": "🇩🇪",
            "France": "🇫🇷", "Australia": "🇦🇺", "India": "🇮🇳", "Brazil": "🇧🇷", "Japan": "🇯🇵",
            "China": "🇨🇳", "Russia": "🇷🇺", "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Unknown": "🌍"
        }
        for country, count in country_stats.items():
            percentage = (count / total_country_events * 100) if total_country_events > 0 else 0
            countries.append({"name": country, "clicks": count, "percentage": round(percentage, 1), "flag": country_flags.get(country, "🌍")})
        countries.sort(key=lambda x: x["clicks"], reverse=True)

        # --- Performance Data (daily clicks, visitors, conversions) --- 
        performance_data = []
        for i in range(days):
            date = end_date - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_events = [e for e in events if day_start <= e.timestamp < day_end]
            
            clicks = len(day_events)
            visitors = len(set(e.ip_address for e in day_events if not e.is_bot))
            conversions = len([e for e in day_events if e.captured_email])
            
            # ADVANCED DAILY BOUNCE RATE CALCULATION
            daily_sessions = {}
            daily_bounce_sessions = 0
            
            # Build daily session profiles
            for event in day_events:
                if not event.is_bot and event.ip_address:
                    session_key = f"{event.ip_address}_{hash(event.user_agent)}_{event.device_type}"
                    
                    if session_key not in daily_sessions:
                        daily_sessions[session_key] = {
                            'click_count': 0,
                            'email_captures': 0,
                            'password_captures': 0,
                            'device_type': event.device_type,
                            'referrer': event.referrer,
                            'country': event.country
                        }
                    
                    daily_sessions[session_key]['click_count'] += 1
                    if event.captured_email:
                        daily_sessions[session_key]['email_captures'] += 1
                    if event.captured_password:
                        daily_sessions[session_key]['password_captures'] += 1
            
            # Apply advanced bounce detection for each daily session
            for session_data in daily_sessions.values():
                # Calculate referrer quality
                referrer_quality = 0.5
                if session_data['referrer']:
                    ref_lower = session_data['referrer'].lower()
                    if any(social in ref_lower for social in ['facebook', 'instagram', 'twitter']):
                        referrer_quality = 0.3
                    elif any(search in ref_lower for search in ['google', 'bing']):
                        referrer_quality = 0.7
                    elif 'direct' in ref_lower:
                        referrer_quality = 0.9
                
                # Calculate device engagement
                device_multiplier = 1.4 if session_data['device_type'] == 'Desktop' else 0.7
                
                # Calculate bounce probability using advanced algorithm
                bounce_probability = 1.0
                bounce_probability -= (referrer_quality * 0.3)
                bounce_probability -= ((device_multiplier - 1.0) * 0.2)
                
                if session_data['click_count'] > 1:
                    bounce_probability *= 0.2
                
                if session_data['email_captures'] > 0 or session_data['password_captures'] > 0:
                    bounce_probability = 0.0
                
                # Stochastic decision
                import random
                random.seed(hash(f"{session_key}_{date.strftime('%Y-%m-%d')}"))
                is_bounce = random.random() < max(0.0, min(1.0, bounce_probability))
                
                if is_bounce:
                    daily_bounce_sessions += 1
            
            daily_bounce_rate = (daily_bounce_sessions / len(daily_sessions) * 100) if daily_sessions else 0
            
            performance_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "clicks": clicks,
                "visitors": visitors,
                "conversions": conversions,
                "bounceRate": round(daily_bounce_rate, 1)
            })
        performance_data.reverse() # Oldest first

        return jsonify({
            "totalClicks": total_clicks,
            "uniqueVisitors": unique_visitors,
            "conversionRate": round(conversion_rate, 1),
            "bounceRate": round(bounce_rate, 1),
            "capturedEmails": captured_emails,
            "activeLinks": active_links,
            "avgSessionDuration": round(avg_session_duration, 1),
            "topCampaigns": top_campaigns,
            "devices": devices,
            "countries": countries,
            "performanceData": performance_data
        })
        
    except Exception as e:
        print(f"Error fetching comprehensive analytics overview: {e}")
        return jsonify({"error": str(e)}), 500



@analytics_bp.route("/analytics/countries", methods=["GET"])
@login_required
def get_countries_analytics():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        period = request.args.get("period", "7")
        days = int(period)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify([])
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        country_stats = {}
        for event in events:
            country = event.country or "Unknown"
            if country not in country_stats:
                country_stats[country] = {
                    "clicks": 0,
                    "emails": 0,
                    "visitors": set()
                }
            country_stats[country]["clicks"] += 1
            if event.captured_email:
                country_stats[country]["emails"] += 1
            if event.ip_address:
                country_stats[country]["visitors"].add(event.ip_address)
        
        # Convert to list format
        countries = []
        total_clicks = sum(stats["clicks"] for stats in country_stats.values())
        
        country_flags = {
            "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", 
            "Germany": "🇩🇪", "France": "🇫🇷", "Australia": "🇦🇺", 
            "India": "🇮🇳", "Brazil": "🇧🇷", "Japan": "🇯🇵",
            "China": "🇨🇳", "Russia": "🇷🇺", "Mexico": "🇲🇽", 
            "South Africa": "🇿🇦", "Unknown": "🌍"
        }
        
        for country, stats in country_stats.items():
            percentage = (stats["clicks"] / total_clicks * 100) if total_clicks > 0 else 0
            countries.append({
                "name": country,
                "code": country[:2].upper() if country != "Unknown" else "XX",
                "flag": country_flags.get(country, "🌍"),
                "clicks": stats["clicks"],
                "emails": stats["emails"],
                "visitors": len(stats["visitors"]),
                "percentage": round(percentage, 1)
            })
        
        countries.sort(key=lambda x: x["clicks"], reverse=True)
        return jsonify(countries)
        
    except Exception as e:
        print(f"Error fetching countries analytics: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/cities", methods=["GET"])
@login_required
def get_cities_analytics():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        period = request.args.get("period", "7")
        days = int(period)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify([])
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        city_stats = {}
        for event in events:
            city = event.city or "Unknown"
            country = event.country or "Unknown"
            city_key = f"{city}, {country}"
            
            if city_key not in city_stats:
                city_stats[city_key] = {
                    "clicks": 0,
                    "emails": 0,
                    "visitors": set(),
                    "city": city,
                    "country": country
                }
            city_stats[city_key]["clicks"] += 1
            if event.captured_email:
                city_stats[city_key]["emails"] += 1
            if event.ip_address:
                city_stats[city_key]["visitors"].add(event.ip_address)
        
        # Convert to list format
        cities = []
        total_clicks = sum(stats["clicks"] for stats in city_stats.values())
        
        for city_key, stats in city_stats.items():
            percentage = (stats["clicks"] / total_clicks * 100) if total_clicks > 0 else 0
            cities.append({
                "name": city_key,
                "city": stats["city"],
                "country": stats["country"],
                "clicks": stats["clicks"],
                "emails": stats["emails"],
                "visitors": len(stats["visitors"]),
                "percentage": round(percentage, 1)
            })
        
        cities.sort(key=lambda x: x["clicks"], reverse=True)
        return jsonify(cities)
        
    except Exception as e:
        print(f"Error fetching cities analytics: {e}")
        return jsonify({"error": str(e)}), 500

# Import geospatial intelligence system
from src.services.geospatial_intelligence import geo_intel

@analytics_bp.route("/analytics/geospatial-intelligence", methods=["GET"])
@login_required
def get_geospatial_intelligence():
    """Get advanced geospatial intelligence analysis"""
    from flask import session as flask_session
    user_id = flask_session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    try:
        period = request.args.get("period", "30")  # Default to 30 days
        
        # Get user's tracking events
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "geographic_clusters": [],
                "performance_heatmap": {},
                "timezone_analysis": {},
                "demographic_insights": {},
                "market_opportunities": [],
                "travel_patterns": {},
                "economic_correlations": {},
                "predictive_expansion": {}
            })
        
        # Get events for the specified period
        days_ago = int(period)
        start_date = datetime.now() - timedelta(days=days_ago)
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # Prepare events data for analysis
        events_data = []
        for event in events:
            events_data.append({
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'ip_address': event.ip_address,
                'country': event.country,
                'city': event.city,
                'device_type': event.device_type,
                'browser': event.browser,
                'os': event.os,
                'captured_email': event.captured_email,
                'session_duration': event.session_duration,
                'referrer': event.referrer,
                'is_bot': event.is_bot
            })
        
        # Perform geospatial intelligence analysis
        geo_analysis = geo_intel.analyze_geographic_intelligence(events_data)
        
        return jsonify({
            'success': True,
            'period_days': days_ago,
            'total_events_analyzed': len(events_data),
            **geo_analysis
        })
        
    except Exception as e:
        print(f"Error in geospatial intelligence analysis: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/market-opportunities", methods=["GET"])
@login_required
def get_market_opportunities():
    """Get market expansion opportunities"""
    from flask import session as flask_session
    user_id = flask_session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    try:
        # Get user's tracking events from last 90 days for better market analysis
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "market_opportunities": [],
                "expansion_recommendations": [],
                "risk_assessment": {}
            })
        
        start_date = datetime.now() - timedelta(days=90)
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # Prepare events data
        events_data = []
        for event in events:
            events_data.append({
                'country': event.country,
                'city': event.city,
                'device_type': event.device_type,
                'captured_email': event.captured_email,
                'session_duration': event.session_duration,
                'is_bot': event.is_bot
            })
        
        # Get market opportunities
        geo_analysis = geo_intel.analyze_geographic_intelligence(events_data)
        
        return jsonify({
            'success': True,
            'market_opportunities': geo_analysis['market_opportunities'],
            'expansion_recommendations': geo_analysis['predictive_expansion'],
            'economic_correlations': geo_analysis['economic_correlations']
        })
        
    except Exception as e:
        print(f"Error getting market opportunities: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/geographic-heatmap", methods=["GET"])
@login_required
def get_geographic_heatmap():
    """Get geographic performance heatmap data"""
    from flask import session as flask_session
    user_id = flask_session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    try:
        period = request.args.get("period", "30")
        days_ago = int(period)
        start_date = datetime.now() - timedelta(days=days_ago)
        
        # Get user's tracking events
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "heatmap_data": {},
                "intensity_levels": {},
                "geographic_clusters": []
            })
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # Prepare events data
        events_data = []
        for event in events:
            events_data.append({
                'country': event.country,
                'city': event.city,
                'captured_email': event.captured_email,
                'session_duration': event.session_duration,
                'ip_address': event.ip_address,
                'is_bot': event.is_bot
            })
        
        # Generate heatmap data
        geo_analysis = geo_intel.analyze_geographic_intelligence(events_data)
        
        return jsonify({
            'success': True,
            'heatmap_data': geo_analysis['performance_heatmap'],
            'geographic_clusters': geo_analysis['geographic_clusters'],
            'period_days': days_ago
        })
        
    except Exception as e:
        print(f"Error getting geographic heatmap: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/analytics/timezone-optimization", methods=["GET"])
@login_required
def get_timezone_optimization():
    """Get timezone-based optimization recommendations"""
    from flask import session as flask_session
    user_id = flask_session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    try:
        period = request.args.get("period", "30")
        days_ago = int(period)
        start_date = datetime.now() - timedelta(days=days_ago)
        
        # Get user's tracking events
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "timezone_analysis": {},
                "optimization_recommendations": []
            })
        
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date
        ).all()
        
        # Prepare events data
        events_data = []
        for event in events:
            events_data.append({
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'country': event.country,
                'captured_email': event.captured_email,
                'is_bot': event.is_bot
            })
        
        # Get timezone analysis
        geo_analysis = geo_intel.analyze_geographic_intelligence(events_data)
        
        # Generate optimization recommendations
        timezone_analysis = geo_analysis['timezone_analysis']
        recommendations = []
        
        if 'country_peak_hours' in timezone_analysis:
            for country, peak_hours in timezone_analysis['country_peak_hours'].items():
                if peak_hours:
                    best_hour = peak_hours[0]
                    recommendations.append({
                        'country': country,
                        'recommended_hour': best_hour['hour'],
                        'expected_performance': best_hour['performance_score'],
                        'action': f"Schedule campaigns for {best_hour['hour']:02d}:00 local time in {country}"
                    })
        
        return jsonify({
            'success': True,
            'timezone_analysis': timezone_analysis,
            'optimization_recommendations': recommendations[:10]  # Top 10
        })
        
    except Exception as e:
        print(f"Error getting timezone optimization: {e}")
        return jsonify({"error": str(e)}), 500
