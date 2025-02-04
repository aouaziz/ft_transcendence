from django.urls import path
from .consumers import GameRoom

# wsurlpatterns should be a list of URL patterns
wsurlpatterns = [
    path("ws/game/<room_code>/", GameRoom.as_asgi())
]
