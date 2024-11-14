
from rest_framework import status

from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Game
from .serializers import GameSerializer
# Create your views here.



# @api_view(['POST'])   
# def create_game(request):
#     data = request.data
#     player1_name = data.get("player1_name")
#     player2_name = data.get("player2_name")
#     game = Game.objects.create(player1_name=player1_name,player2_name=player2_name)
#     serializer = GameSerializer(game)
#     return Response(serializer.data,status=status.HTTP_201_CREATED)

@api_view(['POST'])   
def create_game(request):
    serializer = GameSerializer(request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
def get_game_state(request, pk):
    try:
        game = Game.objects.get(pk=pk)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = GameSerializer(game)
    return Response(serializer.data, status=status.HTTP_200_OK)