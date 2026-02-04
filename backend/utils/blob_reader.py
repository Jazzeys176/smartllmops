from azure.storage.blob import BlobServiceClient
import os, json

def read_jsonl_from_blob(container_name: str, blob_path: str):
    blob_service = BlobServiceClient.from_connection_string(
        os.environ["AzureWebJobsStorage"]
    )
    container = blob_service.get_container_client(container_name)
    blob = container.get_blob_client(blob_path)

    if not blob.exists():
        return []

    content = blob.download_blob().readall().decode()
    return [json.loads(line) for line in content.splitlines() if line.strip()]
