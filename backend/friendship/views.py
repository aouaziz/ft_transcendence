from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import models
from auth_service.models import MyUser 
from .models import Friendship
from .serializers import UserFriendSerializer
from auth_service.authentication import CookieJWTAuthentication
from auth_service.serializers import UserProfileSerializer


class AddFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_username = request.data.get('username')
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        friend = get_object_or_404(MyUser, username=friend_username)

        if friend == request.user:
            return Response({'error': "Cannot add yourself as a friend"}, status=status.HTTP_400_BAD_REQUEST)

        #Check if the friendship already exists
        if Friendship.objects.filter(
            (Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user))
            ).exists():
            return Response({'error': 'User is already your friend'}, status=status.HTTP_400_BAD_REQUEST)
            
        #Create a Friendship object 
        Friendship.objects.create(user=request.user, friend=friend)
        Friendship.objects.create(user=friend, friend=request.user)
        
        return Response({'message': 'Friend added successfully'}, status=status.HTTP_201_CREATED)

class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_username = request.data.get('username')
        
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        friend = get_object_or_404(MyUser, username=friend_username)
        
        Friendship.objects.filter(
            (Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user))
        ).delete()
        
        return Response({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)

class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username_to_block = request.data.get('username')
        
        if not username_to_block:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_block = get_object_or_404(MyUser, username=username_to_block)
        
        Friendship.objects.filter(
            (Q(user=request.user, friend=user_to_block) | Q(user=user_to_block, friend=request.user))
        ).delete()

        
        request.user.blocked_users.add(user_to_block)
        
        return Response({'message': 'User blocked successfully'}, status=status.HTTP_200_OK)

class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username_to_unblock = request.data.get('username')
        
        if not username_to_unblock:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_unblock = get_object_or_404(MyUser, username=username_to_unblock)
        
        request.user.blocked_users.remove(user_to_unblock)
        
        return Response({'message': 'User unblocked successfully'}, status=status.HTTP_200_OK)


class ListFriendsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserFriendSerializer

    def get_queryset(self):
         user = self.request.user
         friend_ids = set()
         friendships = Friendship.objects.filter(
             Q(user=user) | Q(friend=user)
         )
         for friendship in friendships:
            if friendship.user == user:
                friend_ids.add(friendship.friend.id)
            else:
                friend_ids.add(friendship.user.id)
         return MyUser.objects.filter(id__in=friend_ids).exclude(id=user.id)


class SearchFriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        query = request.query_params.get('query', '')

        if not query:
            return Response({
                "friends": [],
                "other_users": []
            })

        # Get all users matching the search query exactly
        all_users = MyUser.objects.filter(
            Q(username=query) |
            Q(email=query)
        ).exclude(id=user.id)

        friendships = Friendship.objects.filter(
            Q(user=user) | Q(friend=user)
        )

        friend_ids = set()
        for friendship in friendships:
            if friendship.user == user:
                friend_ids.add(friendship.friend.id)
            else:
                friend_ids.add(friendship.user.id)

        friends_results = all_users.filter(id__in=friend_ids)
        other_users_results = all_users.exclude(id__in=friend_ids)

        serialized_friends = UserProfileSerializer(friends_results, many=True).data
        serialized_others = UserProfileSerializer(other_users_results, many=True).data

        for friend in serialized_friends:
            friend['friends'] = True
        for other in serialized_others:
            other['friends'] = False
        return Response({
            "friends": serialized_friends,
            "other_users": serialized_others
        }, status=status.HTTP_200_OK)