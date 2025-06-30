import json
from bson import ObjectId
from typing import Any, Dict, List, Union

def serialize_mongo_document(doc: Any) -> Any:
    """
    Recursively serialize MongoDB documents for JSON responses.
    Converts ObjectId to string and handles nested documents.
    """
    if isinstance(doc, dict):
        return {key: serialize_mongo_document(value) for key, value in doc.items()}
    elif isinstance(doc, list):
        return [serialize_mongo_document(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif hasattr(doc, 'isoformat'):  # Handle datetime objects
        return doc.isoformat()
    else:
        return doc

def serialize_mongo_response(data: Any) -> Any:
    """
    Serialize MongoDB response data for JSON API responses.
    """
    return serialize_mongo_document(data) 