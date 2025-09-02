from api.models.store_product import StoreProduct
import logging
import time
from itertools import islice
import requests
from django.conf import settings
from api.models.product import Product
from api.models.store_warehouse import StoreWarehouse

logger = logging.getLogger(__name__)


def chunked_iterable(iterable, size):
    it = iter(iterable)
    while chunk := list(islice(it, size)):
        yield chunk


def sync_ozon_stocks(store):
    if not store.api_key or not store.client_id:
        logger.info('Не установлен токен Ozon либо список остатков пуст')
        return
    payloads = []

    for warehouse in StoreWarehouse.objects.filter(store=store):
        for chunk in chunked_iterable(
            StoreProduct.objects.filter(store=store, product__isnull=False), 100
        ):
            payloads.append(
                {'stocks':
                    [
                        {'offer_id': product.external_id,
                         'stock': product.product.stock,
                         'warehouse_id': warehouse.external_id}
                        for product in chunk
                    ]
                 }
            )
            try:
                response = requests.post(
                    settings.OZON_API + 'v2/products/stocks',
                    headers={
                        'Api-Key': store.api_key,
                        'Client-Id': store.client_id
                    },
                    json=payloads[-1]
                )
                response.raise_for_status()

            except requests.RequestException as e:
                logger.warning(f'Не удалось передать остатки в Ozon {e}')
            time.sleep(30)
    return payloads
