from decimal import Decimal, ROUND_HALF_UP
from typing import Annotated

from pydantic import Field, PlainSerializer


MAX_MONEY = Decimal("1000000000000")
MONEY_QUANTUM = Decimal("0.001")


def round_money(value: Decimal | int | float | str) -> Decimal:
    """Round calculated monetary values to three decimals using half-up."""

    return Decimal(str(value)).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def _as_json_number(value: Decimal) -> float:
    """Keep the existing numeric API contract while storing exact decimals."""

    return float(value)


Money = Annotated[
    Decimal,
    Field(ge=Decimal("0"), le=MAX_MONEY, max_digits=16, decimal_places=3),
    PlainSerializer(_as_json_number, return_type=float, when_used="json"),
]

SignedMoney = Annotated[
    Decimal,
    Field(
        ge=-MAX_MONEY,
        le=MAX_MONEY,
        max_digits=16,
        decimal_places=3,
    ),
    PlainSerializer(_as_json_number, return_type=float, when_used="json"),
]

Rate = Annotated[
    Decimal,
    Field(ge=Decimal("0"), le=Decimal("1"), max_digits=5, decimal_places=4),
    PlainSerializer(_as_json_number, return_type=float, when_used="json"),
]
