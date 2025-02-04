# chat/urls.py
from django.urls import path
from .views import list_users
from .views import MessageListCreateView
from .views import SendMessageView
from .views import get_messages
from . import views

urlpatterns = [
    path('api/users/', list_users, name='list_users'),
    path('api/messages/', MessageListCreateView.as_view(), name='message_list_create'),
    path('api/messages/', get_messages, name='get_messages'),
    

]