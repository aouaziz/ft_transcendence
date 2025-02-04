from rest_framework import serializers  
from .models import Message 
from auth_service.models import MyUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUser
        fields = ['id', 'username', 'email']



class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username')
    recipient = serializers.CharField(source='recipient.username')

    class Meta:
        model = Message
        fields = ['sender', 'recipient', 'message', 'created_at']

    def create(self, validated_data):
        sender_username = validated_data.pop('sender')['username']
        recipient_username = validated_data.pop('recipient')['username']

        sender = MyUser.objects.get(username=sender_username)
        recipient = MyUser.objects.get(username=recipient_username)

        message = Message.objects.create(sender=sender, recipient=recipient, **validated_data)
        return message