from django.shortcuts import render, redirect
import requests
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.conf import settings
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.authentication import BaseAuthentication
from .authentication import OAuth42Authentication
from auth_service.models import MyUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from django.http import HttpResponse
import datetime
from django.utils import timezone
logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([OAuth42Authentication])
def oauth_login(request):
    client_id = settings.SOCIAL_AUTH_42_KEY
    redirect_uri = settings.SOCIAL_AUTH_42_REDIRECT_URI
    auth_url = f'https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code'

    return Response({'url': auth_url}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([OAuth42Authentication])
def oauth_callback(request):
    logger.info("oauth_callback view called")
    code = request.GET.get('code')
    logger.info(f"Received code: {code}")
    if not code:
        logger.error("No authorization code received")
        return Response({'error': 'No authorization code received'}, status=400)
    try:
        token_data = exchange_code_for_token(code)
        logger.info(f"Token data: {token_data}")

        user_data = get_user_data(token_data)
        logger.info(f"User data: {user_data}")

        user = create_or_update_user(user_data)
        logger.info(f"User created or updated: {user.username}")

        # Generate JWT tokens for the logged-in user
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        login(request, user, backend='oauth_42.backends.Custom42OAuth2')

        response = redirect('https://localhost:8443/Home')

        expires_in = 3600 # Or any suitable value in seconds
        expiration_time = timezone.now() + datetime.timedelta(seconds=expires_in)
        formatted_expiration = expiration_time.strftime("%a, %d %b %Y %H:%M:%S GMT")
        response.set_cookie('access_token', access_token, expires=formatted_expiration , httponly=False, samesite='Lax', path='/')
        response.set_cookie('refresh_token', refresh_token, expires=formatted_expiration, httponly=False, samesite='Lax', path='/')

        response.set_cookie('username', user.username,  httponly=False, samesite='Lax', path='/')
        response.set_cookie('isLoggedIn', 'true', httponly=False, samesite='Lax', path='/')

        return response
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return Response({'error': str(e)}, status=500)


def exchange_code_for_token(code):
    client_id = settings.SOCIAL_AUTH_42_KEY
    client_secret = settings.SOCIAL_AUTH_42_SECRET
    redirect_uri = settings.SOCIAL_AUTH_42_REDIRECT_URI

    token_url = 'https://api.intra.42.fr/oauth/token'
    data = {
        'grant_type': 'authorization_code',
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'code': code,
    }
    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status() 
        response_data = response.json()
        logger.info(f"response from intra: {response_data}")
        return response_data
    except requests.exceptions.RequestException as e:
        logger.error(f"An error occurred: {e}")
        raise ValueError("Failed to obtain access token") from e


def get_user_data(token_data):
    access_token = token_data.get('access_token')
    user_url = 'https://api.intra.42.fr/v2/me'

    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    try:
       response = requests.get(user_url, headers=headers)
       response.raise_for_status()
       response_data = response.json()
       logger.info(f"user data response: {response_data}")
       if 'id' not in response_data:
            raise ValueError("Failed to obtain user data")
       return response_data
    except requests.exceptions.RequestException as e:
         logger.error(f"Error: {str(e)}")
         raise ValueError("Failed to obtain user data") from e


def create_or_update_user(user_data):
        username = user_data.get('login')
        email = f'{username}@42.fr'
        avatar = user_data.get('image').get('link')
        intra_id = user_data.get('id')  # Get intra id.
        user, created = MyUser.objects.get_or_create(
             intra_id=intra_id,  # Use intra_id to find user
           defaults={'username': username, 'email': email, 'oauth_status': True}
        )
        if not created:
            user.username = username
            user.email = email
        if avatar:  
            user.avatar = avatar
        user.set_online()
        user.save()

        return user