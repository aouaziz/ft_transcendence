from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
from rest_framework import serializers
from .models import MyUser
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
import pyotp
from .models import MyUser
from .serializers import UserProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from .authentication import CookieJWTAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from channels.layers import get_channel_layer
import json
from django.core.mail import send_mail
import random
from twilio.rest import Client
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.decorators import method_decorator
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from uuid import uuid4
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import os
from django.core.files.storage import default_storage
from uuid import uuid4
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import gettext as _
import qrcode
from io import BytesIO
import base64
from game.models import Game

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.contrib.auth.password_validation import validate_password
from .serializers import UserProfileSerializer
from .models import MyUser
from django.core.exceptions import ValidationError as DjangoValidationError

class UserProfileCreateView(generics.CreateAPIView):
    queryset = MyUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        try:
            # Validate password
            password = self.request.data.get('password')
            self.validate_password(password)

            # Create user
            user = serializer.save()
            user.set_password(password)
            user.oauth_status = False  
            user.save()

            return user

        except (DjangoValidationError, DRFValidationError) as e:
            raise DRFValidationError(e.messages)

    def validate_password(self, password):
        """
        Validate the password strength.
        """
        errors = []

        # Custom password validation logic
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one number.")
        if not any(char.isupper() for char in password):
            errors.append("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in password):
            errors.append("Password must contain at least one lowercase letter.")
        if not any(char in "!@#$%^&*()" for char in password):
            errors.append("Password must contain at least one special character (!@#$%^&*()).")

        if errors:
            raise DRFValidationError(errors)

    def create(self, request, *args, **kwargs):
        """
        Create a user and return JWT tokens.
        """
        try:
            # Attempt to create the user using the serializer
            response = super().create(request, *args, **kwargs)
            user = MyUser.objects.get(username=request.data['username'])

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            user.set_online()  # Set user online upon creation.

            # Prepare the response with tokens
            tokens = {
                'refresh_token': str(refresh),
                'access_token': str(refresh.access_token),
            }

            # Return success response with tokens
            return Response({
                'message': 'User successfully created and logged in.',
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)

        except DRFValidationError as e:
            return Response({
                'message': 'Validation error',
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'message': "An unexpected error occurred. Please try again.",
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class UserProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = MyUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    # parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()

        if user.oauth_status:
           return self.error_response("OAuth users cannot update their profile data", status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)


        current_password = request.data.get("current_password")
        new_password = request.data.get("password")


        if new_password:
            self._validate_password_change(user, current_password, new_password)
            user.set_password(new_password)


        avatar_file = request.FILES.get('avatar')  
        if avatar_file:
            file_extension = os.path.splitext(avatar_file.name)[1]
            file_name = str(uuid4()) + file_extension
            file_path = os.path.join(settings.MEDIA_ROOT, file_name)

            with default_storage.open(file_path, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)

            user.avatar = os.path.join(settings.MEDIA_URL, file_name)


        self.perform_update(serializer)
        user.save()
        return Response(serializer.data)

    def _validate_password_change(self, user, current_password, new_password):
        """Validates password change: current password must be correct, and new password must be valid"""

        if not current_password:
          raise ValidationError({"current_password": _("This field is required when changing password.")})

        if not new_password:
           raise ValidationError({"password": _("This field is required when changing password.")})

        if not authenticate(username=user.username, password=current_password):
            raise ValidationError({"current_password": _("Incorrect current password.")})

        self._validate_password(new_password)

    def _validate_password(self, password):
            """Validates new password requirements"""
            errors = []
            if len(password) < 8:
              errors.append(_("Password must be at least 8 characters long."))

            if not any(char.isdigit() for char in password):
                errors.append(_("Password must contain at least one number."))

            if not any(char.isupper() for char in password):
                errors.append(_("Password must contain at least one uppercase letter."))

            if not any(char.islower() for char in password):
               errors.append(_("Password must contain at least one lowercase letter."))

            if not any(char in "!@#$%^&*()" for char in password):
               errors.append(_("Password must contain at least one special character."))

            if errors:
              raise ValidationError(errors)
class UserProfileDetailView(generics.RetrieveAPIView):
    queryset = MyUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get_object(self):
        user = self.request.user
        user = MyUser.objects.prefetch_related(
            models.Prefetch(
                'player1',
                queryset=Game.objects.filter(status='FINISH').select_related('winner', 'player1', 'player2'),
                to_attr='games_as_player1'
            ),
             models.Prefetch(
                'player2',
                queryset=Game.objects.filter(status='FINISH').select_related('winner', 'player1', 'player2'),
                to_attr='games_as_player2'
            )
        ).get(pk=user.pk)

        return user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        user_data = UserProfileSerializer(user).data
        games = user.games_as_player1 + user.games_as_player2
        match_history = []
        for game in games:
            match_history.append({
                "result": "win" if game.winner == user else "loss",
                "player1": game.player1.username,
                "player2": game.player2.username if game.player2 else "Unknown",
                "score1": game.player1_score,
                "score2": game.player2_score,
                "timestamp": game.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            })

        total_matches = len(games)
        total_wins = sum(1 for game in games if game.winner == user)
        total_losses = total_matches - total_wins
        win_rate = (total_wins / total_matches * 100) if total_matches > 0 else 0

        user_data['total_matches'] = total_matches
        user_data['total_wins'] = total_wins
        user_data['total_losses'] = total_losses
        user_data['win_rate'] = round(win_rate, 2)
        user_data['match_history'] = match_history
        return Response(user_data)


class UserProfileDetail(generics.RetrieveAPIView):
    queryset = MyUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get_object(self):
        return self.request.user

class UserDetailByIdView(generics.RetrieveAPIView):
    queryset = MyUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get_object(self):
        user_id = self.kwargs["user_id"]
        try:
            user = MyUser.objects.get(id=user_id)
            return user
        except MyUser.DoesNotExist:
            raise ValidationError("User not found.")



class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request, *args, **kwargs):
        try:
            user = request.user;
            user.set_offline();
            refresh_token = request.COOKIES.get('refresh_token')

            if refresh_token:
                try:
                    refresh = RefreshToken(refresh_token)
                    refresh.blacklist()
                except TokenError:
                     return self.error_response("Invalid token", status=status.HTTP_400_BAD_REQUEST)


            response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

            for key, value in request.COOKIES.items():
                if key not in ['csrftoken', 'sessionid']:
                    response.delete_cookie(key)

            if 'sessionid' in request.COOKIES:
                response.set_cookie('sessionid', '', max_age=0, httponly=True, samesite='Lax')
            if 'csrftoken' in request.COOKIES:
                response.set_cookie('csrftoken', '', max_age=0, httponly=True, samesite='Lax')

            return response
        except Exception as e:
            print(f"Error during logout: {e}")
            return self.error_response("An error occurred during logout.", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return self.error_response("Refresh token is required", status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token
            return Response({"access_token": str(access_token)}, status=status.HTTP_200_OK)
        except InvalidToken:
            return self.error_response("Invalid refresh token", status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return self.error_response("Refresh token required", status=400)
        try:
             refresh = RefreshToken(refresh_token)
             user = refresh.access_token.payload.get('user_id')
             if user:
                 current_user = MyUser.objects.get(id=user)
                 current_user.set_online()
             new_access_token = str(refresh.access_token)
             return Response({"access_token": new_access_token}, status=200)
        except InvalidToken:
            return self.error_response("Invalid refresh token", status=400)


class UserListView(generics.ListAPIView):
   serializer_class = UserProfileSerializer
   permission_classes = [IsAuthenticated]
   authentication_classes = [JWTAuthentication]

   def get_queryset(self):
       current_user = self.request.user

       queryset = MyUser.objects.exclude(
           Q(id=current_user.id) |
           Q(id__in=current_user.blocked_users.all()) |
           Q(blocked_users=current_user) |
             Q(oauth_status=False) 
       )
       search = self.request.query_params.get('search', None)
       if search:
           queryset = queryset.filter(
               Q(username__icontains=search) |
               Q(nickname__icontains=search)
           )

       online_status = self.request.query_params.get('online', None)
       if online_status is not None:
           online = online_status.lower() == 'true'
           queryset = queryset.filter(online_status=online)

       return queryset.order_by('username')


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, *args, **kwargs):
        user = request.user

        if user.two_factor_enabled:
            return self.error_response("Two-Factor Authentication is already enabled", status=status.HTTP_400_BAD_REQUEST)

        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)

        backup_codes = self.generate_backup_codes()

        user.two_factor_secret = secret
        user.two_factor_enabled = True
        user.backup_codes = backup_codes
        user.save()

        qr_image = self.generate_qr_code_image(totp.provisioning_uri(
            name=user.username,
            issuer_name="SecureApp"
        ))

        if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
            try:
                self.send_backup_codes_email(user.email, backup_codes)
            except Exception as e:
                print(f"Failed to send email: {str(e)}")

        return Response({
            "message": "2FA has been enabled successfully",
            "qr_code_image": qr_image, 
            "backup_codes": backup_codes,  
            "secret": secret,  
            "warning": "Please save your backup codes securely. They will not be shown again."
        })

    def generate_backup_codes(self, count=5):
        """Generate a set of backup codes"""
        return [str(random.randint(100000, 999999)) for _ in range(count)]

    def send_backup_codes_email(self, email, backup_codes):
        """Send backup codes to user's email"""
        if not settings.EMAIL_HOST:
            return  

        message = "Your backup codes for 2FA:\n\n"
        message += "\n".join(backup_codes)
        message += "\n\nPlease store these codes safely. They can be used if you lose access to your authenticator app."

        try:
            send_mail(
                'Your 2FA Backup Codes',
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True 
            )
        except Exception as e:
            print(f"Failed to send email: {str(e)}")

    def generate_qr_code_image(self, qr_data):
        """Generates QR code as base64 image string"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = BytesIO()
        img.save(img_buffer, format="PNG")
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"


from rest_framework.response import Response
from rest_framework import status

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            two_factor_code = request.data.get('two_factor_code')

            if not username or not password:
                return self.error_response('Username and password are required', status=status.HTTP_400_BAD_REQUEST)

            # Authenticate the user
            user = authenticate(request, username=username, password=password)

            if user is None:
                return self.error_response('Invalid credentials', status=status.HTTP_401_UNAUTHORIZED)

            # Check if 2FA is enabled
            if user.two_factor_enabled:
                if not two_factor_code:
                    return Response({
                        'message': 'Please provide 2FA code',
                        'requires_2fa': True
                    }, status=status.HTTP_200_OK)

                if not self.verify_2fa(user, two_factor_code):
                    return self.error_response('Invalid 2FA code', status=status.HTTP_401_UNAUTHORIZED)

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            user.set_online()  
            tokens = {
                'refresh_token': str(refresh),
                'access_token': str(refresh.access_token),
            }

            return Response({
                'message': 'Login successful',
                'tokens': tokens
            })

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def error_response(self, message, status):
        return Response({'message': message}, status=status)

    def verify_2fa(self, user, code):
        """Verify 2FA code or backup code"""
        # Check if it's a backup code
        if code in user.backup_codes:
            # Remove used backup code
            user.backup_codes.remove(code)
            user.save()
            return True

        # Verify TOTP code
        totp = pyotp.TOTP(user.two_factor_secret)
        return totp.verify(code)

class BackupCodesView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
        """Generate new backup codes"""
        user = request.user

        if not user.two_factor_enabled:
            return self.error_response("2FA must be enabled to generate backup codes", status=status.HTTP_400_BAD_REQUEST)

        # Generate new backup codes
        backup_codes = [str(random.randint(100000, 999999)) for _ in range(5)]
        user.backup_codes = backup_codes
        user.save()

        # Send codes via email
        self.send_backup_codes_email(user.email, backup_codes)

        return Response({
            "message": "New backup codes generated",
            "backup_codes": backup_codes
        })

    def send_backup_codes_email(self, email, backup_codes):
        message = "Your new backup codes for 2FA:\n\n"
        message += "\n".join(backup_codes)
        message += "\n\nPlease store these codes safely."

        send_mail(
            'Your New 2FA Backup Codes',
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False
        )


class AvatarView(APIView):
    def get(self, request, username):
        try:
            user = MyUser.objects.get(username=username)
            avatar_url = user.avatar.url if user.avatar else '/assets/default_avatar.jpg'
            return Response({"username": user.username, "avatar": avatar_url}, status=status.HTTP_200_OK)
        except MyUser.DoesNotExist:
            return self.error_response("User not found", status=status.HTTP_404_NOT_FOUND)


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
         user = request.user
         avatar_file = request.FILES.get('avatar')
 
         if not avatar_file:
             return self.error_response("No avatar file provided", status=status.HTTP_400_BAD_REQUEST)
 
         try:
             # Generate a unique filename
             file_extension = os.path.splitext(avatar_file.name)[1]
             file_name = str(uuid4()) + file_extension
 
             # Construct the full path to save the file.
             file_path = os.path.join(settings.MEDIA_ROOT, file_name)
 
             # Save the file
             with default_storage.open(file_path, 'wb+') as destination:
                 for chunk in avatar_file.chunks():
                     destination.write(chunk)
 
             # Set the new avatar url
             user.avatar = os.path.join(settings.MEDIA_URL, file_name)
             user.save()
 
             return Response({"message": "Avatar updated successfully", "avatar": user.avatar}, status=status.HTTP_200_OK)
 
         except Exception as e:
             print(f"Error uploading avatar: {e}")
             return self.error_response("Error uploading avatar", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AvatarFetchView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get(self, request):
        user = request.user
        return Response({"avatar": user.avatar}, status=status.HTTP_200_OK)


class UserStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
        user = request.user
        user.set_offline()
        return Response({"message":"User status updated to offline"})
    def set_online(self):
        self.online_status = True
        self.last_activity = timezone.now()
        self.save()

    def set_offline(self):
        self.online_status = False
        self.save()

    def error_response(self, message, status_code):
        """Helper method to format consistent error responses."""
        return Response({"error": message}, status=status_code)