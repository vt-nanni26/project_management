from django.db import models
from django.contrib.auth.models import User
from common.models import TimestampedModel


class Project(TimestampedModel):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
