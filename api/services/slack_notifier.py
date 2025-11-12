import requests
import json
from datetime import datetime

class SlackNotifier:
    """Service for sending notifications to Slack"""
    
    @staticmethod
    def send_notification(webhook_url, message, title=None, color='good', fields=None):
        """
        Send a notification to Slack
        
        Args:
            webhook_url: Slack webhook URL
            message: Main message text
            title: Optional title for the message
            color: Color of the message (good, warning, danger, or hex color)
            fields: Optional list of field dicts with 'title' and 'value' keys
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not webhook_url:
            return False
        
        try:
            attachment = {
                'color': color,
                'text': message,
                'footer': 'Brain Link Tracker',
                'ts': int(datetime.utcnow().timestamp())
            }
            
            if title:
                attachment['title'] = title
            
            if fields:
                attachment['fields'] = fields
            
            payload = {
                'attachments': [attachment]
            }
            
            response = requests.post(
                webhook_url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            return response.status_code == 200
        except Exception as e:
            print(f"Error sending Slack notification: {e}")
            return False
    
    @staticmethod
    def send_link_clicked_notification(webhook_url, link_data, visitor_data):
        """Send notification when a link is clicked"""
        fields = [
            {
                'title': 'Campaign',
                'value': link_data.get('campaign_name', 'Unknown'),
                'short': True
            },
            {
                'title': 'Link',
                'value': link_data.get('short_code', 'Unknown'),
                'short': True
            },
            {
                'title': 'Location',
                'value': f"{visitor_data.get('city', 'Unknown')}, {visitor_data.get('country', 'Unknown')}",
                'short': True
            },
            {
                'title': 'Device',
                'value': visitor_data.get('device', 'Unknown'),
                'short': True
            }
        ]
        
        return SlackNotifier.send_notification(
            webhook_url=webhook_url,
            title='🔗 New Link Click',
            message='A tracking link was just clicked!',
            color='good',
            fields=fields
        )
    
    @staticmethod
    def send_conversion_notification(webhook_url, link_data, conversion_data):
        """Send notification when a conversion occurs"""
        fields = [
            {
                'title': 'Campaign',
                'value': link_data.get('campaign_name', 'Unknown'),
                'short': True
            },
            {
                'title': 'Conversion Type',
                'value': conversion_data.get('type', 'Unknown'),
                'short': True
            },
            {
                'title': 'Value',
                'value': conversion_data.get('value', 'N/A'),
                'short': True
            }
        ]
        
        return SlackNotifier.send_notification(
            webhook_url=webhook_url,
            title='🎯 New Conversion',
            message='A conversion has been recorded!',
            color='#36a64f',
            fields=fields
        )
    
    @staticmethod
    def send_threshold_alert(webhook_url, alert_type, threshold, current_value):
        """Send alert when a threshold is reached"""
        return SlackNotifier.send_notification(
            webhook_url=webhook_url,
            title=f'⚠️ {alert_type} Alert',
            message=f'Threshold of {threshold} has been reached. Current value: {current_value}',
            color='warning'
        )
    
    @staticmethod
    def send_daily_summary(webhook_url, summary_data):
        """Send daily summary notification"""
        fields = [
            {
                'title': 'Total Clicks',
                'value': str(summary_data.get('total_clicks', 0)),
                'short': True
            },
            {
                'title': 'Real Visitors',
                'value': str(summary_data.get('real_visitors', 0)),
                'short': True
            },
            {
                'title': 'Conversions',
                'value': str(summary_data.get('conversions', 0)),
                'short': True
            },
            {
                'title': 'Bots Blocked',
                'value': str(summary_data.get('bots_blocked', 0)),
                'short': True
            }
        ]
        
        return SlackNotifier.send_notification(
            webhook_url=webhook_url,
            title='📊 Daily Summary',
            message='Here\'s your daily tracking summary',
            color='#4A90E2',
            fields=fields
        )