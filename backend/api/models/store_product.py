from django.db import models
from .store import Store
from .product import Product


class StoreProduct(models.Model):
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name="products")
    external_id = models.CharField(
        max_length=128, verbose_name="ID товара в МП")
    sku_mp = models.CharField(
        max_length=150, db_index=True, verbose_name="Артикул в МП")
    name = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Название в МП"
    )
    barcode = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Штрихкод"
    )

    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        unique_together = [
            ("store", "external_id"),
            ("store", "sku_mp"),
        ]
        indexes = [
            models.Index(fields=["store", "sku_mp"]),
            models.Index(fields=["store", "external_id"]),
        ]
        verbose_name = "Товар магазина"

    def __str__(self):
        base = self.name or self.sku_mp
        return f"{base} @ {self.store}"
