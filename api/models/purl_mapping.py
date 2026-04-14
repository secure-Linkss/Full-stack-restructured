from api.database import db
from datetime import datetime
import uuid


class PurlMapping(db.Model):
    """Personalized URL mapping — one unique short link per recipient."""
    __tablename__ = 'purl_mappings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id', ondelete='CASCADE'), nullable=False)

    # Recipient info
    name = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(255), nullable=False)

    # Unique personal code appended to tracking URL
    unique_code = db.Column(db.String(32), unique=True, nullable=False)

    # Click tracking
    clicked = db.Column(db.Boolean, default=False)
    clicked_at = db.Column(db.DateTime, nullable=True)
    click_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_id, link_id, email, name=None):
        self.user_id = user_id
        self.link_id = link_id
        self.email = email
        self.name = name
        self.unique_code = uuid.uuid4().hex[:16]

    def to_dict(self, base_url=''):
        from api.models.link import Link
        link = Link.query.get(self.link_id)
        short_code = link.short_code if link else ''
        purl = f"{base_url}/t/{short_code}?email={self.email}&purl={self.unique_code}"
        return {
            'id': self.id,
            'link_id': self.link_id,
            'name': self.name,
            'email': self.email,
            'unique_code': self.unique_code,
            'purl': purl,
            'clicked': self.clicked,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None,
            'click_count': self.click_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
