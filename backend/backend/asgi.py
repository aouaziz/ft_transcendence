import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from friendship.consumers import FriendNotificationConsumer
from chat.routing import websocket_urlpatterns 
from game.routing import wsurlpatterns  

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/notifications/", FriendNotificationConsumer.as_asgi()), 
            path("ws/online_status/", FriendNotificationConsumer.as_asgi()),  
            *websocket_urlpatterns,  
            *wsurlpatterns, 
        ])
    ),
})
