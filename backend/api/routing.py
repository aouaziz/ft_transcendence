from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from .consumers import GameRoom

wsurlpatterns = AuthMiddlewareStack(
    URLRouter([
        path("ws/game/<room_code>/", GameRoom.as_asgi())
    ])
)
