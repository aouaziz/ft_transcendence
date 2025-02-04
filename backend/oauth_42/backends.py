from social_core.backends.oauth import BaseOAuth2

class Custom42OAuth2(BaseOAuth2):
    """
    Custom backend to handle OAuth2 flow for 42 API.
    """
    AUTHORIZATION_URL = 'https://api.intra.42.fr/oauth/authorize'
    ACCESS_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
    ACCESS_TOKEN_METHOD = 'POST'
    REDIRECT_URI = 'https://localhost:8443/auth/oauth/callback/'
    SCOPE = ['public']
    EXTRA_DATA = [('id', 'id'), ('login', 'login'), ('email', 'email'), ('avatar', 'image')]

    def get_user_details(self, response):
        """
        Return user details from 42 API response.
        """
        username = response.get('login')
        email = f'{username}@42.fr'
        user_data = {
            'username': username,
            'email': email,
            'avatar_url': response.get('image', {}).get('large', ''),
        }
        return user_data