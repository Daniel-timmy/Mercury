import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket connection attempt")
        try:
            self.manager_id = self.scope['url_route']['kwargs']['manager_id']
            self.group_name = f'manager_{self.manager_id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"WebSocket connected: manager_id={self.manager_id}, channel_name={self.channel_name}")
        except Exception as e:
            logger.error(f"Error during WebSocket connect: {e}", exc_info=True)
            await self.close()

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f"WebSocket disconnected: manager_id={getattr(self, 'manager_id', None)}, channel_name={self.channel_name}")
        except Exception as e:
            logger.error(f"Error during WebSocket disconnect: {e}", exc_info=True)

    async def position_update(self, event):
        try:
            await self.send(text_data=json.dumps(event['data']))
            logger.debug(f"Position update sent: {event['data']}")
        except Exception as e:
            logger.error(f"Error sending position update: {e}", exc_info=True)