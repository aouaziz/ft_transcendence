from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from .consumers import FriendNotificationConsumer

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter([
            path('ws/notifications/', FriendNotificationConsumer.as_asgi()),
            path('ws/online_status/', FriendNotificationConsumer.as_asgi()),
        ])
    ),
})