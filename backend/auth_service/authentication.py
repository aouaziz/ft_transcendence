from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
import logging

logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
    
        logger.info(f"Authentication attempt for path: {request.path}")
        logger.info(f"Cookies: {request.COOKIES}")

        header = self.get_header(request)
        if header is None:
            raw_token = request.COOKIES.get('access_token')
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            logger.warning("No token found in request")
            return None

        try:

            validated_token = self.get_validated_token(raw_token)
            

            user = self.get_user(validated_token)
            

            logger.info(f"Authenticated user: {user}")
            logger.info(f"Token payload: {validated_token.payload}")


            if str(validated_token.payload.get('user_id')) != str(user.id):
                logger.error(f"Token user_id mismatch: Token says {validated_token.payload.get('user_id')}, User is {user.id}")
                raise AuthenticationFailed("Token does not match user")

            return (user, validated_token)
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return None
