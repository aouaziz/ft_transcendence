from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Message
from auth_service.models import MyUser
from django.utils import timezone
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message')
            sender = text_data_json.get('sender')
            recipient = text_data_json.get('recipient')

            if message and sender and recipient:
                # Log the message content for debugging
                logger.info(f"Received message: sender={sender}, recipient={recipient}, message={message}")

                # Save the message to the database
                sender_user = await self.get_user(sender)
                recipient_user = await self.get_user(recipient)

                # Log the user fetching for debugging
                logger.info(f"Sender: {sender_user}, Recipient: {recipient_user}")

                # Create and save the message
                await self.create_message(sender_user, recipient_user, message)

                # Send message to the room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': sender,
                        'recipient': recipient
                    }
                )
            else:
                logger.error(f"Received message is missing required fields: message={message}, sender={sender}, recipient={recipient}")
                await self.send(text_data=json.dumps({
                    'error': 'Missing required fields in message'
                }))
        
        except json.JSONDecodeError:
            logger.error("Error decoding JSON data from WebSocket message")
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            await self.send(text_data=json.dumps({
                'error': f'Unexpected error: {str(e)}'
            }))

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        recipient = event['recipient']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'recipient': recipient
        }))

    # Helper method to get a user object
    @database_sync_to_async
    def get_user(self, username):
        try:
            return MyUser.objects.get(username=username)
        except MyUser.DoesNotExist:
            logger.error(f"User {username} not found")
            raise ValueError(f"User {username} does not exist")

    # Helper method to create and save the message
    @database_sync_to_async
    def create_message(self, sender, recipient, message):
        try:
            Message.objects.create(
                sender=sender,
                recipient=recipient,
                message=message,
                created_at=timezone.now()
            )
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise e