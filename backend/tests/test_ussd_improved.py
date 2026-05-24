import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app import db, bcrypt
from app.models import User, Parent, Adolescent, CycleLog, Notification
from app.ussd.session import normalize_phone, mark_session_authenticated, is_session_authenticated, find_user_by_phone, to_stored_phone


@pytest.fixture
def app():
    """Minimal Flask app for USSD tests (avoids production DB/pool config)."""
    from flask import Flask
    from app.ussd.handlers import ussd_bp

    application = Flask(__name__)
    application.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret',
        'JWT_SECRET_KEY': 'test-jwt',
    })

    db.init_app(application)
    bcrypt.init_app(application)
    application.register_blueprint(ussd_bp, url_prefix='/api/ussd')

    with application.app_context():
        from app.models import (  # noqa: F401
            User, Parent, Adolescent, ParentChild, CycleLog, MealLog,
            Appointment, HealthProvider, ContentCategory, ContentItem,
        )
        from app.models.notification import Notification  # noqa: F401
        from app.ussd.ussd_models import USSDSession, USSDTransaction  # noqa: F401
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _ussd_post(client, phone, text='', session_id='sess-001'):
    return client.post('/api/ussd', data={
        'sessionId': session_id,
        'phoneNumber': phone,
        'text': text,
    })


def _create_user(phone, user_type='adolescent', pin='1234', name='Uwase Mukamana'):
    password_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
    pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
    user = User(
        name=name,
        phone_number=to_stored_phone(phone),
        password_hash=password_hash,
        pin_hash=pin_hash,
        enable_pin_auth=True,
        user_type=user_type,
        account_type='self_registered',
    )
    db.session.add(user)
    db.session.flush()
    if user_type == 'parent':
        db.session.add(Parent(user_id=user.id))
    else:
        db.session.add(Adolescent(user_id=user.id))
    db.session.commit()
    return user


class TestUSSDSmartEntry:
    def test_known_user_goes_directly_to_pin(self, client, app):
        with app.app_context():
            _create_user('+250788123456')
            resp = _ussd_post(client, '+250788123456', '')
            assert resp.status_code == 200
            body = resp.data.decode()
            assert 'Welcome back' in body
            assert 'Enter your PIN' in body
            assert 'Register' not in body

    def test_unknown_user_starts_registration(self, client, app):
        with app.app_context():
            resp = _ussd_post(client, '+250788999999', '')
            assert resp.status_code == 200
            body = resp.data.decode()
            assert 'No account found' in body
            assert 'Enter your full name' in body

    def test_health_provider_blocked(self, client, app):
        with app.app_context():
            _create_user('+250788111111', user_type='health_provider')
            resp = _ussd_post(client, '+250788111111', '')
            body = resp.data.decode()
            assert body.startswith('END')
            assert 'parents and adolescents' in body

    def test_admin_blocked(self, client, app):
        with app.app_context():
            _create_user('+250788222222', user_type='admin')
            resp = _ussd_post(client, '+250788222222', '')
            body = resp.data.decode()
            assert body.startswith('END')
            assert 'parents and adolescents' in body


class TestUSSDAuthentication:
    def test_pin_login_success(self, client, app):
        with app.app_context():
            _create_user('+250788123456', pin='5678')
            resp = _ussd_post(client, '+250788123456', '5678', session_id='auth-sess')
            body = resp.data.decode()
            assert 'Hi Uwase' in body
            assert 'My Cycle' in body

    def test_pin_wrong_3x_locked(self, client, app):
        with app.app_context():
            _create_user('+250788123456', pin='5678')
            for _ in range(3):
                resp = _ussd_post(client, '+250788123456', '0000', session_id='fail-sess')
            body = resp.data.decode()
            assert 'Too many incorrect attempts' in body

    def test_registration_creates_parent_profile(self, client, app):
        with app.app_context():
            text = 'Jane Parent*1*5678*5678'
            resp = _ussd_post(client, '+250788333333', text)
            body = resp.data.decode()
            assert 'Welcome' in body
            user = User.query.filter_by(phone_number=to_stored_phone('+250788333333')).first()
            assert user is not None
            assert user.user_type == 'parent'
            assert user.account_type == 'ussd_registered'
            assert Parent.query.filter_by(user_id=user.id).first() is not None

    def test_registration_creates_adolescent_profile(self, client, app):
        with app.app_context():
            text = 'Teen User*2*8765*8765'
            resp = _ussd_post(client, '+250788444444', text)
            body = resp.data.decode()
            assert 'Welcome' in body
            user = User.query.filter_by(phone_number=to_stored_phone('+250788444444')).first()
            assert user.user_type == 'adolescent'
            assert Adolescent.query.filter_by(user_id=user.id).first() is not None


