import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract room_code from the query parameters
        self.room_code = self.scope['url_route']['kwargs']['room_code']

        # Join the room group
        await self.channel_layer.group_add(
            self.room_code,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

        # Notify the group of a new player
        await self.channel_layer.group_send(
            self.room_code,
            {
                "type": "player_join",
                "username": self.username
            }
        )

        # Start game loop if not already running
        if not hasattr(self.channel_layer, "game_loop_task"):
            self.channel_layer.game_loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_code,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')

        if action_type == "player_input":
            await self.handle_player_input(data)

    async def handle_player_input(self, data):
        """Handle player key inputs."""
        # Forward input data to all group members
        await self.channel_layer.group_send(
            self.room_code,
            {
                "type": "game_update",
                "username": self.username,
                "key": data.get("key"),
                "state": data.get("state"),  # e.g., 'keydown' or 'keyup'
            }
        )

    async def player_join(self, event):
        # Notify clients of a new player joining
        await self.send(text_data=json.dumps({
            "type": "player_join",
            "username": event["username"]
        }))

    async def game_update(self, event):
        # Broadcast game updates (player key events) to clients
        await self.send(text_data=json.dumps({
            "type": "game_update",
            "username": event["username"],
            "key": event["key"],
            "state": event["state"]  # e.g., 'keydown' or 'keyup'
        }))

    async def game_loop(self):
        game = PongGame()
        while True:
            # Broadcast game state to all clients
            game_state = game.update_game(getattr(self.channel_layer, "keys_pressed", {}))
            await self.channel_layer.group_send(
                self.room_code,
                {
                    "type": "game_state",
                    "game_state": game_state
                }
            )
            await asyncio.sleep(0.016)  # ~60 updates per second

    async def game_state(self, event):
        # Send updated game state to the client
        await self.send(text_data=json.dumps({
            "type": "game_state",
            "game_state": event["game_state"]
        }))

# Helper game logic and state management

class PongGame:
    """Manage game state for a Pong game."""

    def __init__(self):
        self.game_running = False
        self.paddle1_y = 261
        self.paddle2_y = 261
        self.ball_x = 544.5
        self.ball_y = 290.5
        self.ball_speed_x = 4
        self.ball_speed_y = 4
        self.paddle1_speed = 0
        self.paddle2_speed = 0
        self.score1 = 0
        self.score2 = 0
        self.max_ball_speed = 10
        self.acceleration_speed = 1
        self.max_speed = 5
        self.game_width = 1100
        self.game_height = 600
        self.winning_score = 5

    def update_game(self, keys_pressed):
        # Update paddles
        self.update_paddle("player1", keys_pressed)
        self.update_paddle("player2", keys_pressed)

        # Update ball
        self.ball_x += self.ball_speed_x
        self.ball_y += self.ball_speed_y

        # Check wall collisions
        if self.ball_y <= 0 or self.ball_y >= self.game_height:
            self.ball_speed_y *= -1

        # Check paddle collisions
        if self.ball_x <= 20:  # Paddle 1 collision
            if self.paddle1_y <= self.ball_y <= self.paddle1_y + 100:
                self.ball_speed_x *= -1
        elif self.ball_x >= self.game_width - 20:  # Paddle 2 collision
            if self.paddle2_y <= self.ball_y <= self.paddle2_y + 100:
                self.ball_speed_x *= -1

        # Check scoring
        if self.ball_x < 0:
            self.score2 += 1
            self.reset_ball()
        elif self.ball_x > self.game_width:
            self.score1 += 1
            self.reset_ball()

        return {
            "paddle1_y": self.paddle1_y,
            "paddle2_y": self.paddle2_y,
            "ball_x": self.ball_x,
            "ball_y": self.ball_y,
            "score1": self.score1,
            "score2": self.score2
        }

    def update_paddle(self, player, keys_pressed):
        if player == "player1":
            if keys_pressed.get("w"):
                self.paddle1_speed = max(self.paddle1_speed - self.acceleration_speed, -self.max_speed)
            elif keys_pressed.get("s"):
                self.paddle1_speed = min(self.paddle1_speed + self.acceleration_speed, self.max_speed)
            else:
                self.paddle1_speed = 0
            self.paddle1_y += self.paddle1_speed

        elif player == "player2":
            if keys_pressed.get("ArrowUp"):
                self.paddle2_speed = max(self.paddle2_speed - self.acceleration_speed, -self.max_speed)
            elif keys_pressed.get("ArrowDown"):
                self.paddle2_speed = min(self.paddle2_speed + self.acceleration_speed, self.max_speed)
            else:
                self.paddle2_speed = 0
            self.paddle2_y += self.paddle2_speed

        # Clamp paddle positions
        self.paddle1_y = max(0, min(self.game_height - 100, self.paddle1_y))
        self.paddle2_y = max(0, min(self.game_height - 100, self.paddle2_y))

    def reset_ball(self):
        self.ball_x = self.game_width / 2
        self.ball_y = self.game_height / 2
        self.ball_speed_x = 4 if self.ball_speed_x < 0 else -4
        self.ball_speed_y = 4 if self.ball_speed_y < 0 else -4