from rest_framework.serializers import ModelSerializer

from api.models.store_product import StoreProduct
from .products import ProductSerializer


class StoreProductSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = StoreProduct
        fields = '__all__'
        read_only_fields = ('id',)
