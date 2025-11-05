import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connection attempt")
        # Get manager_id from URL scope (see routing below)
        self.manager_id = self.scope['url_route']['kwargs']['manager_id']
        self.group_name = f'manager_{self.manager_id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def position_update(self, event):
        await self.send(text_data=json.dumps(event['data']))