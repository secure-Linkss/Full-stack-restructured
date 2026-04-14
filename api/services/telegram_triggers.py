"""
Telegram notification triggers — call these from tracking, payment, and domain events.
"""
import logging
from api.models.user import User

logger = logging.getLogger(__name__)


def _get_telegram_service(user_id):
    """Get a TelegramService for a user if they have it enabled."""
    try:
        user = User.query.get(user_id)
        if not user or not user.telegram_enabled:
            return None
        if not user.telegram_bot_token or not user.telegram_chat_id:
            return None
        from api.services.telegram import TelegramService
        return TelegramService(user.telegram_bot_token, user.telegram_chat_id)
    except Exception as e:
        logger.error(f"Telegram service init error: {e}")
        return None


def notify_new_click(user_id, link, event):
    """Send Telegram alert when a new click is tracked."""
    svc = _get_telegram_service(user_id)
    if not svc:
        return
    try:
        msg = (
            "🔗 <b>New Click Detected</b>\n\n"
            f"📎 <b>Link:</b> {link.campaign_name or link.short_code}\n"
            f"🌍 <b>Location:</b> {event.city or 'Unknown'}, {event.country or 'Unknown'}\n"
            f"💻 <b>Device:</b> {event.device_type or 'Unknown'} — {event.browser or 'Unknown'}\n"
            f"📊 <b>Status:</b> {event.status or 'redirected'}\n"
            f"🤖 <b>Bot:</b> {'Yes' if event.is_bot else 'No'}\n"
            f"📈 <b>Total clicks:</b> {link.total_clicks}"
        )
        svc.send_message(msg)
    except Exception as e:
        logger.error(f"Telegram click notification error: {e}")


def notify_email_captured(user_id, link, email):
    """Send Telegram alert when an email is captured."""
    svc = _get_telegram_service(user_id)
    if not svc:
        return
    try:
        msg = (
            "📧 <b>Email Captured!</b>\n\n"
            f"📎 <b>Link:</b> {link.campaign_name or link.short_code}\n"
            f"✉️ <b>Email:</b> {email}\n"
            f"📈 <b>Total clicks:</b> {link.total_clicks}"
        )
        svc.send_message(msg)
    except Exception as e:
        logger.error(f"Telegram email capture notification error: {e}")


def notify_payment_confirmed(user_id, plan_type, payment_type):
    """Send Telegram alert for payment confirmation."""
    svc = _get_telegram_service(user_id)
    if not svc:
        return
    try:
        msg = (
            "💳 <b>Payment Confirmed!</b>\n\n"
            f"📋 <b>Plan:</b> {plan_type.title()}\n"
            f"💰 <b>Method:</b> {payment_type.title()}\n"
            "✅ Your subscription is now active."
        )
        svc.send_message(msg)
    except Exception as e:
        logger.error(f"Telegram payment notification error: {e}")


def notify_domain_verified(user_id, domain_name):
    """Send Telegram alert when a domain is verified."""
    svc = _get_telegram_service(user_id)
    if not svc:
        return
    try:
        msg = (
            "🌐 <b>Domain Verified!</b>\n\n"
            f"🔗 <b>Domain:</b> {domain_name}\n"
            "✅ Your custom domain is now active and ready to use."
        )
        svc.send_message(msg)
    except Exception as e:
        logger.error(f"Telegram domain notification error: {e}")


def notify_security_alert(user_id, alert_type, details):
    """Send Telegram alert for security events."""
    svc = _get_telegram_service(user_id)
    if not svc:
        return
    try:
        msg = (
            "🚨 <b>Security Alert</b>\n\n"
            f"⚠️ <b>Type:</b> {alert_type}\n"
            f"📋 <b>Details:</b> {details}"
        )
        svc.send_message(msg)
    except Exception as e:
        logger.error(f"Telegram security notification error: {e}")
