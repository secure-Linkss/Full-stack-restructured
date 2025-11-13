from datetime import datetime
from flask import redirect, render_template_string, abort
from api.models.link import Link
def check_link_expiration(link):
    """
    Check if a link has expired and handle accordingly
    Args:
        link: Link model instance
    Returns:
        Response object if expired, None if not expired
    """
    if not link.expires_at:
        return None
    if datetime.utcnow() <= link.expires_at:
        return None
    # Link has expired, handle based on expiration_action
    action = link.expiration_action or 'redirect'
    if action == 'redirect':
        # Redirect to specified URL or default
        redirect_url = link.expiration_redirect_url or 'https://example.com/expired'
        return redirect(redirect_url)
    elif action == 'message':
        # Show expiration message
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Link Expired</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 28px;
                }
                p {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .expired-date {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 20px;
                    font-size: 14px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">⏰</div>
                <h1>Link Expired</h1>
                <p>This tracking link has expired and is no longer active.</p>
                <div class="expired-date">
                    Expired on: {{ expired_date }}
                </div>
            </div>
        </body>
        </html>
        """
        return render_template_string(
            html,
            expired_date=link.expires_at.strftime('%B %d, %Y at %I:%M %p')
        )
    elif action == '404':
        # Return 404 error
        abort(404)
    else:
        # Default to redirect
        return redirect('https://example.com/expired')
def get_expiring_soon_links(user_id, days=7):
    """
    Get links that will expire within the specified number of days
    Args:
        user_id: User ID
        days: Number of days to look ahead
    Returns:
        List of Link objects
    """
    from datetime import timedelta
    threshold = datetime.utcnow() + timedelta(days=days)
    links = Link.query.filter(
        Link.user_id == user_id,
        Link.expires_at.isnot(None),
        Link.expires_at <= threshold,
        Link.expires_at > datetime.utcnow(),
        Link.status == 'active'
    ).all()
    return links
def auto_expire_links():
    """
    Background task to automatically update status of expired links
    Should be run periodically (e.g., via cron job or scheduler)
    """
    from api.database import db
    expired_links = Link.query.filter(
        Link.expires_at.isnot(None),
        Link.expires_at <= datetime.utcnow(),
        Link.status == 'active'
    ).all()
    count = 0
    for link in expired_links:
        link.status = 'expired'
        count += 1
    if count > 0:
        db.session.commit()
        print(f"Auto-expired {count} links")
    return count
