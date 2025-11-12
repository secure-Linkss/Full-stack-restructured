from flask import Blueprint, request, jsonify, session, g
from src.models.campaign import Campaign
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.database import db
from src.models.user import User
from src.services.campaign_intelligence import campaign_intel
from sqlalchemy import func
from functools import wraps
from datetime import datetime, timedelta

campaigns_bp = Blueprint('campaigns', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated_function

@campaigns_bp.route('/api/campaigns', methods=['GET'])
@login_required
def get_campaigns():
    """Get all campaigns for current user, including aggregated stats"""
    user_id = session.get('user_id')
    
    try:
        # Get all unique campaign names associated with the user's links
        campaign_names = db.session.query(Link.campaign_name).filter(
            Link.user_id == user_id,
            Link.campaign_name.isnot(None),
            Link.campaign_name != ''
        ).distinct().all()
        
        campaigns_data = []
        for (campaign_name,) in campaign_names:
            # Get links belonging to this campaign
            campaign_links = Link.query.filter_by(user_id=user_id, campaign_name=campaign_name).all()
            link_ids = [link.id for link in campaign_links]
            
            total_clicks = 0
            real_visitors = 0
            captured_emails = 0
            
            if link_ids:
                # Aggregate stats for all links in the campaign
                campaign_events = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).all()
                total_clicks = len(campaign_events)
                real_visitors = len(set(event.ip_address for event in campaign_events if not event.is_bot))
                captured_emails = len([e for e in campaign_events if e.captured_email])
            
            conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0
            
            campaigns_data.append({
                'name': campaign_name,
                'link_count': len(campaign_links),
                'total_clicks': total_clicks,
                'real_visitors': real_visitors,
                'captured_emails': captured_emails,
                'conversion_rate': round(conversion_rate, 2),
                'status': 'active' # Assuming campaign is active if it has links
            })
        
        return jsonify(campaigns_data), 200

    except Exception as e:
        print(f"Error fetching campaigns: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/api/campaigns', methods=['POST'])
@login_required
def create_campaign():
    """Create new campaign (by associating a name with a new or existing link) or update existing"""
    user_id = session.get('user_id')
    data = request.get_json()

    name = data.get('name', '').strip()
    link_id = data.get('link_id', type=int) # Optional: associate with an existing link

    if not name:
        return jsonify({'error': 'Campaign name required'}), 400

    try:
        # Check if a campaign with this name already exists for the user
        existing_campaign_link = Link.query.filter_by(user_id=user_id, campaign_name=name).first()
        if existing_campaign_link:
            return jsonify({'error': 'Campaign with this name already exists'}), 400

        if link_id:
            # Associate an existing link with this new campaign name
            link = Link.query.filter_by(id=link_id, user_id=user_id).first()
            if not link:
                return jsonify({'error': 'Link not found or does not belong to user'}), 404
            link.campaign_name = name
            db.session.commit()
            return jsonify({'message': f'Link {link.short_code} associated with new campaign {name}', 'campaign': {'name': name, 'link_count': 1}}), 201
        else:
            # Create a placeholder link to represent the campaign, or just create the campaign entry if a Campaign model exists
            # For now, we'll create a dummy link to establish the campaign name
            new_link = Link(
                user_id=user_id,
                target_url="https://example.com/placeholder", # Placeholder URL
                campaign_name=name,
                status='inactive', # Mark as inactive placeholder
                short_code=Link.generate_short_code() # Generate a short code for the placeholder
            )
            db.session.add(new_link)
            db.session.commit()
            return jsonify({'message': f'Campaign {name} created with a placeholder link', 'campaign': {'name': name, 'link_count': 0}}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating campaign: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/api/campaigns/<string:campaign_name>', methods=['GET'])
@login_required
def get_campaign_details(campaign_name):
    """Get details for a specific campaign"""
    user_id = session.get('user_id')
    try:
        # Get all links belonging to this campaign for the user
        campaign_links = Link.query.filter_by(user_id=user_id, campaign_name=campaign_name).all()
        if not campaign_links:
            return jsonify({'error': 'Campaign not found or does not belong to user'}), 404

        link_ids = [link.id for link in campaign_links]
        total_clicks = 0
        real_visitors = 0
        captured_emails = 0
        
        if link_ids:
            campaign_events = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).all()
            total_clicks = len(campaign_events)
            real_visitors = len(set(event.ip_address for event in campaign_events if not event.is_bot))
            captured_emails = len([e for e in campaign_events if e.captured_email])

        conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0

        links_data = [{
            'id': link.id,
            'short_code': link.short_code,
            'target_url': link.target_url,
            'status': link.status,
            'created_at': link.created_at.isoformat() if link.created_at else None
        } for link in campaign_links]

        return jsonify({
            'name': campaign_name,
            'link_count': len(campaign_links),
            'total_clicks': total_clicks,
            'real_visitors': real_visitors,
            'captured_emails': captured_emails,
            'conversion_rate': round(conversion_rate, 2),
            'links': links_data
        }), 200

    except Exception as e:
        print(f"Error fetching campaign details: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/api/campaigns/<string:campaign_name>', methods=['PATCH'])
@login_required
def update_campaign(campaign_name):
    """Update campaign name"""
    user_id = session.get('user_id')
    data = request.get_json()

    new_name = data.get('new_name', '').strip()
    if not new_name:
        return jsonify({'error': 'New campaign name required'}), 400

    try:
        # Check if the new name already exists for another campaign by this user
        existing_new_campaign = Link.query.filter_by(user_id=user_id, campaign_name=new_name).first()
        if existing_new_campaign:
            return jsonify({'error': 'Campaign with this new name already exists'}), 400

        # Find all links associated with the old campaign name and update them
        links_to_update = Link.query.filter_by(user_id=user_id, campaign_name=campaign_name).all()
        if not links_to_update:
            return jsonify({'error': 'Campaign not found or does not belong to user'}), 404

        for link in links_to_update:
            link.campaign_name = new_name
        db.session.commit()

        return jsonify({'message': f'Campaign {campaign_name} renamed to {new_name}'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating campaign: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/api/campaigns/<string:campaign_name>', methods=['DELETE'])
@login_required
def delete_campaign(campaign_name):
    """Delete campaign and all associated links and tracking events"""
    user_id = session.get('user_id')
    try:
        # Find all links associated with this campaign
        links_to_delete = Link.query.filter_by(user_id=user_id, campaign_name=campaign_name).all()
        
        if not links_to_delete:
            return jsonify({'error': 'Campaign not found or does not belong to user'}), 404
        
        # Delete associated tracking events first
        for link in links_to_delete:
            TrackingEvent.query.filter_by(link_id=link.id).delete()
        
        # Delete the links themselves
        for link in links_to_delete:
            db.session.delete(link)
        
        db.session.commit()
        
        return jsonify({'message': f'Campaign {campaign_name} and all associated links/events deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting campaign: {e}")
        return jsonify({'error': str(e)}), 500


@campaigns_bp.route("/api/campaigns/intelligence/<string:campaign_name>", methods=["GET"])
@login_required
def get_campaign_intelligence(campaign_name):
    """Get advanced campaign intelligence analysis"""
    try:
        # Get campaign links
        links = Link.query.filter_by(campaign_name=campaign_name, user_id=g.user.id).all()
        if not links:
            return jsonify({"error": "Campaign not found"}), 404
        
        # Collect all events for this campaign
        events_data = []
        total_clicks = 0
        total_conversions = 0
        unique_visitors = set()
        
        for link in links:
            link_events = TrackingEvent.query.filter_by(link_id=link.id).all()
            for event in link_events:
                total_clicks += 1
                if event.captured_email:
                    total_conversions += 1
                if event.ip_address:
                    unique_visitors.add(event.ip_address)
                
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
                    'referrer': event.referrer
                })
        
        # Prepare campaign data for analysis
        campaign_data = {
            'campaign_name': campaign_name,
            'metrics': {
                'clicks': total_clicks,
                'conversions': total_conversions,
                'unique_visitors': len(unique_visitors),
                'impressions': total_clicks * 1.2  # Estimated impressions
            },
            'events': events_data
        }
        
        # Perform advanced analysis
        intelligence_analysis = campaign_intel.analyze_campaign_performance(campaign_data)
        
        return jsonify({
            'success': True,
            'campaign_intelligence': intelligence_analysis,
            'campaign_summary': {
                'name': campaign_name,
                'total_clicks': total_clicks,
                'total_conversions': total_conversions,
                'conversion_rate': (total_conversions / total_clicks * 100) if total_clicks > 0 else 0,
                'unique_visitors': len(unique_visitors)
            }
        })
        
    except Exception as e:
        print(f"Error getting campaign intelligence: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route("/api/campaigns/optimization-recommendations", methods=["GET"])
@login_required
def get_optimization_recommendations():
    """Get optimization recommendations for all campaigns"""
    try:
        # Get all unique campaign names for the user
        campaign_names = db.session.query(Link.campaign_name).filter(
            Link.user_id == g.user.id,
            Link.campaign_name.isnot(None),
            Link.campaign_name != ''
        ).distinct().all()
        
        recommendations = []
        
        for (campaign_name,) in campaign_names:
            # Get campaign performance data
            links = Link.query.filter_by(campaign_name=campaign_name, user_id=g.user.id).all()
            
            events_data = []
            total_clicks = 0
            total_conversions = 0
            
            for link in links:
                link_events = TrackingEvent.query.filter_by(link_id=link.id).all()
                for event in link_events:
                    total_clicks += 1
                    if event.captured_email:
                        total_conversions += 1
                    
                    events_data.append({
                        'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                        'country': event.country,
                        'device_type': event.device_type,
                        'browser': event.browser,
                        'captured_email': event.captured_email,
                        'session_duration': event.session_duration,
                        'ip_address': event.ip_address
                    })
            
            if total_clicks >= 10:  # Only analyze campaigns with sufficient data
                campaign_data = {
                    'campaign_name': campaign_name,
                    'metrics': {
                        'clicks': total_clicks,
                        'conversions': total_conversions,
                        'unique_visitors': len(set(e.get('ip_address', '') for e in events_data if e.get('ip_address')))
                    },
                    'events': events_data
                }
                
                # Get optimization opportunities
                analysis = campaign_intel.analyze_campaign_performance(campaign_data)
                
                if analysis['optimization_opportunities']:
                    recommendations.append({
                        'campaign_name': campaign_name,
                        'performance_score': analysis['performance_score'],
                        'opportunities': analysis['optimization_opportunities'][:3],  # Top 3
                        'ab_test_recommendations': analysis['ab_test_recommendations'][:2]  # Top 2
                    })
        
        # Sort by performance score (lowest first - most need optimization)
        recommendations.sort(key=lambda x: x['performance_score'])
        
        return jsonify({
            'success': True,
            'recommendations': recommendations[:10]  # Top 10 campaigns needing optimization
        })
        
    except Exception as e:
        print(f"Error getting optimization recommendations: {e}")
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route("/api/campaigns/performance-predictions", methods=["GET"])
@login_required
def get_performance_predictions():
    """Get performance predictions for all campaigns"""
    try:
        # Get all unique campaign names for the user
        campaign_names = db.session.query(Link.campaign_name).filter(
            Link.user_id == g.user.id,
            Link.campaign_name.isnot(None),
            Link.campaign_name != ''
        ).distinct().all()
        
        predictions = []
        
        for (campaign_name,) in campaign_names:
            # Get recent campaign data (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            links = Link.query.filter_by(campaign_name=campaign_name, user_id=g.user.id).all()
            
            events_data = []
            total_clicks = 0
            total_conversions = 0
            
            for link in links:
                link_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id == link.id,
                    TrackingEvent.timestamp >= thirty_days_ago
                ).all()
                
                for event in link_events:
                    total_clicks += 1
                    if event.captured_email:
                        total_conversions += 1
                    
                    events_data.append({
                        'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                        'country': event.country,
                        'device_type': event.device_type,
                        'captured_email': event.captured_email,
                        'ip_address': event.ip_address
                    })
            
            if total_clicks >= 20:  # Need sufficient data for predictions
                campaign_data = {
                    'campaign_name': campaign_name,
                    'metrics': {
                        'clicks': total_clicks,
                        'conversions': total_conversions,
                        'unique_visitors': len(set(e.get('ip_address', '') for e in events_data if e.get('ip_address')))
                    },
                    'events': events_data
                }
                
                # Get predictions
                analysis = campaign_intel.analyze_campaign_performance(campaign_data)
                
                predictions.append({
                    'campaign_name': campaign_name,
                    'current_performance': {
                        'clicks': total_clicks,
                        'conversions': total_conversions,
                        'conversion_rate': (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
                    },
                    'predictions': analysis['predictive_metrics'],
                    'risk_assessment': analysis['risk_assessment']
                })
        
        return jsonify({
            'success': True,
            'predictions': predictions
        })
        
    except Exception as e:
        print(f"Error getting performance predictions: {e}")
        return jsonify({'error': str(e)}), 500

def auto_create_campaign(campaign_name, user_id):
    """
    Auto-create a campaign if it doesn't exist.
    Returns the campaign object (existing or newly created).
    """
    from src.models.campaign import Campaign
    from src.database import db
    
    # Check if campaign exists for this user
    existing_campaign = Campaign.query.filter_by(
        name=campaign_name,
        user_id=user_id
    ).first()
    
    if existing_campaign:
        return existing_campaign
    
    # Create new campaign
    new_campaign = Campaign(
        name=campaign_name,
        user_id=user_id,
        status='active',
        description=f'Auto-created campaign for {campaign_name}'
    )
    
    db.session.add(new_campaign)
    db.session.commit()
    
    return new_campaign