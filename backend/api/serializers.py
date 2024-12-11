from rest_framework import serializers
from .models import Room, Game

class RoomSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField() 
    class Meta:
        model = Room
        fields = ['id', 'room_code', 'status', 'creator']


class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.StringRelatedField() 
    player2 = serializers.StringRelatedField() 
    winner = serializers.StringRelatedField() 
    class Meta:
        model = Game
        fields = ['id', 'room', 'player1', 'player2', 'winner']
