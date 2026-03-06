"""
CascadeNet Backend — WebSocket Manager
Connection management for live dashboard updates.
"""
import json
from datetime import datetime
from typing import List, Dict, Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast JSON message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle disconnected or stale clients
                pass

    async def send_zone_update(self, zone_data: List[Dict[str, Any]]):
        """Broadcast zone state update."""
        message = {
            "event": "zone_update",
            "timestamp": datetime.now().isoformat(),
            "zones": zone_data
        }
        await self.broadcast(message)

    async def send_new_alert(self, alert_data: Dict[str, Any]):
        """Broadcast a new critical alert."""
        message = {
            "event": "new_alert",
            "timestamp": datetime.now().isoformat(),
            "alert": alert_data
        }
        await self.broadcast(message)


# Global manager instance
manager = ConnectionManager()
