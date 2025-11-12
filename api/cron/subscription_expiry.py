# Subscription_expiry_cron.py

"""
Subscription Expiry Automation
Create a cron job or scheduled task to run this script daily
"""

from datetime import datetime, timedelta
from src.database import db
from src.models.user import User
from src.models.notification import Notification
# NOTE: Link model is assumed to be imported or defined elsewhere for check_link_expiry to work.
# For this snippet, we'll assume 'Link' is available or replace with a placeholder if needed.
# Since the original snippet uses 'db.session.query(Link)', we'll assume 'Link' is a valid model.
try:
    from src.models.link import Link
except ImportError:
    # Placeholder for Link model if not available in the context
    class Link:
        def __init__(self):
            pass
        short_code = "placeholder"
        is_active = True
        expires_at = datetime.utcnow() + timedelta(days=1)
        
    # This is just to make the code runnable for consolidation, actual implementation needs the real model.
    pass


def check_subscription_expiry():
    """Check and update expired subscriptions"""
    try:
        now = datetime.utcnow()
        
        # Find users with expired subscriptions
        expired_users = User.query.filter(
            User.subscription_expiry <= now,
            User.status == 'active',
            User.plan_type != 'free'
        ).all()
        
        for user in expired_users:
            print(f"Expiring subscription for user: {user.username}")
            
            # Update user status
            user.status = 'expired'
            user.subscription_status = 'expired'
            user.plan_type = 'free'
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                title="Subscription Expired",
                message="Your subscription has expired. Please renew to continue using premium features.",
                type="warning",
                priority="high"
            )
            db.session.add(notification)
        
        db.session.commit()
        print(f"Processed {len(expired_users)} expired subscriptions")
        
        # Find users with subscriptions expiring soon (7 days)
        warning_date = now + timedelta(days=7)
        expiring_soon = User.query.filter(
            User.subscription_expiry <= warning_date,
            User.subscription_expiry > now,
            User.status == 'active',
            User.plan_type != 'free'
        ).all()
        
        for user in expiring_soon:
            # Check if we already sent a warning
            existing_warning = Notification.query.filter(
                Notification.user_id == user.id,
                Notification.title == "Subscription Expiring Soon",
                Notification.created_at >= now - timedelta(days=1)
            ).first()
            
            if not existing_warning:
                days_left = (user.subscription_expiry - now).days
                notification = Notification(
                    user_id=user.id,
                    title="Subscription Expiring Soon",
                    message=f"Your subscription will expire in {days_left} days. Please renew to avoid service interruption.",
                    type="warning",
                    priority="medium"
                )
                db.session.add(notification)
        
        db.session.commit()
        print(f"Sent warnings to {len(expiring_soon)} users")
        
    except Exception as e:
        print(f"Error checking subscription expiry: {e}")
        db.session.rollback()

def check_link_expiry():
    """Check and deactivate expired links"""
    try:
        now = datetime.utcnow()
        
        # Find expired links that are still active
        expired_links = db.session.query(Link).filter(
            Link.expires_at <= now,
            Link.is_active == True
        ).all()
        
        for link in expired_links:
            link.is_active = False
            print(f"Deactivated expired link: {link.short_code}")
        
        db.session.commit()
        print(f"Deactivated {len(expired_links)} expired links")
        
    except Exception as e:
        print(f"Error checking link expiry: {e}")
        db.session.rollback()

if __name__ == "__main__":
    # Run both checks
    print("Starting expiry checks...")
    check_subscription_expiry()
    check_link_expiry()
    print("Expiry checks completed")

# Setup cron job (Linux):
# crontab -e
# Add: 0 0 * * * cd /path/to/project && python -m src.utils.expiry_check

# Or use APScheduler for in-app scheduling:
"""
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(check_subscription_expiry, 'cron', hour=0, minute=0)
scheduler.add_job(check_link_expiry, 'cron', hour='*/1')  # Every hour
scheduler.start()
"""