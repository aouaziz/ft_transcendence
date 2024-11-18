from django.urls import path
from .views import create_game, get_game_state 

urlpatterns = [
    path('api/create_game/', create_game, name='create_game'),
    path('api/get_game/<int:pk>/', get_game_state, name='get_game_state'),
]