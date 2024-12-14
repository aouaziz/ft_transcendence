import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter
from api.routing import wsurlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoproject.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket":wsurlpatterns,
})
