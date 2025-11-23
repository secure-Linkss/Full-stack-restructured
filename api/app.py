"""
Main Flask Application Entry Point
This file serves as the entry point for the Brain Link Tracker backend API.
"""
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import the Flask app from index.py
from api.index import app

# For local development
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)