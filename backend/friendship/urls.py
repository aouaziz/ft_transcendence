from django.urls import path
from .views import (
    AddFriendView,
    RemoveFriendView,
    BlockUserView,
    UnblockUserView,
    ListFriendsView,
 
    SearchFriendsView,
)
urlpatterns = [
    # Friend Request Management
    path('search/', SearchFriendsView.as_view(), name='search_friends'),
    path('add/', AddFriendView.as_view(), name='send_friend_request'),

    # Friend List Management
    path('remove/', RemoveFriendView.as_view(), name='remove_friend'),
    path('list/', ListFriendsView.as_view(), name='list_friends'),
    
    # User Blocking
    path('block/', BlockUserView.as_view(), name='block_user'),
    path('unblock/', UnblockUserView.as_view(), name='unblock_user'),

]
