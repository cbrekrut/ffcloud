import logging
import requests

from api.models.product import Product
from api.models.store_product import StoreProduct


logger = logging.getLogger(__name__)


def get_ozon_products(store):
    if not store.api_key or not store.client_id:
        logger.warning(
            'У магазина не задан OZON токен или client_id'
        )
        return

    url = 'https://api-seller.ozon.ru/v4/product/info/attributes'
    headers = {
        'Client-Id': store.client_id,
        'Api-Key': store.api_key,
    }

    products = []
    limit = 1000
    last_id = None

    while True:
        payload = {
            'filter': {
                'visibility': 'ALL'
            },
            'limit': limit
        }
        if last_id:
            payload['last_id'] = last_id

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.warning(f'Ошибка запроса к Ozon: {e} - {response.text}')
            return

        data = response.json()
        items = data.get('result', [])

        for item in items:
            name = item.get('name')
            external_id = item.get('offer_id')
            sku_mp = item.get('sku')

            product = Product.objects.filter(sku=external_id).first()
            # if product is None or external_id is None:
            #     logger.warning(f'не найдены Sku: {external_id}')
            #     continue

            mp_product, _ = StoreProduct.objects.update_or_create(
                store=store,
                sku_mp=sku_mp,
                product=product,
                defaults={'name': name,
                          'external_id': external_id,
                          'product': product}
            )

            products.append({
                'id': mp_product.id,
                'name': mp_product.name,
                'barcode': mp_product.barcode
            })

        total = data.get('total', 0)

        if total <= limit:
            break

        last_id = data.get('last_id')

    return products
