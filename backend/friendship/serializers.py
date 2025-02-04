from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FriendRequest
from django.db import models

User = get_user_model()

class FriendRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']



User = get_user_model()

class UserFriendSerializer(serializers.ModelSerializer):
    is_online = serializers.BooleanField(source='online_status', read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online']