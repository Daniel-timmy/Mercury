from vercel.blob import AsyncBlobClient, PutBlobResult
from django.core.files.storage import default_storage
from celery import shared_task
from PIL import Image
from .models import FuelLog
import asyncio
from asgiref.sync import sync_to_async

@shared_task
def upload_file(file_path: str, folder: str, obj_id: str):
    """Handle file upload and store in Vercel Blob."""
    if not file_path:
        return {"error": "missing file"}

    async def async_upload():
        try:
            client = AsyncBlobClient()
            with default_storage.open(file_path, 'rb') as file:
                tr = file_path.split('/')[-1]
                blob = await client.put(
                    f"{folder}/{tr}",
                    file,
                    access="public",
                    add_random_suffix=True,
                )
                if type(blob) is PutBlobResult:
                    obj = await sync_to_async(FuelLog.objects.get)(id=obj_id)
                    obj.receipt_photo_url = blob.url
                    await sync_to_async(obj.save)()
                    default_storage.delete(file_path)

                    return {"url": blob.url}
        except Exception as e:
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
            raise Exception(f"File upload failed: {str(e)}")

    return asyncio.run(async_upload())


@shared_task
def send_maintenance_alerts(obj_id: str):
    """Task to send maintenance alerts for vehicles."""
    from .utils import check_and_send_maintenance_alerts
    check_and_send_maintenance_alerts()