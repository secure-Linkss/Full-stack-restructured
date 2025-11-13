from flask import Blueprint, request, jsonify, session
from api.models.ab_test import ABTest, ABTestVariant
from api.models.link import Link
from api.models.user import User
from api.database import db
from functools import wraps
import random
ab_tests_bp = Blueprint('ab_tests', __name__)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = User.verify_token(token)
            if user:
                session['user_id'] = user.id
                return f(*args, **kwargs)
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function
@ab_tests_bp.route('/ab-tests', methods=['GET'])
@login_required
def get_ab_tests():
    """Get all A/B tests for current user"""
    try:
        user_id = session.get('user_id')
        link_id = request.args.get('link_id', type=int)
        query = ABTest.query.filter_by(user_id=user_id)
        if link_id:
            query = query.filter_by(link_id=link_id)
        tests = query.order_by(ABTest.created_at.desc()).all()
        return jsonify({
            'success': True,
            'ab_tests': [test.to_dict() for test in tests]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests', methods=['POST'])
@login_required
def create_ab_test():
    """Create new A/B test"""
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        link_id = data.get('link_id')
        name = data.get('name')
        variants = data.get('variants', [])
        if not link_id or not name or len(variants) < 2:
            return jsonify({'error': 'Link ID, name, and at least 2 variants required'}), 400
        # Verify link ownership
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({'error': 'Link not found'}), 404
        # Validate traffic percentages sum to 100
        total_percentage = sum(v.get('traffic_percentage', 0) for v in variants)
        if total_percentage != 100:
            return jsonify({'error': 'Traffic percentages must sum to 100'}), 400
        # Create A/B test
        ab_test = ABTest(
            link_id=link_id,
            user_id=user_id,
            name=name,
            status='active'
        )
        db.session.add(ab_test)
        db.session.flush()
        # Create variants
        for variant_data in variants:
            variant = ABTestVariant(
                ab_test_id=ab_test.id,
                name=variant_data.get('name'),
                target_url=variant_data.get('target_url'),
                traffic_percentage=variant_data.get('traffic_percentage', 50)
            )
            db.session.add(variant)
        # Update link
        link.ab_test_enabled = True
        link.ab_test_id = ab_test.id
        db.session.commit()
        return jsonify({
            'success': True,
            'ab_test': ab_test.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests/<int:test_id>', methods=['GET'])
@login_required
def get_ab_test(test_id):
    """Get specific A/B test"""
    try:
        user_id = session.get('user_id')
        ab_test = ABTest.query.filter_by(id=test_id, user_id=user_id).first()
        if not ab_test:
            return jsonify({'error': 'A/B test not found'}), 404
        return jsonify({
            'success': True,
            'ab_test': ab_test.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests/<int:test_id>', methods=['PATCH'])
@login_required
def update_ab_test(test_id):
    """Update A/B test"""
    try:
        user_id = session.get('user_id')
        ab_test = ABTest.query.filter_by(id=test_id, user_id=user_id).first()
        if not ab_test:
            return jsonify({'error': 'A/B test not found'}), 404
        data = request.get_json()
        if 'name' in data:
            ab_test.name = data['name']
        if 'status' in data:
            ab_test.status = data['status']
        db.session.commit()
        return jsonify({
            'success': True,
            'ab_test': ab_test.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests/<int:test_id>', methods=['DELETE'])
@login_required
def delete_ab_test(test_id):
    """Delete A/B test"""
    try:
        user_id = session.get('user_id')
        ab_test = ABTest.query.filter_by(id=test_id, user_id=user_id).first()
        if not ab_test:
            return jsonify({'error': 'A/B test not found'}), 404
        # Update associated link
        link = Link.query.get(ab_test.link_id)
        if link:
            link.ab_test_enabled = False
            link.ab_test_id = None
        db.session.delete(ab_test)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'A/B test deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests/<int:test_id>/select-variant', methods=['POST'])
@login_required
def select_variant(test_id):
    """Select variant based on traffic distribution"""
    try:
        ab_test = ABTest.query.get(test_id)
        if not ab_test or ab_test.status != 'active':
            return jsonify({'error': 'A/B test not found or inactive'}), 404
        variants = ab_test.variants
        if not variants:
            return jsonify({'error': 'No variants found'}), 404
        # Select variant based on traffic percentage
        rand = random.randint(1, 100)
        cumulative = 0
        selected_variant = None
        for variant in variants:
            cumulative += variant.traffic_percentage
            if rand <= cumulative:
                selected_variant = variant
                break
        if not selected_variant:
            selected_variant = variants[0]
        # Increment click count
        selected_variant.clicks += 1
        db.session.commit()
        return jsonify({
            'success': True,
            'variant': selected_variant.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@ab_tests_bp.route('/ab-tests/<int:test_id>/variants/<int:variant_id>/conversion', methods=['POST'])
@login_required
def record_conversion(test_id, variant_id):
    """Record a conversion for a variant"""
    try:
        variant = ABTestVariant.query.filter_by(id=variant_id, ab_test_id=test_id).first()
        if not variant:
            return jsonify({'error': 'Variant not found'}), 404
        variant.conversions += 1
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Conversion recorded'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
