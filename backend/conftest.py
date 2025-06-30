import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Add the parent directory to Python path for imports
parent_dir = backend_dir.parent
sys.path.insert(0, str(parent_dir))

# Remove all mock-related fixtures and imports 