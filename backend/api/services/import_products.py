import re
from pathlib import Path
from typing import Union, IO, Optional

import pandas as pd
from django.db import transaction

from api.models import Product


def _only_digits_to_int(val) -> int:
    if pd.isna(val):
        return 0
    s = str(val)
    digits = re.findall(r"\d+", s)
    return int("".join(digits)) if digits else 0


def _prefixed_sku(sku: Optional[str], prefix: str = "AVTORUS|") -> str:
    if sku is None or str(sku).strip() == "":
        return prefix  
    s = str(sku).strip()
    return s if s.startswith(prefix) else f"{prefix}{s}"


@transaction.atomic
def import_products_from_excel(
    excel_file: Union[str, Path, IO[bytes]],
    *,
    start_row: int = 5,
    name_col: int = 2, 
    sku_col: int = 3,    
    stock_col: int = 7,  
    sheet_name: Union[int, str] = 0,
) -> dict:
    """
    Импорт из Excel по номерам столбцов (1-based) и стартовой строке (1-based).
    Сохраняет/обновляет Product(name, sku, stock), где:
      - sku -> 'AVTORUS|<артикул>'
      - stock -> только цифры

    :param excel_file: путь к файлу или file-like объект
    :param start_row: с какой строки начать (1-based, включительно)
    :param name_col: номер столбца с наименованием (1-based)
    :param sku_col: номер столбца с артикулом (1-based)
    :param stock_col: номер столбца с остатком (1-based)
    :param sheet_name: имя или индекс листа
    :return: статистика импорта
    """
    # читаем без заголовков, чтобы оперировать позициями
    df = pd.read_excel(excel_file, header=None, sheet_name=sheet_name)

    # в pandas индексация 0-based:
    row0 = max(start_row - 1, 0)
    name_idx = max(name_col - 1, 0)
    sku_idx = max(sku_col - 1, 0)
    stock_idx = max(stock_col - 1, 0)

    # базовые проверки размеров
    if df.shape[1] <= max(name_idx, sku_idx, stock_idx):
        raise ValueError(
            f"В листе только {df.shape[1]} столбцов, нужен как минимум {max(name_idx, sku_idx, stock_idx) + 1}."
        )
    if df.shape[0] <= row0:
        raise ValueError(
            f"В листе только {df.shape[0]} строк, start_row={start_row} вне диапазона."
        )

    # отрезаем с нужной строки и берём только нужные столбцы
    part = df.iloc[row0:, [name_idx, sku_idx, stock_idx]].copy()
    part.columns = ["name", "sku_raw", "stock_raw"]

    # очистка
    part["name"] = part["name"].astype(str).fillna("").str.strip()
    part["sku"] = part["sku_raw"].apply(_prefixed_sku)
    part["stock"] = part["stock_raw"].apply(_only_digits_to_int).astype(int)

    # удалить строки без артикула (превратились в 'AVTORUS|')
    part = part[part["sku"] != "AVTORUS|"].copy()

    # если в файле дубли по артикулу — берём последнюю строку
    part = part.drop_duplicates(subset=["sku"], keep="last")

    created = updated = 0
    errors = []

    for row in part.itertuples(index=False):
        try:
            obj, is_created = Product.objects.update_or_create(
                sku=row.sku,
                defaults={"name": row.name, "stock": int(row.stock)},
            )
            if is_created:
                created += 1
            else:
                updated += 1
        except Exception as exc:
            errors.append({"sku": row.sku, "error": str(exc)})

    return {
        "rows_read": int(df.shape[0] - row0),
        "rows_ready": int(len(part)),
        "created": created,
        "updated": updated,
        "errors": errors,
        "debug": {
            "start_row_1based": start_row,
            "name_col_1based": name_col,
            "sku_col_1based": sku_col,
            "stock_col_1based": stock_col,
            "sheet_name": sheet_name,
        },
    }