class TestUSSDMLEngine:
    def test_cycle_prediction_uses_ml_engine(self, app):
        with app.app_context():
            user = _create_user('+250788555555')
            logs = [
                (datetime(2026, 1, 1), datetime(2026, 1, 5)),
                (datetime(2026, 1, 22), datetime(2026, 1, 26)),
                (datetime(2026, 2, 12), datetime(2026, 2, 16)),
            ]
            for start, end in logs:
                db.session.add(CycleLog(
                    user_id=user.id, start_date=start, end_date=end,
                    period_length=(end - start).days, flow_intensity='medium',
                ))
            db.session.commit()

            with patch('app.ussd.cycle.CyclePredictionEngine.predict_next_cycles') as mock_pred:
                mock_pred.return_value = {
                    'predictions': [{
                        'predicted_start': '2026-03-05',
                        'confidence': 'high',
                        'fertile_window_start': '2026-02-20',
                        'fertile_window_end': '2026-02-26',
                    }]
                }
                from app.ussd.cycle import get_ussd_cycle_predictions
                result = get_ussd_cycle_predictions(user)
                mock_pred.assert_called()
                assert 'Predictions' in result

    def test_cycle_stats_uses_ml_engine(self, app):
        with app.app_context():
            user = _create_user('+250788666666')
            for start in [datetime(2026, 1, 1), datetime(2026, 1, 22)]:
                db.session.add(CycleLog(
                    user_id=user.id, start_date=start,
                    end_date=start + timedelta(days=4),
                    period_length=4, flow_intensity='medium',
                ))
            db.session.commit()

            with patch('app.ussd.cycle.CyclePredictionEngine.extract_cycle_lengths_robust') as mock_extract:
                mock_extract.return_value = {'lengths': [21, 22], 'dates': []}
                with patch('app.ussd.cycle.CyclePredictionEngine.compute_regularity_index') as mock_reg:
                    mock_reg.return_value = {'score': 85, 'label': 'regular'}
                    with patch('app.ussd.cycle.CyclePredictionEngine.compute_confidence_score') as mock_conf:
                        mock_conf.return_value = {'level': 'high'}
                        from app.ussd.cycle import get_ussd_cycle_stats
                        result = get_ussd_cycle_stats(user)
                        mock_extract.assert_called()
                        assert 'Cycle Stats' in result

    def test_anomaly_detection_uses_ml_engine(self, app):
        with app.app_context():
            user = _create_user('+250788777777')
            db.session.add(CycleLog(
                user_id=user.id, start_date=datetime(2026, 1, 1),
                end_date=datetime(2026, 1, 5), period_length=4,
            ))
            db.session.add(CycleLog(
                user_id=user.id, start_date=datetime(2026, 1, 25),
                end_date=datetime(2026, 1, 29), period_length=4,
            ))
            db.session.commit()

            with patch('app.ussd.cycle.CyclePredictionEngine.detect_health_anomalies') as mock_anom:
                mock_anom.return_value = {'anomalies': [], 'risk_level': 'low'}
                from app.ussd.cycle import get_ussd_anomaly_report
                result = get_ussd_anomaly_report(user)
                mock_anom.assert_called()
                assert 'No health alerts' in result


class TestUSSDNotifications:
    def test_cycle_log_triggers_notification(self, app):
        with app.app_context():
            user = _create_user('+250788888888')
            db.session.add(CycleLog(
                user_id=user.id, start_date=datetime(2025, 12, 1),
                end_date=datetime(2025, 12, 5), period_length=4, cycle_length=28,
            ))
            db.session.add(CycleLog(
                user_id=user.id, start_date=datetime(2025, 12, 29),
                end_date=datetime(2026, 1, 2), period_length=4, cycle_length=28,
            ))
            db.session.commit()

            with patch('app.ussd.services.notification_manager.create') as mock_create:
                from app.ussd.services import ussd_save_cycle_log
                ussd_save_cycle_log(user, '15/01/2026', '19/01/2026')
                assert mock_create.called

    def test_appointment_triggers_provider_notification(self, app):
        with app.app_context():
            user = _create_user('+250788999000')
            from app.models import HealthProvider
            provider_user = User(
                name='Dr Provider', phone_number='+250788999001',
                password_hash=bcrypt.generate_password_hash('pass').decode('utf-8'),
                user_type='health_provider',
            )
            db.session.add(provider_user)
            db.session.flush()
            provider = HealthProvider(user_id=provider_user.id, is_verified=True)
            db.session.add(provider)
            db.session.commit()

            with patch('app.ussd.services.notification_manager.create') as mock_create:
                from app.ussd.services import ussd_book_appointment
                ussd_book_appointment(user, 'Headache and cramps')
                assert mock_create.called


class TestUSSDSession:
    def test_normalize_rwanda_local_format(self):
        assert normalize_phone('0788123456') == '+250788123456'

    def test_normalize_without_country_code_adds_250(self):
        assert normalize_phone('788123456') == '+250788123456'

    def test_find_user_local_db_format(self, app):
        with app.app_context():
            from app.ussd.session import find_user_by_phone, to_stored_phone
            user = User(
                name='Test Local Phone',
                phone_number='0788111222',
                password_hash=bcrypt.generate_password_hash('testpass').decode('utf-8'),
                user_type='adolescent',
            )
            db.session.add(user)
            db.session.commit()

            assert find_user_by_phone('0788111222') is not None
            assert find_user_by_phone('+250788111222') is not None
            assert find_user_by_phone('788111222') is not None
            assert to_stored_phone('+250788111222') == '0788111222'

    def test_session_authentication(self, app):
        with app.app_context():
            user = _create_user('+250788123457')
            mark_session_authenticated('test-session', user.id)
            assert is_session_authenticated('test-session', user.id) is True
            assert is_session_authenticated('wrong-session', user.id) is False
