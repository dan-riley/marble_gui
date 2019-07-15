import requests

json_headers = {
    "Authorization" : "Bearer subttesttoken123",
    "Content-Type" : "application/json",
}


no_token_headers = {
    "Content-Type" : "application/json",
}

invalid_token_headers = {
    "Authorization" : "Bearer 0123456789abcdef",
    "Content-Type" : "application/json",
}

valid_artifact_report_data = {
    "x": 14.2,
    "y": 65.5,
    "z": 197.1,
    "type": "survivor",
}

invalid_artifact_report_data = {"test": "value"}


def test_token_access():
    url = "http://localhost:8000/api/status/"
    
    # No token
    response = requests.get(url, headers=no_token_headers)
    assert response.status_code == 401

    # Invalid token
    requests.get(url, headers=invalid_token_headers)
    assert response.status_code == 401


def test_get_status():
    url = "http://localhost:8000/api/status/"

    # Correct GET /api/status/ request
    response = requests.get(url, headers=json_headers)
    assert response.status_code == 200


def test_post_artifact_report_valid():
    url = "http://localhost:8000/api/artifact_reports/"

    # Correct POST /api/artifact_reports/ request
    response = requests.post(url, json=valid_artifact_report_data, headers=json_headers)
    assert response.status_code == 201


def test_post_artifact_report_invalid():
    url = "http://localhost:8000/api/artifact_reports/"

    # Invalid POST /api/artifact_reports/ request data
    response = requests.post(url, json=invalid_artifact_report_data, headers=json_headers)
    assert response.status_code == 422




if __name__ == "__main__":
    tests_passed = 0
    tests_failed = 0

    try:
        test_token_access()
        tests_passed += 1
    except:
        print("test failed: test_token_access()")
        tests_failed += 1

    try:
        test_get_status()
        tests_passed += 1
    except:
        print("test failed: test_get_status()")
        tests_failed += 1

    try:
        test_post_artifact_report_valid()
        tests_passed += 1
    except:
        print("test failed: test_post_artifact_report_valid()")
        tests_failed += 1

    try:
        test_post_artifact_report_invalid()
        tests_passed += 1
    except:
        print("test failed: test_post_artifact_report_invalid()")
        tests_failed += 1


    print("Total number of tests passed:", tests_passed)
    print("Total number of tests failed:", tests_failed)
