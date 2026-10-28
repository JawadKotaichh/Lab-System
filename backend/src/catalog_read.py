from beanie import PydanticObjectId
from fastapi import HTTPException
from .schemas.schema_Lab_Test_Type import Lab_test_type


async def expand_tests(tests, category_model):
    ids = list(dict.fromkeys(test.lab_test_category_id for test in tests))
    categories = await category_model.find({"_id": {"$in": ids}}).to_list() if ids else []
    by_id = {category.id: category for category in categories}
    output = []
    for test in tests:
        category = by_id.get(test.lab_test_category_id)
        if category is None:
            raise HTTPException(404, f"Lab Test category {test.lab_test_category_id} not found")
        output.append(Lab_test_type(
            lab_test_id=str(test.id), name=test.name, nssf_id=test.nssf_id,
            lab_test_category_id=str(test.lab_test_category_id),
            lab_test_category_name=category.lab_test_category_name,
            unit=test.unit, price=test.price, normal_value_list=test.normal_value_list,
        ))
    return output


async def panel_tests(ids, test_model, category_model, missing_status=404):
    ordered_ids = [PydanticObjectId(item) for item in ids]
    tests = await test_model.find({"_id": {"$in": list(dict.fromkeys(ordered_ids))}}).to_list() if ordered_ids else []
    by_id = {test.id: test for test in tests}
    for item in ordered_ids:
        if item not in by_id:
            raise HTTPException(missing_status, f"Lab test {item} not found")
    return await expand_tests([by_id[item] for item in ordered_ids], category_model)
