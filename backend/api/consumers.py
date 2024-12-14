from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json
from .models import Game,Room


connected_players = {}

class GameRoom(WebsocketConsumer):
    def connect(self):
        room_code = self.scope['url_route']['kwargs']['room_code']
        user = self.scope["user"]
        try:
            room = Room.objects.get(room_code=room_code)
        except Room.DoesNotExist:
            print("Room not found")
            self.close()
            return
        room_group_name = f"room_{room_code}"
        print("connected to room",room_code)
        # Add the channel to the group
        async_to_sync(self.channel_layer.group_add)(
            room_group_name,
            self.channel_name
        )
        connected_players.setdefault(room_code,0)
        connected_players[room_code] += 1


        if connected_players[room_code] == 2:
            try:
                game = Game.objects.get(room=room)
            except Game.DoesNotExist:
                print("Game not found")
                self.close()
                return
            async_to_sync(self.channel_layer.group_send)(
                room_group_name,
                {
                    "type": "game_update",
                    "message": "start_game",
                    "players": {
                        "player1": game.player1.username ,
                        "player2": game.player2.username ,
                    },
                }
            )
        elif connected_players[room_code] >2 :
            print("Game is full")
            self.close()
            return
        self.accept()

    def disconnect(self, code):
        print(f"Disconnect calle with code: {code}")
        room_code = self.scope['url_route']['kwargs']['room_code']
        room_group_name = f"room_{room_code}"
            # Remove the room entry from connected_players

        del connected_players[room_code]
        # Remove the channel from the group
        async_to_sync(self.channel_layer.group_discard)(
            room_group_name,
            self.channel_name
        )
    # def receive(self, text_data):
    #     data = json.loads(text_data)
    #     action = data.direction
    
    def game_update(self, event):
        # Handle game update messages and send to WebSocket clients
        self.send(text_data=json.dumps(event))