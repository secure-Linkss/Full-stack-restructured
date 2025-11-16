"""
FIXED ANALYTICS ROUTES
======================
This file fixes the 500 error in /api/analytics/dashboard
Ensures proper admin vs user data separation
"""

from flask import Blueprint, request, jsonify, session
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.campaign import Campaign
from src.models.user import User, db
from sqlalchemy import func, desc, extract
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
        period = request.args.get("period", "7d")  # Default to 7 days
        
        # Extract days from period (e.g., "7d" -> 7)
        if period.endswith('d'):
            days = int(period[:-1])
        else:
            days = int(period)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # CRITICAL FIX: Get ONLY user's own links (not admin query for all users)
        # Admin users should see their own personal tracking data in non-admin tabs
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            # Return empty analytics if no links
            return jsonify({
                "totalLinks": 0,
                "totalClicks": 0,
                "realVisitors": 0,
                "capturedEmails": 0,
                "activeLinks": 0,
                "conversionRate": 0,
                "performanceOverTime": [],
                "deviceBreakdown": {
                    "desktop": 0,
                    "mobile": 0,
                    "tablet": 0
                },
                "topCountries": [],
                "campaignPerformance": [],
                "recentCaptures": []
            })
        
        # Get tracking events for the period
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.timestamp <= end_date
        ).all()
        
        # Calculate basic metrics
        total_links = len(user_links)
        total_clicks = len(events)
        real_visitors = len(set(event.ip_address for event in events if event.ip_address))
        captured_emails = len([e for e in events if e.captured_email])
        active_links = len([link for link in user_links if link.status == "active"])
        conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0
        
        # Performance over time (last 7 days)
        performance_data = []
        for i in range(days):
            date = end_date - timedelta(days=days - i - 1)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_events = [e for e in events if day_start <= e.timestamp < day_end]
            
            clicks_count = len(day_events)
            visitors_count = len(set(e.ip_address for e in day_events if e.ip_address))
            emails_count = len([e for e in day_events if e.captured_email])
            
            performance_data.append({
                "date": date.strftime("%b %d"),
                "clicks": clicks_count,
                "visitors": visitors_count,
                "emailCaptures": emails_count
            })
        
        # Device breakdown
        device_stats = {"Desktop": 0, "Mobile": 0, "Tablet": 0, "Unknown": 0}
        for event in events:
            device = event.device_type or "Unknown"
            if device in device_stats:
                device_stats[device] += 1
            else:
                device_stats["Unknown"] += 1
        
        total_device_events = sum(device_stats.values())
        device_breakdown = {
            "desktop": (device_stats["Desktop"] / total_device_events * 100) if total_device_events > 0 else 0,
            "mobile": (device_stats["Mobile"] / total_device_events * 100) if total_device_events > 0 else 0,
            "tablet": (device_stats["Tablet"] / total_device_events * 100) if total_device_events > 0 else 0
        }
        
        # Top countries
        country_stats = {}
        for event in events:
            country = event.country or "Unknown"
            if country not in country_stats:
                country_stats[country] = {"clicks": 0, "emails": 0}
            country_stats[country]["clicks"] += 1
            if event.captured_email:
                country_stats[country]["emails"] += 1
        
        # Country flags mapping
        country_flags = {
            "United States": "🇺🇸",
            "United Kingdom": "🇬🇧",
            "Canada": "🇨🇦",
            "Germany": "🇩🇪",
            "France": "🇫🇷",
            "Australia": "🇦🇺",
            "India": "🇮🇳",
            "Unknown": "🌍"
        }
        
        top_countries = []
        for country, stats in sorted(country_stats.items(), key=lambda x: x[1]["clicks"], reverse=True)[:5]:
            percentage = (stats["clicks"] / total_clicks * 100) if total_clicks > 0 else 0
            top_countries.append({
                "country": country,
                "flag": country_flags.get(country, "🌍"),
                "clicks": stats["clicks"],
                "percentage": round(percentage, 1)
            })
        
        # Campaign performance
        campaign_performance = []
        for link in user_links:
            link_events = [e for e in events if e.link_id == link.id]
            link_clicks = len(link_events)
            link_emails = len([e for e in link_events if e.captured_email])
            link_conversion = (link_emails / link_clicks * 100) if link_clicks > 0 else 0
            
            # Determine status
            if link_clicks > 0:
                status = "active"
            else:
                status = "idle"
            
            campaign_performance.append({
                "id": f"puWiWWY3",
                "name": link.campaign_name or f"Campaign {link.short_code}",
                "clicks": link_clicks,
                "emails": link_emails,
                "conversion": f"{link_conversion:.1f}%",
                "status": status
            })
        
        # Sort by clicks
        campaign_performance.sort(key=lambda x: x["clicks"], reverse=True)
        
        # Recent email captures
        recent_captures = []
        email_events = [e for e in events if e.captured_email]
        email_events.sort(key=lambda x: x.timestamp, reverse=True)
        
        for event in email_events[:5]:
            link = next((l for l in user_links if l.id == event.link_id), None)
            recent_captures.append({
                "email": event.captured_email,
                "campaign": link.campaign_name if link else "Unknown",
                "country": event.country or "Unknown",
                "time": _format_time_ago(event.timestamp) if event.timestamp else "Unknown"
            })
        
        return jsonify({
            "totalLinks": total_links,
            "totalClicks": total_clicks,
            "realVisitors": real_visitors,
            "capturedEmails": captured_emails,
            "activeLinks": active_links,
            "conversionRate": round(conversion_rate, 1),
            "performanceOverTime": performance_data,
            "deviceBreakdown": device_breakdown,
            "topCountries": top_countries,
            "campaignPerformance": campaign_performance,
            "recentCaptures": recent_captures
        })
        
    except Exception as e:
        print(f"Error fetching dashboard analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500

def _format_time_ago(timestamp):
    """Format timestamp as 'X minutes/hours ago'"""
    if not timestamp:
        return "Unknown"
    
    now = datetime.now()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} min{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"

@analytics_bp.route("/analytics/realtime", methods=["GET"])
@login_required
def get_realtime_analytics():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        # Get user's OWN links only (admin sees their own data here)
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
        visitors_online = len(set(event.ip_address for event in recent_events if event.ip_address))
        
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
        import traceback
        traceback.print_exc()
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
        
        # Get user's OWN links only
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
            visitors = len(set(event.ip_address for event in day_events if event.ip_address))
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
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch performance data"}), 500

@analytics_bp.route("/analytics/summary", methods=["GET"])
@login_required
def get_analytics_summary():
    user_id = session.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        # Get user's OWN links only
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "totalClicks": 0,
                "realVisitors": 0,
                "botsBlocked": 0
            })
        
        # Get all events for user's links
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids)
        ).all()
        
        total_clicks = len(events)
        real_visitors = len(set(event.ip_address for event in events if event.ip_address))
        bots_blocked = len([e for e in events if e.is_bot or e.status == "blocked"])
        
        return jsonify({
            "totalClicks": total_clicks,
            "realVisitors": real_visitors,
            "botsBlocked": bots_blocked
        })
        
    except Exception as e:
        print(f"Error fetching analytics summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
