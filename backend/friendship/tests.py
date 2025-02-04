import json
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TestCase
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from asgiref.testing import ApplicationCommunicator
from friendship.consumers import FriendNotificationConsumer

User = get_user_model()

class WebSocketTestCase(TestCase):
    
    async def setUp(self):
        # Create users for the test
        self.sender = User.objects.create_user(username='sender', password='password')
        self.receiver = User.objects.create_user(username='receiver', password='password')
        
        # Simulate an authenticated WebSocket connection for the sender
        self.sender_communicator = WebsocketCommunicator(
            FriendNotificationConsumer.as_asgi(), 
            f"ws/notifications/{self.sender.id}/"
        )
        
        # Simulate an authenticated WebSocket connection for the receiver
        self.receiver_communicator = WebsocketCommunicator(
            FriendNotificationConsumer.as_asgi(), 
            f"ws/notifications/{self.receiver.id}/"
        )
        
        # Connect the communicators
        sender_connected, subprotocol = await self.sender_communicator.connect()
        receiver_connected, subprotocol = await self.receiver_communicator.connect()
        self.assertTrue(sender_connected)
        self.assertTrue(receiver_connected)
    
    async def test_send_friend_request_notification(self):
        # Send a friend request via HTTP (this will trigger the notification)
        response = await self.client.post('/api/friend-request/send/', {
            'username': 'receiver',
        })
        
        self.assertEqual(response.status_code, 201)
        message = await self.receiver_communicator.receive_json_from()
        self.assertEqual(message['type'], 'friend_request')
        self.assertEqual(message['sender_id'], self.sender.id)
        self.assertEqual(message['sender_username'], 'sender')

    async def tearDown(self):
        # Close the WebSocket connections after each test
        await self.sender_communicator.disconnect()
        await self.receiver_communicator.disconnect()
