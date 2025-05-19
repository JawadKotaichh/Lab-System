from requests import get, post, put, delete, HTTPError

def test_api():

    patient_root = "http://localhost:8000/patients/"

    initial_doc = {
        "name": "Jawad Kotaich",
        "gender": "Male",
        "DOB": "1995-05-16",        
        "phone_number": "12345678",   
        "list_of_visits": [
            {
            "date": "2025-05-16",
            "list_of_lab_test_results": [
                {"lab_test_type_id": "1029382", "result": "Positive"}
            ]
            }
        ]
    }
    try:
        # Insert a patient
        response = post(patient_root,json=initial_doc)
        response.raise_for_status()
        doc = response.json()
        inserted_id = doc["id"]
        print(f"Inserted document with id: {inserted_id}")
        print(
            "If the test fails in the middle you may want to manually remove the document."
        )
        assert doc["name"] == "Jawad Kotaich"
        assert doc["gender"] == "Male"
        assert doc["DOB"] == "1995-05-16"
        assert doc["phone_number"] == 12345678

        # List patients and ensure it's present
        response = get(patient_root)
        response.raise_for_status()
        patient_ids = {s["id"] for s in response.json()["patients"]}
        assert inserted_id in patient_ids

        # Get individual patient doc
        response = get(patient_root + inserted_id)
        response.raise_for_status()
        doc = response.json()
        assert doc["id"] == inserted_id
        assert doc["name"] == "Jawad Kotaich"
        assert doc["gender"] == "Male"
        assert doc["DOB"] == "1995-05-16"
        assert doc["phone_number"] == 12345678

        # Update the student doc
        response = put(
            patient_root + inserted_id,
            json={
                "gender": "female",
            },
        )
        response.raise_for_status()
        doc = response.json()
        assert doc["id"] == inserted_id
        assert doc["name"] == "Jawad Kotaich"
        assert doc["gender"] == "female"
        assert doc["DOB"] == "1995-05-16"
        assert doc["phone_number"] == 12345678

        # Get the patient doc and check for change
        response = get(patient_root + inserted_id)
        response.raise_for_status()
        doc = response.json()
        assert doc["id"] == inserted_id
        assert doc["name"] == "Jawad Kotaich"
        assert doc["gender"] == "female"
        assert doc["DOB"] == "1995-05-16"
        assert doc["phone_number"] == 12345678

        # Delete the doc
        response = delete(patient_root + inserted_id)
        response.raise_for_status()

        # Get the doc and ensure it's been deleted
        response = get(patient_root + inserted_id)
        assert response.status_code == 404

    except HTTPError as he:
        resp = he.response
        print(f"▶ HTTP {resp.status_code}")
        try:
            # valid JSON?
            print(resp.json())
        except ValueError:
            # non-JSON (or empty) body
            print(resp.text or "<no body>")
        raise
if __name__ == "__main__":
    test_api()