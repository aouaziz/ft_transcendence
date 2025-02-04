from django.urls import path
from .views import (
    TwoFactorSetupView,
    UserProfileCreateView,
    UserProfileUpdateView,
    UserProfileDetailView,
    UserLoginView,
    UserDetailByIdView,
    VerifyTokenView,
    RefreshTokenView,
    UserLogoutView,
    UserProfileDetail,
    UserListView,
    BackupCodesView,
    AvatarView,
    AvatarUploadView,
    AvatarFetchView,
    UserStatusUpdateView,

)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Two Factor Authentication Setup
    path('two_factor/setup/', TwoFactorSetupView.as_view(), name='two_factor_setup'),
    path('2fa/backup-codes/', BackupCodesView.as_view(), name='backup_codes'),
    path('verify-token/', VerifyTokenView.as_view(), name='verify-token'),
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh_token'),

    # User Profile Operations
    path('user/create/', UserProfileCreateView.as_view(), name='user_create'),
    path('user/update/', UserProfileUpdateView.as_view(), name='user_update'),
    path('user/detail/', UserProfileDetailView.as_view(), name='user_detail'),
    path('detail/', UserProfileDetail.as_view(), name='user_detail'),

    path('user/<int:user_id>/', UserDetailByIdView.as_view(), name='user_detail_by_id'),
    path('users/', UserListView.as_view(), name='user-list'),

    # User Login
    path('user/login/', UserLoginView.as_view(), name='user_login'),
    path('user/logout/', UserLogoutView.as_view(), name='logout'),
    path('/avatar/<str:username>/', AvatarView.as_view(), name='avatar-view'),
    path('user/avatar/upload/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('user/avatar/fetch/', AvatarFetchView.as_view(), name='avatar-fetch'),
    path('user/update/status/', UserStatusUpdateView.as_view(), name='user-update-status'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)