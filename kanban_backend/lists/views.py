from rest_framework import viewsets
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import List
from .serializers import ListSerializer

@method_decorator(csrf_exempt, name='dispatch')
class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer

    def get_queryset(self):
        queryset = List.objects.all()
        board_id = self.request.query_params.get('board_id')
        if board_id is not None:
            queryset = queryset.filter(board_id=board_id)
        return queryset
