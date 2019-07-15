import json

from rest_framework.test import RequestsClient
from django.test.testcases import TestCase
from django.contrib.auth.models import User
import cbor2

import subt_scoring.models as dcm

class RequestTest(TestCase):
    client_class = RequestsClient
    
    @classmethod
    def setUpTestData(cls):
        test_user = User.objects.create(username="subt", password="subt")
        cls.token = dcm.Token.objects.create(user=test_user)

    def setUp(self):
        self.client = RequestsClient()
        self.client.headers.update({"Authorization": "Bearer {}".format(self.token.key)})

        self.client_no_token = RequestsClient()

        self.client_invalid_token = RequestsClient()
        self.client_invalid_token.headers.update({"Authorization": "Bearer 1111aaaa2222oooo"})

    def test_token_access(self):
        url = "http://localhost:8000/api/status/"

        client_no_token = RequestsClient()
        client_invalid_token = RequestsClient()
        client_invalid_token.headers.update({"Authorization": "Bearer 1111aaaa2222oooo"})
        
        response = client_no_token.get(url)
        self.assertEqual(response.status_code, 401)

        response = client_invalid_token.get(url)
        self.assertEqual(response.status_code, 401)


    def test_get_status(self):
        url = "http://localhost:8000/api/status/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_post_artifact_report_valid(self):
        url = "http://localhost:8000/api/artifact_reports/"
        valid_data = {
            "x" : "14",
            "y" : "65",
            "z" : "197",
            "type" : "rock",
        }
        response = self.client.post(url, json=valid_data, headers={"Content-Type" : "application/json"})
        self.assertEqual(response.status_code, 201)

    def test_post_artifact_report_invalid(self):
        url = "http://localhost:8000/api/artifact_reports/"
        invalid_data = {"test":"value"}
        response = self.client.post(url, data=json.dumps(invalid_data), headers={"Content-Type" : "application/json"})
        self.assertEqual(response.status_code, 422)

    def test_post_map_update_JSON_valid(self):
        url = "http://localhost:8000/map/update/"
        map_data = {}
        self.fail()

    def test_post_map_update_JSON_invalid(self):
        url = "http://localhost:8000/map/update/"
        invalid_map_data = {}
        response = self.client.post(url, data=json.dumps(invalid_map_data), headers={"Content-Type" : "application/json"})
        self.assertEqual(response.status_code, 422)

    def test_post_map_update_CBOR_valid(self):
        url = "http://localhost:8000/map/update/"
        map_data = {}
        self.fail()
    
    def test_post_map_update_CBOR_invalid(self):
        url = "http://localhost:8000/map/update/"
        invalid_map_data = {}
        response = self.client.post(url, data=cbor2.dumps(invalid_map_data), headers={"Content-Type" : "application/cbor"})
        self.assertEqual(response.status_code, 422)

    def test_post_state_update_JSON_valid(self):
        url = "http://localhost:8000/state/update/"
        valid_state_data = {
            "poses": []
        }
        self.fail()
    
    def test_post_state_update_JSON_invalid(self):
        url = "http://localhost:8000/state/update/"
        invalid_state_data = {
        }
        response = self.client.post(url, data=json.dumps(invalid_state_data), headers={"Content-Type" : "application/json"})
        self.assertEqual(response.status_code, 422)

    def test_post_state_update_CBOR_valid(self):
        url = "http://localhost:8000/state/update/"
        valid_state_data = {
            "poses": []
        }
        self.fail()

    def test_post_state_update_CBOR_invalid(self):
        url = "http://localhost:8000/state/update/"
        invalid_state_data = {
            "poses": [
                {
                    "position" : {
                        "x" : 2.3,
                        "z" : 422.1,
                    },
                    "orientation" : {
                        "x" : 1,
                        "y" : 22,
                        "z" : 333,
                        "w" : 4444,
                    }
                }
            ]
        }
        response = self.client.post(url, data=cbor2.dumps(invalid_state_data), headers={"Content-Type" : "application/cbor"})
        self.assertEqual(response.status_code, 422)
        print(response.text)
