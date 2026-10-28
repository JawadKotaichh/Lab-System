from asyncio import gather
from dataclasses import dataclass
from beanie import PydanticObjectId
from fastapi import HTTPException
from .models import (
    Visit, Patient, insurance_company, lab_test_result, lab_test_type,
    lab_panel, lab_test_category,
)


@dataclass(frozen=True)
class VisitReadContext:
    patient: Patient
    insurance: insurance_company
    results: list[lab_test_result]
    tests: dict[PydanticObjectId, lab_test_type]
    panels: dict[PydanticObjectId, lab_panel]
    categories: dict[PydanticObjectId, lab_test_category]


async def _find_ids(model, ids):
    return await model.find({"_id": {"$in": list(ids)}}).to_list() if ids else []


async def load_catalog(results):
    tests, panels = await gather(
        _find_ids(lab_test_type, {row.lab_test_type_id for row in results}),
        _find_ids(lab_panel, {row.lab_panel_id for row in results if row.lab_panel_id}),
    )
    ids = {test.lab_test_category_id for test in tests} | {panel.lab_panel_category_id for panel in panels}
    categories = await _find_ids(lab_test_category, ids)
    return ({test.id: test for test in tests}, {panel.id: panel for panel in panels},
            {category.id: category for category in categories})


async def load_visit_context(visit: Visit) -> VisitReadContext:
    patient, results = await gather(
        Patient.find_one(Patient.id == visit.patient_id),
        lab_test_result.find(lab_test_result.visit_id == visit.id).to_list(),
    )
    if patient is None:
        raise HTTPException(404, "Patient for visit not found")
    insurance, catalog = await gather(
        insurance_company.find_one(insurance_company.id == patient.insurance_company_id),
        load_catalog(results),
    )
    if insurance is None:
        raise HTTPException(404, "Insurance company not found")
    tests, panels, categories = catalog
    return VisitReadContext(patient=patient, insurance=insurance, results=results,
                            tests=tests, panels=panels, categories=categories)
