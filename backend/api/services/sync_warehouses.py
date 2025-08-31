import requests
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException

from api.models.store_warehouse import StoreWarehouse


def get_ozon_warehouses(store):
    if not store.api_key or not store.client_id:
        raise APIException(
            'У магазина не задан Ozon API ключ или client_id',
            code=status.HTTP_400_BAD_REQUEST
        )

    try:
        response = requests.post(
            settings.OZON_API + 'v1/warehouse/list',
            headers={
                'Api-Key': store.api_key,
                'Client-Id': store.client_id,
            },
            timeout=10
        )
    except requests.RequestException as e:
        raise APIException(
            f'Ошибка запроса к Ozon API: {str(e)}',
            code=status.HTTP_502_BAD_GATEWAY
        )

    if response.status_code != 200:
        raise APIException(
            f'Ошибка от Ozon API: {response.status_code} — {response.text}',
            code=status.HTTP_502_BAD_GATEWAY
        )

    data = response.json()
    warehouses = data.get('result', [])

    result = []

    for wh in warehouses:
        ext_id = wh.get('warehouse_id')
        name = wh.get('name')

        if ext_id is None or not name:
            continue

        stock, _ = StoreWarehouse.objects.update_or_create(
            store=store,
            external_id=ext_id,
            defaults={'name': name}
        )

        result.append({
            'id': stock.id,
            'external_id': ext_id,
            'name': name
        })

    return result
