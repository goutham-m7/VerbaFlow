from fastapi import WebSocket
from typing import Dict, List
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.translation_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def connect_translation(self, websocket: WebSocket):
        await websocket.accept()
        self.translation_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def disconnect_translation(self, websocket: WebSocket):
        if websocket in self.translation_connections:
            self.translation_connections.remove(websocket)

    async def handle_message(self, websocket: WebSocket, data: str):
        """Handle incoming WebSocket messages"""
        try:
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message_type == "join_meeting":
                await websocket.send_text(json.dumps({
                    "type": "meeting_joined",
                    "data": {
                        "meeting_id": message.get("data", {}).get("meeting_id"),
                        "status": "connected"
                    }
                }))
            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Unknown message type"
                }))
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))

    async def handle_translation_message(self, websocket: WebSocket, data: str):
        """Handle translation WebSocket messages"""
        try:
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "translate":
                # Mock translation response
                original_text = message.get("data", {}).get("text", "")
                target_language = message.get("data", {}).get("target_language", "es")
                
                # Simple mock translation
                translations = {
                    "es": {"hello": "hola", "how are you": "cómo estás"},
                    "fr": {"hello": "bonjour", "how are you": "comment allez-vous"}
                }
                
                translated_text = original_text
                if target_language in translations:
                    for eng, trans in translations[target_language].items():
                        if eng.lower() in original_text.lower():
                            translated_text = original_text.lower().replace(eng.lower(), trans)
                            break
                
                await websocket.send_text(json.dumps({
                    "type": "translation_result",
                    "data": {
                        "original_text": original_text,
                        "translated_text": translated_text,
                        "source_language": "en",
                        "target_language": target_language,
                        "confidence": 0.95
                    }
                }))
            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Unknown translation message type"
                }))
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))

    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove disconnected clients
                self.active_connections.remove(connection) 