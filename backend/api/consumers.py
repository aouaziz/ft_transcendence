
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import * 
import json
import asyncio
import random

connected_players = {}

class GameRoom(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Game state variables
        self.loop_interval = 0.03  # Interval in seconds (8ms)
        self.gameHeight = 600
        self.gameWidth = 1100
        self.accelerationSpeed = 1
        self.game_running = False
        self.paddle1Speed = 0
        self.paddle2Speed = 0
        self.paddle1_y = 261
        self.paddle2_y = 261
        self.maxSpeed = 5
        self.print = False
        self.paddle_Width  = 12
        self.paddle_Height  = 80
        self.ball_x = 544.5
        self.ball_y = 290.5
        self.maxBallSpeed = 10
        self.ball_speed_x = 4
        self.ball_speed_y = 4
        self.ball_Height = 15
        self.ball_Width = 15
        self.player_id = None
        self.score1 = 0
        self.score2 = 0
        self.player1 = None
        self.player2 = None
        self.max_score = 5



    async def connect(self):
        room_code = self.scope['url_route']['kwargs']['room_code']
        try:
            room = await sync_to_async(Room.objects.get)(room_code=room_code)
        except Room.DoesNotExist:
            print(f"Connection failed: Room with code {room_code} does not exist")
            await self.close()
            return
        
        self.room_group_name = f"room_{room_code}"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        connected_players.setdefault(self.room_group_name, 0)
        connected_players[self.room_group_name] += 1
        
        if connected_players[self.room_group_name] == 1:
            self.player_id = "player1"
        elif connected_players[self.room_group_name] == 2:
            self.player_id = "player2"
        else :
            await self.close()
            return
        
        await self.accept()


        if connected_players[self.room_group_name] == 2:
            # Notify both players that the game is starting
            try:
                game = await sync_to_async(Game.objects.get)(room=room)
            except Game.DoesNotExist:
                print("Game not found")
                await self.close()
                return
            # Fetching player usernames asynchronously using sync_to_async
            self.player1 = await sync_to_async(lambda: game.player1.username)()
            self.player2 = await sync_to_async(lambda: game.player2.username)()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "send_message",
                    "message": "start_game",
                    "player1": self.player1 ,
                    "player2": self.player2 ,
                    
                },
            )
            self.game_running = True
            asyncio.create_task(self.game_loop())
    async def disconnect(self, close_code):
        
        del connected_players[self.room_group_name]
        print("error code of disconnecting is ", close_code)
        self.game_running = False
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        
        data = json.loads(text_data)
        action = data.get("action")
        if action == "move":
            await self.handle_paddle_move(data)
     

    async def handle_paddle_move(self,data):
        direction = data.get('direction')
        player = data.get('player')
        if player == "player1":
            if direction == "up":
                self.paddle1Speed = max(-self.maxSpeed , self.paddle1Speed - self.accelerationSpeed)
            elif direction == "down":
                self.paddle1Speed = min(self.maxSpeed, self.paddle1Speed + self.accelerationSpeed)

            self.paddle1_y += self.paddle1Speed
            if self.paddle1_y < 0:
                self.paddle1_y = 0
            elif self.paddle1_y > self.gameHeight - self.paddle_Height:
                self.paddle1_y =  self.gameHeight - self.paddle_Height
            await self.channel_layer.group_send(
                self.room_group_name,
                 {
                        "type": "player_move",
                        "channel_name" : self.channel_name,
                        "paddle1_y": self.paddle1_y,
                        
                    }
                )
            

        elif player == "player2" :
            if direction == "up":
                self.paddle2Speed = max(-self.maxSpeed , self.paddle2Speed - self.accelerationSpeed)
            elif direction == "down":
                self.paddle2Speed = min(self.maxSpeed, self.paddle2Speed + self.accelerationSpeed)

            self.paddle2_y += self.paddle2Speed
            if self.paddle2_y < 0:
                self.paddle2_y = 0
            elif self.paddle2_y > self.gameHeight - self.paddle_Height:
                self.paddle2_y =  self.gameHeight - self.paddle_Height
       


    def increase_ball_speed(self):

        if abs(self.ball_speed_y) < self.maxBallSpeed:
            self.ball_speed_y *= 1.1  # Increase Y speed by 10%

        if abs(self.ball_speed_x) < self.maxBallSpeed:
            self.ball_speed_x *= 1.1  # Increase X speed by 10%
    
    def reset_ball(self):
        """
        Reset the ball to the center with random direction.
        """
        self.ball_x = self.gameWidth/2
        self.ball_y = self.gameHeight/2

        self.ball_speed_x = 4 if random.randint(0, 100) % 2 == 0 else -4
        self.ball_speed_y = 4 if random.randint(0, 100) % 2 == 0 else -4


    async def game_loop(self):
        while self.game_running:
            self.updateBall()
            # Broadcast game state
            
            await self.channel_layer.group_send(
                self.room_group_name,
                 {
                        "type": "send_message",
                        "message": "game_update",
                        "payload": {
                           "paddle1_y": self.paddle1_y,
                           "paddle2_y": self.paddle2_y,
                            "ball_x": self.ball_x,
                            "ball_y": self.ball_y,
                            "score1": self.score1,
                            "score2": self.score2,
                        }
                    }
                )
            await asyncio.sleep(self.loop_interval)

    def updateBall(self):
          # Ball collision with top/bottom walls
        if self.ball_y <= 0 or self.ball_y >= self.gameHeight - self.ball_Height:
            self.ball_speed_y *= -1
            
        
        # Ball collision with Paddle1
        if self.ball_x <= self.paddle_Width  and self.ball_y >= self.paddle1_y and self.ball_y <= self.paddle1_y + self.paddle_Height :
            self.ball_speed_x *= -1
            self.increase_ball_speed()

        # Ball collision with Paddle2
        if self.ball_x >= self.gameWidth - self.paddle_Width - self.ball_Width and self.ball_y >= self.paddle2_y and self.ball_y <= self.paddle2_y + self.paddle_Height:
            self.ball_speed_x *= -1
            self.increase_ball_speed()
        
        self.ball_x += self.ball_speed_x
        self.ball_y += self.ball_speed_y
        
        # Ball out of bounds

        if self.ball_x <= 0:
            self.score2 += 1
            self.reset_ball()
        elif self.ball_x >= self.gameWidth - self.ball_Width :
            self.score1 += 1
            self.reset_ball()
        
        if (self.score1 >= self.max_score or self.score2 >= self.max_score):
            self.end_game()

    async def end_game(self):
        self.game_running = False
        if self.score1 > self.score2:
            winner = self.player1
        else :
            winner = self.player2
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_message",
                "message": "game_over",
                "payload": {
                    "message": f"Game Over! {winner} won!",
                }
            }
        )
    
    async def send_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_move(self, event):

        if self.channel_name == event.get("channel_name") :
            pass
        else :
            self.paddle1_y = int(event.get("paddle1_y"))