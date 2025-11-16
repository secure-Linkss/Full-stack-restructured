from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from functools import wraps
import json
import logging

# Assuming TelegramService and TelegramNotifier are in src/services/telegram.py
# If not, they need to be created or imported from the correct location.
# For now, I'll assume they exist or will be created.
from src.services.telegram import TelegramService, TelegramNotifier

logger = logging.getLogger(__name__)

settings_bp = Blueprint("settings", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@settings_bp.route("/api/settings", methods=["GET"])
@login_required
def get_settings():
    """Get user settings"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Default settings
        default_settings = {
            "telegram_enabled": False,
            "telegram_bot_token": "",
            "telegram_chat_id": "",
            "telegram_frequency": "1hr",
            "theme": "dark",
            "notifications": {
                "new_click": True,
                "email_captured": True,
                "bot_detected": True,
                "geo_blocked": True,
                "campaign_summary": True,
                "tracking_links": True,
                "captured_leads": True,
                "security_alerts": True,
                "live_activity": True
            }
        }
        
        # Get user settings from database (if stored)
        user_settings = default_settings
        if user.settings:
            try:
                stored_settings = json.loads(user.settings)
                user_settings.update(stored_settings)
            except json.JSONDecodeError:
                logger.warning(f"User {user.id} has malformed settings JSON. Using defaults.")
                pass # Fallback to default settings if JSON is malformed
        
        return jsonify({
            "success": True,
            "settings": user_settings
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting settings for user {user_id}: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@settings_bp.route("/api/settings", methods=["POST"])
@login_required
def save_settings():
    """Save user settings"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        settings_data = request.get_json()
        if not settings_data:
            return jsonify({"success": False, "error": "No settings data provided"}), 400
        
        # Save settings to user record
        user.settings = json.dumps(settings_data)
        db.session.commit()
        logger.info(f"Settings saved for user {user.id}: {settings_data}")
        
        return jsonify({
            "success": True,
            "message": "Settings saved successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving settings for user {user.id}: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@settings_bp.route("/api/settings/test-telegram", methods=["POST"])
@login_required
def test_telegram():
    """Test Telegram bot connection"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        bot_token = data.get("bot_token")
        chat_id = data.get("chat_id")
        
        if not bot_token or not chat_id:
            return jsonify({"success": False, "error": "Bot token and chat ID are required"}), 400
        
        # Test the connection
        telegram = TelegramService(bot_token, chat_id)
        result = telegram.test_connection()
        
        # If successful, also send a sample notification
        if result.get("success"):
            notifier = TelegramNotifier(db.session) # Pass db.session if needed by Notifier
            sample_data = {
                "name": "Brain Link Tracker Test",
                "total_clicks": 1,
                "click_growth": 100,
                "unique_visitors": 1,
                "captured_emails": 0,
                "top_country": "Test Location",
                "country_flag": "🧪",
                "best_link": "Test Link",
                "opened": 1,
                "redirected": 0,
                "on_page": 0
            }
            notifier.send_notification(bot_token, chat_id, "campaign_summary", sample_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error testing Telegram for user {user_id}: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

# The analytics routes from the merged version are not directly related to settings
# and should ideally be in src/routes/analytics.py. 
# I will assume they are handled there and not duplicate them here.
# If they were intended to be here, they need to be re-evaluated for placement.

# Placeholder for TelegramService and TelegramNotifier if they don't exist yet
# In a real scenario, these would be in src/services/telegram.py
# class TelegramService:
#     def __init__(self, bot_token, chat_id):
#         self.bot_token = bot_token
#         self.chat_id = chat_id
#         self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

#     def test_connection(self):
#         try:
#             response = requests.get(f"{self.base_url}/getMe")
#             response.raise_for_status()
#             data = response.json()
#             if data["ok"]:
#                 return {"success": True, "message": f"Connected to Telegram bot: {data["result"]["first_name"]}"}
#             else:
#                 return {"success": False, "error": data["description"]}
#         except requests.exceptions.RequestException as e:
#             return {"success": False, "error": f"Network or API error: {e}"}

#     def send_message(self, message):
#         try:
#             payload = {"chat_id": self.chat_id, "text": message, "parse_mode": "HTML"}
#             response = requests.post(f"{self.base_url}/sendMessage", json=payload)
#             response.raise_for_status()
#             return response.json()
#         except requests.exceptions.RequestException as e:
#             logger.error(f"Error sending Telegram message: {e}")
#             return {"ok": False, "error": str(e)}

# class TelegramNotifier:
#     def __init__(self, db_session):
#         self.db_session = db_session

#     def send_notification(self, bot_token, chat_id, notification_type, data):
#         # This is a simplified example. Real implementation would format messages based on type.
#         service = TelegramService(bot_token, chat_id)
#         message = f"<b>Brain Link Tracker Notification ({notification_type.replace('_', ' ').title()})</b>\n\n"
#         if notification_type == "campaign_summary":
#             message += f"Campaign: {data.get('name', 'N/A')}\n"
#             message += f"Total Clicks: {data.get('total_clicks', 0)}\n"
#             message += f"Unique Visitors: {data.get('unique_visitors', 0)}\n"
#             message += f"Captured Emails: {data.get('captured_emails', 0)}\n"
#             message += f"Top Country: {data.get('country_flag', '')} {data.get('top_country', 'N/A')}\n"
#         # Add more notification types as needed
#         service.send_message(message)

