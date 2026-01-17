from rest_framework import viewsets
from .models import List
from .serializers import ListSerializer

class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer

    def get_queryset(self):
        queryset = List.objects.all()
        board_id = self.request.query_params.get('board_id')
        if board_id is not None:
            queryset = queryset.filter(board_id=board_id)
        return queryset
