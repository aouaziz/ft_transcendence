from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .models import Room, Game, User  # Adjust based on your models
from .serializers import RoomSerializer, GameSerializer
import random
import string



@api_view(['GET', 'POST'])
def matchmaking(request):
    if request.method == 'GET':
        Room.objects.all().delete()
        Game.objects.all().delete()
        User.objects.all().delete()
        rooms = Room.objects.all()
        room_serializer = RoomSerializer(rooms, many=True)
        games = Game.objects.all()
        game_serializer = GameSerializer(games, many=True)
        return Response({'rooms': room_serializer.data, 'games': game_serializer.data})

    if request.method == 'POST':
        data = request.data
        if 'username' not in data:
            return Response({"error": "Username not found"}, status=status.HTTP_400_BAD_REQUEST)

        username = data['username']
        user, _ = User.objects.get_or_create(username=username)

        # Check for an available room
        available_room = Room.objects.filter(status='WAITING').first()
        if available_room:
            if available_room.creator == user:
                return Response({'error': "Username already in the room"}, status=status.HTTP_400_BAD_REQUEST)
            
            game = Game.objects.create(
                room=available_room,
                player1=available_room.creator,
                player2=user
            )
            available_room.status = 'STARTED'
            available_room.save()
            return JsonResponse({
                "room_code": available_room.room_code,
                "message": "Joined existing room."
            }, status=200)

        # Generate unique room code
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        new_room = Room.objects.create(room_code=code, creator=user)
        return JsonResponse({
            "room_code": new_room.room_code,
            "message": "Created new room."
        }, status=201)