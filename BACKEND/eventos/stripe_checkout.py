from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
import stripe
import os

# Set your secret key. Remember to switch to your live secret key in production!
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_...')

@api_view(["POST"])
@permission_classes([AllowAny])
def create_checkout_session(request):
    data = request.data
    price_id = data.get('price_id')
    quantity = data.get('quantity', 1)
    mode = data.get('mode', 'payment')
    domain = settings.FRONTEND_URL
    try:
        session = stripe.checkout.Session.create(
            ui_mode='embedded',
            line_items=[{
                'price': price_id,
                'quantity': quantity,
            }],
            mode=mode,
            return_url=f"{domain}/pagamento/return?session_id={{CHECKOUT_SESSION_ID}}",
        )
        return Response({'clientSecret': session.client_secret})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
