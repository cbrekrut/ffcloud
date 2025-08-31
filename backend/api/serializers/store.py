from rest_framework import serializers
from api.models import Store

class StoreSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True)

    class Meta:
        model = Store
        fields = ("id", "name", "client_id", "api_key")
        read_only_fields = ("id",)

    def validate_name(self, v):
        v = (v or "").strip()
        if not v:
            raise serializers.ValidationError("Название магазина не может быть пустым.")
        return v

    def validate_client_id(self, v):
        v = (v or "").strip()
        if not v:
            raise serializers.ValidationError("Client ID обязателен.")
        return v
