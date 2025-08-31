from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Product
from .serializers.products import ProductSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_list(request):
    qs = Product.objects.all().order_by("id")
    serializer = ProductSerializer(qs, many=True)
    return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from api.services.import_products import import_products_from_excel


class ProductImportView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # принимает form-data с файлом

    def post(self, request, *args, **kwargs):
        """
        POST /api/products/import/
        form-data: file=<excel>
        """
        excel = request.FILES.get("file")
        if not excel:
            return Response({"detail": "Не передан файл 'file'."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            stats = import_products_from_excel(excel)
            return Response({"status": "ok", **stats}, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"status": "error", "detail": str(ve)},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": "error", "detail": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter

from api.models import Store
from api.serializers.store import StoreSerializer

class StoreViewSet(ModelViewSet):
    """
    CRUD:
    - GET    /api/stores/          (list)
    - POST   /api/stores/          (create)
    - GET    /api/stores/{id}/     (retrieve)
    - PUT    /api/stores/{id}/     (update)
    - PATCH  /api/stores/{id}/     (partial_update)
    - DELETE /api/stores/{id}/     (destroy)
    """
    queryset = Store.objects.all().order_by("id")
    serializer_class = StoreSerializer
    permission_classes = []
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "client_id"]
    ordering_fields = ["id", "name", "client_id"]
