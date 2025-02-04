from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.layers import get_channel_layer

class FriendNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
 
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return
        
  
        self.group_name = f"user_{self.user.id}_notifications"
    
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

  
        await self.accept()

        await self.send_online_status('online')

    async def disconnect(self, close_code):
    
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )


        await self.send_online_status('offline')


    async def send_online_status(self, status):
        await self.send(text_data=json.dumps({
            'type': 'online_status',
            'status': status
        }))


    async def send_friend_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'request_id': event['request_id']
        }))


    async def friend_request_accepted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'receiver_id': event['receiver_id'],
            'receiver_username': event['receiver_username']
        }))


    async def friend_request_rejected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request_rejected',
            'receiver_id': event['receiver_id'],
            'receiver_username': event['receiver_username']
        }))
