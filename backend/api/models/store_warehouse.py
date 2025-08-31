from django.db import models

from .store import Store


class StoreWarehouse(models.Model):
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='warehouse'
    )
    name = models.CharField(max_length=300)
    external_id = models.CharField(max_length=300)

    class Meta:
        unique_together = ('store', 'external_id')
        ordering = ['id']
