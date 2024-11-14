from django.urls import path
from . import views

urlpatterns = [
    path('create-game/', views.create_game, name='create_game'),
    path('get-game/<int:pk>/', views.get_game_state, name='get_game_state'),
]