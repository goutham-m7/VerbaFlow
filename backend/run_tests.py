#!/usr/bin/env python3
"""
Test runner script for CI environments
"""

import sys
import os
import subprocess
from pathlib import Path

def setup_environment():
    """Set up the Python environment for testing"""
    # Get the backend directory
    backend_dir = Path(__file__).parent
    current_dir = Path.cwd()
    
    print(f"Backend directory: {backend_dir}")
    print(f"Current directory: {current_dir}")
    print(f"Python path before: {sys.path}")
    
    # Add backend directory to Python path
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    print(f"Python path after: {sys.path}")
    print(f"Changed to directory: {os.getcwd()}")

def run_tests():
    """Run the tests"""
    try:
        # Test import first
        print("Testing imports...")
        import app
        from app.services.translation import TranslationService
        print("✓ Imports successful")
        
        # Run pytest
        print("Running tests...")
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", "-v", 
            "--cov=app", 
            "--cov-report=xml", 
            "--cov-report=term-missing"
        ], capture_output=True, text=True)
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        return result.returncode
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return 1
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    setup_environment()
    exit_code = run_tests()
    sys.exit(exit_code) 