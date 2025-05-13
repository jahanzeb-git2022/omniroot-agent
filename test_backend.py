#!/usr/bin/env python3
"""
Test script to verify the backend is working correctly.
"""
import os
import sys
import requests
import json
import time

def test_backend_health():
    """Test the backend health endpoint."""
    try:
        response = requests.get("http://localhost:5000/api/health")
        response.raise_for_status()
        data = response.json()
        print("✅ Backend health check successful")
        print(f"Status: {data.get('status')}")
        print(f"Version: {data.get('version')}")
        print("Environment:")
        for key, value in data.get('environment', {}).items():
            print(f"  - {key}: {value}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check failed: {str(e)}")
        return False

def test_backend_sessions():
    """Test the backend sessions endpoint."""
    try:
        response = requests.get("http://localhost:5000/api/sessions")
        response.raise_for_status()
        data = response.json()
        print("✅ Backend sessions check successful")
        print(f"Number of sessions: {len(data.get('sessions', []))}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend sessions check failed: {str(e)}")
        return False

def test_backend_model_config():
    """Test the backend model config endpoint."""
    try:
        response = requests.get("http://localhost:5000/api/model/config")
        response.raise_for_status()
        data = response.json()
        print("✅ Backend model config check successful")
        print(f"Provider: {data.get('provider')}")
        print(f"Model: {data.get('model_name')}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend model config check failed: {str(e)}")
        return False

def test_backend_model_providers():
    """Test the backend model providers endpoint."""
    try:
        response = requests.get("http://localhost:5000/api/model/providers")
        response.raise_for_status()
        data = response.json()
        print("✅ Backend model providers check successful")
        print(f"Number of providers: {len(data.get('providers', []))}")
        for provider in data.get('providers', []):
            print(f"  - {provider.get('display_name')}: {len(provider.get('models', []))} models")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend model providers check failed: {str(e)}")
        return False

def test_backend_chat():
    """Test the backend chat endpoint."""
    try:
        payload = {
            "message": "Hello, world!",
            "session_id": "test_session",
            "workflow_id": "test_workflow",
            "step_id": 0,
            "workflow_name": "Test Workflow"
        }
        response = requests.post("http://localhost:5000/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        print("✅ Backend chat check successful")
        print(f"Response length: {len(data.get('response', ''))}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend chat check failed: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("Testing backend...")
    
    # Wait for backend to start
    max_retries = 5
    retry_count = 0
    while retry_count < max_retries:
        try:
            response = requests.get("http://localhost:5000/api/health")
            if response.status_code == 200:
                break
        except:
            pass
        print(f"Waiting for backend to start (attempt {retry_count + 1}/{max_retries})...")
        retry_count += 1
        time.sleep(2)
    
    if retry_count == max_retries:
        print("❌ Backend not available after maximum retries")
        return False
    
    # Run tests
    tests = [
        test_backend_health,
        test_backend_sessions,
        test_backend_model_config,
        test_backend_model_providers,
        test_backend_chat
    ]
    
    success_count = 0
    for test in tests:
        print("\n" + "=" * 50)
        if test():
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"Test results: {success_count}/{len(tests)} tests passed")
    
    return success_count == len(tests)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)