import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import models, schemas
from app.services.stripe_service import StripeService


class TestPayments:
    """Test payment functionality"""

    def test_create_payment_intent_success(self, client: TestClient, test_user: models.User, test_booking: models.Booking, db: Session):
        """Test successful payment intent creation"""
        # Login as customer
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock Stripe service
        with patch.object(StripeService, 'create_payment_intent') as mock_create:
            mock_create.return_value = {
                'client_secret': 'pi_test_client_secret',
                'payment_intent_id': 'pi_test_123',
                'amount': 100.0,
                'currency': 'usd'
            }
            
            response = client.post(
                "/payments/create-payment-intent",
                json={"booking_id": test_booking.id},
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["client_secret"] == "pi_test_client_secret"
            assert data["payment_intent_id"] == "pi_test_123"
            assert data["amount"] == 100.0
            
            # Check booking was updated
            db.refresh(test_booking)
            assert test_booking.stripe_payment_intent_id == "pi_test_123"
            assert test_booking.payment_status == "processing"

    def test_create_payment_intent_booking_not_found(self, client: TestClient, test_user: models.User):
        """Test payment intent creation with non-existent booking"""
        # Login as customer
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/payments/create-payment-intent",
            json={"booking_id": 999},
            headers=headers
        )
        
        assert response.status_code == 404
        assert "Booking not found" in response.json()["detail"]

    def test_create_payment_intent_unauthorized(self, client: TestClient, test_host: models.User, test_booking: models.Booking):
        """Test payment intent creation by unauthorized user"""
        # Login as host (not the customer)
        login_data = {"email": test_host.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/payments/create-payment-intent",
            json={"booking_id": test_booking.id},
            headers=headers
        )
        
        assert response.status_code == 403
        assert "Not authorized to pay for this booking" in response.json()["detail"]

    def test_confirm_payment_success(self, client: TestClient, test_user: models.User, test_booking: models.Booking, db: Session):
        """Test successful payment confirmation"""
        # Set up booking with payment intent
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "processing"
        db.commit()
        
        # Login as customer
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock Stripe service
        with patch.object(StripeService, 'confirm_payment') as mock_confirm:
            mock_confirm.return_value = {
                'status': 'succeeded',
                'payment_method': 'card',
                'amount_received': 100.0
            }
            
            response = client.post(
                "/payments/confirm-payment",
                json={"payment_intent_id": "pi_test_123"},
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "Payment confirmed successfully" in data["detail"]
            assert data["booking_id"] == test_booking.id
            
            # Check booking was updated
            db.refresh(test_booking)
            assert test_booking.payment_status == "paid"
            assert test_booking.status == "confirmed"
            assert test_booking.payment_method == "card"

    def test_confirm_payment_failed(self, client: TestClient, test_user: models.User, test_booking: models.Booking, db: Session):
        """Test payment confirmation with failed payment"""
        # Set up booking with payment intent
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "processing"
        db.commit()
        
        # Login as customer
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock Stripe service
        with patch.object(StripeService, 'confirm_payment') as mock_confirm:
            mock_confirm.return_value = {
                'status': 'requires_payment_method',
                'payment_method': None,
                'amount_received': 0
            }
            
            response = client.post(
                "/payments/confirm-payment",
                json={"payment_intent_id": "pi_test_123"},
                headers=headers
            )
            
            assert response.status_code == 400
            assert "Payment failed" in response.json()["detail"]
            
            # Check booking status was updated
            db.refresh(test_booking)
            assert test_booking.payment_status == "failed"

    def test_create_refund_success(self, client: TestClient, test_host: models.User, test_booking: models.Booking, db: Session):
        """Test successful refund creation"""
        # Set up paid booking
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "paid"
        test_booking.status = "confirmed"
        db.commit()
        
        # Login as host
        login_data = {"email": test_host.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock Stripe service
        with patch.object(StripeService, 'create_refund') as mock_refund:
            mock_refund.return_value = {
                'refund_id': 're_test_123',
                'status': 'succeeded',
                'amount': 50.0
            }
            
            response = client.post(
                "/payments/refund",
                json={"booking_id": test_booking.id, "amount": 50.0},
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["refund_id"] == "re_test_123"
            assert data["status"] == "succeeded"
            assert data["amount"] == 50.0
            
            # Check booking was updated
            db.refresh(test_booking)
            assert test_booking.refund_amount == 50.0

    def test_create_refund_full_amount(self, client: TestClient, test_host: models.User, test_booking: models.Booking, db: Session):
        """Test full refund updates booking status"""
        # Set up paid booking
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "paid"
        test_booking.status = "confirmed"
        test_booking.total_price = 100.0
        db.commit()
        
        # Login as host
        login_data = {"email": test_host.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock Stripe service
        with patch.object(StripeService, 'create_refund') as mock_refund:
            mock_refund.return_value = {
                'refund_id': 're_test_123',
                'status': 'succeeded',
                'amount': 100.0
            }
            
            response = client.post(
                "/payments/refund",
                json={"booking_id": test_booking.id},  # Full refund
                headers=headers
            )
            
            assert response.status_code == 200
            
            # Check booking status was updated to refunded
            db.refresh(test_booking)
            assert test_booking.refund_amount == 100.0
            assert test_booking.payment_status == "refunded"
            assert test_booking.status == "cancelled"

    def test_create_refund_unauthorized(self, client: TestClient, test_user: models.User, test_booking: models.Booking):
        """Test refund creation by unauthorized user"""
        # Set up paid booking
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "paid"
        
        # Login as customer (not host)
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/payments/refund",
            json={"booking_id": test_booking.id, "amount": 50.0},
            headers=headers
        )
        
        assert response.status_code == 403
        assert "Only listing host can issue refunds" in response.json()["detail"]

    def test_get_payment_status_customer(self, client: TestClient, test_user: models.User, test_booking: models.Booking):
        """Test getting payment status as customer"""
        # Set up booking with payment data
        test_booking.stripe_payment_intent_id = "pi_test_123"
        test_booking.payment_status = "paid"
        test_booking.payment_method = "card"
        test_booking.refund_amount = 25.0
        
        # Login as customer
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/payments/booking/{test_booking.id}/payment-status",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == test_booking.id
        assert data["payment_status"] == "paid"
        assert data["payment_method"] == "card"
        assert data["total_price"] == test_booking.total_price
        assert data["refund_amount"] == 25.0
        assert data["stripe_payment_intent_id"] == "pi_test_123"

    def test_get_payment_status_host(self, client: TestClient, test_host: models.User, test_booking: models.Booking):
        """Test getting payment status as host"""
        # Login as host
        login_data = {"email": test_host.email, "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/payments/booking/{test_booking.id}/payment-status",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == test_booking.id

    def test_get_payment_status_unauthorized(self, client: TestClient, test_booking: models.Booking, db: Session):
        """Test getting payment status by unauthorized user"""
        # Create another user
        other_user = models.User(
            email="other@example.com",
            username="otheruser",
            hashed_password="hashed",
            first_name="Other",
            last_name="User"
        )
        db.add(other_user)
        db.commit()
        
        # Login as other user
        login_data = {"email": "other@example.com", "password": "testpassword"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/payments/booking/{test_booking.id}/payment-status",
            headers=headers
        )
        
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]


class TestStripeService:
    """Test Stripe service methods"""

    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent(self, mock_create, test_booking: models.Booking):
        """Test Stripe payment intent creation"""
        mock_create.return_value = Mock(
            client_secret='pi_test_client_secret',
            id='pi_test_123'
        )
        
        result = StripeService.create_payment_intent(
            booking=test_booking,
            customer_email="test@example.com",
            customer_name="Test User"
        )
        
        assert result['client_secret'] == 'pi_test_client_secret'
        assert result['payment_intent_id'] == 'pi_test_123'
        assert result['amount'] == test_booking.total_price
        assert result['currency'] == 'usd'
        
        # Verify Stripe was called with correct parameters
        mock_create.assert_called_once()
        call_args = mock_create.call_args[1]
        assert call_args['amount'] == int(test_booking.total_price * 100)
        assert call_args['currency'] == 'usd'
        assert call_args['receipt_email'] == "test@example.com"

    @patch('stripe.PaymentIntent.retrieve')
    def test_confirm_payment(self, mock_retrieve):
        """Test payment confirmation"""
        mock_charge = Mock()
        mock_charge.payment_method_details.type = 'card'
        
        mock_retrieve.return_value = Mock(
            status='succeeded',
            charges=Mock(data=[mock_charge]),
            amount_received=10000  # $100.00 in cents
        )
        
        result = StripeService.confirm_payment('pi_test_123')
        
        assert result['status'] == 'succeeded'
        assert result['payment_method'] == 'card'
        assert result['amount_received'] == 100.0

    @patch('stripe.Refund.create')
    def test_create_refund(self, mock_create):
        """Test refund creation"""
        mock_create.return_value = Mock(
            id='re_test_123',
            status='succeeded',
            amount=5000  # $50.00 in cents
        )
        
        result = StripeService.create_refund('pi_test_123', 50.0)
        
        assert result['refund_id'] == 're_test_123'
        assert result['status'] == 'succeeded'
        assert result['amount'] == 50.0
        
        # Verify Stripe was called with correct parameters
        mock_create.assert_called_once_with(
            payment_intent='pi_test_123',
            amount=5000
        )

    @patch('stripe.Webhook.construct_event')
    def test_construct_webhook_event(self, mock_construct):
        """Test webhook event construction"""
        mock_event = {'type': 'payment_intent.succeeded'}
        mock_construct.return_value = mock_event
        
        result = StripeService.construct_webhook_event(b'payload', 'signature')
        
        assert result == mock_event
        mock_construct.assert_called_once_with(
            b'payload', 'signature', None  # webhook secret would be None in test
        ) 