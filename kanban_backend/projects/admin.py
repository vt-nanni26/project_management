from django.contrib import admin
from boards.models import Board
from lists.models import List

admin.site.register(Board)
admin.site.register(List)
