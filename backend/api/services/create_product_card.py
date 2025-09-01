from itertools import islice

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException

from api.models.product import Product


def chunked_iterable(iterable, size):
    it = iter(iterable)
    while chunk := list(islice(it, size)):
        yield chunk


def create_ozon_product_card(store):
    if not store.api_key or not store.client_id:
        raise APIException(
            'У магазина не задан Ozon API ключ или client_id',
            code=status.HTTP_400_BAD_REQUEST
        )

    for chunk in chunked_iterable(Product.objects.all(), 100):
        try:
            response = requests.post(
                settings.OZON_API + 'v3/product/import',
                headers={
                    'Api-Key': store.api_key,
                    'Client-Id': store.client_id,
                },
                timeout=10,
                json={'items': [{
                    "description_category_id": 17028756,
                    "category_name": "Запчасти для легковых автомобилей",
                    "type_name": "Запчасти автомобильные",
                    "type_id": 970799804,
                    'name': product.name,
                    'offer_id': product.sku,
                    'price': str(product.price),
                    'images': [product.image_url],
                    "weight": 200,
                    'width': 200,
                    'height': 200,
                    'depth': 200,
                    "attributes": [
                        {
                            "complex_id": 0,
                            "id": 7236,
                            "values": [
                                {
                                    "value": product.sku.split('|')[-1]
                                }
                            ]
                        },
                        {
                            "complex_id": 0,
                            "id": 9048,
                            "values": [
                                {
                                    "dictionary_value_id": 971082156,
                                    "value": product.sku.split('|')[-1]
                                }
                            ]
                        },
                        {
                            "complex_id": 0,
                            "id": 7202,
                            "values": [
                                {
                                    "dictionary_value_id": 45537,
                                    "value": "11"
                                }
                            ]
                        },
                    ]
                } for product in chunk]}
            )
            response.raise_for_status()
        except requests.RequestException as e:
            raise APIException(
                f'Ошибка запроса к Ozon API: {str(e)}',
                code=status.HTTP_502_BAD_GATEWAY
            )
