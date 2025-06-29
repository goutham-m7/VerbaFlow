import asyncio
import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Room structure: {room_id: {user_id: WebSocket}}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        # User settings: {room_id: {user_id: settings}}
        self.user_settings: Dict[str, Dict[str, dict]] = {}
        # Room participants: {room_id: Set[user_id]}
        self.participants: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, settings: dict):
        await websocket.accept()
        
        # Initialize room if it doesn't exist
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
            self.user_settings[room_id] = {}
            self.participants[room_id] = set()
        
        # Add user to room
        self.rooms[room_id][user_id] = websocket
        self.user_settings[room_id][user_id] = settings
        self.participants[room_id].add(user_id)
        
        logger.info(f"User {user_id} joined room {room_id}")
        
        # Notify other participants
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "userId": user_id,
            "settings": settings,
            "timestamp": datetime.now().isoformat()
        }, exclude_user=user_id)
        
        # Send room info to new user
        await self.send_room_info(room_id, user_id)

    async def disconnect(self, room_id: str, user_id: str):
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            # Remove user from room
            del self.rooms[room_id][user_id]
            if user_id in self.user_settings[room_id]:
                del self.user_settings[room_id][user_id]
            self.participants[room_id].discard(user_id)
            
            logger.info(f"User {user_id} left room {room_id}")
            
            # Notify other participants
            await self.broadcast_to_room(room_id, {
                "type": "user_left",
                "userId": user_id,
                "timestamp": datetime.now().isoformat()
            })
            
            # Clean up empty rooms
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                del self.user_settings[room_id]
                del self.participants[room_id]
                logger.info(f"Room {room_id} cleaned up (no participants)")

    async def send_room_info(self, room_id: str, user_id: str):
        """Send current room information to a specific user"""
        if room_id not in self.rooms:
            return
        
        participants_info = []
        for pid in self.participants[room_id]:
            if pid in self.user_settings[room_id]:
                participants_info.append({
                    "userId": pid,
                    "settings": self.user_settings[room_id][pid]
                })
        
        message = {
            "type": "room_info",
            "roomId": room_id,
            "participants": participants_info,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_personal_message(message, room_id, user_id)

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: Optional[str] = None):
        """Broadcast message to all users in a room"""
        if room_id not in self.rooms:
            return
        
        disconnected_users = []
        
        for user_id, connection in self.rooms[room_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(room_id, user_id)

    async def send_personal_message(self, message: dict, room_id: str, user_id: str):
        """Send message to a specific user in a room"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            try:
                await self.rooms[room_id][user_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send personal message to user {user_id}: {e}")
                await self.disconnect(room_id, user_id)

    async def handle_translation(self, room_id: str, user_id: str, translation_data: dict):
        """Handle translation message from a user"""
        # Broadcast translation to all other users in the room
        await self.broadcast_to_room(room_id, {
            "type": "translation",
            "userId": user_id,
            "original": translation_data.get("original"),
            "translated": translation_data.get("translated"),
            "sourceLanguage": translation_data.get("sourceLanguage"),
            "targetLanguage": translation_data.get("targetLanguage"),
            "showOriginal": translation_data.get("showOriginal", True),
            "timestamp": datetime.now().isoformat()
        }, exclude_user=user_id)

    async def handle_settings_update(self, room_id: str, user_id: str, settings: dict):
        """Handle settings update from a user"""
        if room_id in self.user_settings and user_id in self.user_settings[room_id]:
            self.user_settings[room_id][user_id].update(settings)
            
            # Notify other participants of settings change
            await self.broadcast_to_room(room_id, {
                "type": "settings_updated",
                "userId": user_id,
                "settings": settings,
                "timestamp": datetime.now().isoformat()
            }, exclude_user=user_id)

    def get_room_stats(self) -> dict:
        """Get statistics about all rooms"""
        stats = {
            "total_rooms": len(self.rooms),
            "total_participants": sum(len(participants) for participants in self.participants.values()),
            "rooms": {}
        }
        
        for room_id, participants in self.participants.items():
            stats["rooms"][room_id] = {
                "participant_count": len(participants),
                "participants": list(participants)
            }
        
        return stats

# Global connection manager instance
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """WebSocket endpoint for translation sharing"""
    try:
        # Accept the connection
        await websocket.accept()
        
        # Get initial settings from the client
        initial_data = await websocket.receive_text()
        data = json.loads(initial_data)
        
        if data.get("type") == "join_room":
            settings = data.get("settings", {})
            await manager.connect(websocket, room_id, user_id, settings)
            
            # Handle incoming messages
            try:
                while True:
                    message_data = await websocket.receive_text()
                    message = json.loads(message_data)
                    
                    if message.get("type") == "translation":
                        await manager.handle_translation(room_id, user_id, message)
                    elif message.get("type") == "update_settings":
                        await manager.handle_settings_update(room_id, user_id, message.get("settings", {}))
                    elif message.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                    else:
                        logger.warning(f"Unknown message type: {message.get('type')}")
                        
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id} in room {room_id}")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
            finally:
                await manager.disconnect(room_id, user_id)
        else:
            await websocket.close(code=1008, reason="Invalid initial message")
            
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass 