from rest_framework import serializers
from ..models import Product


class ProductSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(min_value=0)

    class Meta:
        model = Product
        fields = ("id", "name", "sku", "stock")
        read_only_fields = ("id",)

    def validate_sku(self, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("Артикул не может быть пустым.")
        if " " in v:
            raise serializers.ValidationError("Артикул не должен содержать пробелы.")
        return v


class ProductStockUpdateSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(min_value=0)

    class Meta:
        model = Product
        fields = ("stock",)
