from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import requests

class OAuth42Authentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get('Authorization', None)
        if not token:
            return None

        try:
            response = requests.get("https://api.intra.42.fr/v2/me", headers={"Authorization": token})
            response.raise_for_status()  # Will raise an error for invalid tokens
            user_data = response.json()  # Parse the user data
            return (user_data, None)  # Return user data (and None as the second value for user authentication)
        except requests.exceptions.RequestException as e:
            raise AuthenticationFailed('Invalid or expired token')
