import os
from azure.cosmos import CosmosClient

COSMOS_CONN_READ = os.environ.get("COSMOS_CONN_READ")
COSMOS_CONN_WRITE = os.environ.get("COSMOS_CONN_WRITE")
COSMOS_DB = os.environ.get("COSMOS_DB", "llmops-data")

if not COSMOS_CONN_READ or not COSMOS_CONN_WRITE:
    raise RuntimeError("❌ Cosmos connection strings not configured")

_client_read = CosmosClient.from_connection_string(COSMOS_CONN_READ)
_client_write = CosmosClient.from_connection_string(COSMOS_CONN_WRITE)

_db_read = _client_read.get_database_client(COSMOS_DB)
_db_write = _client_write.get_database_client(COSMOS_DB)

traces_container = _db_read.get_container_client("traces")
evaluations_container = _db_read.get_container_client("evaluations")
audit_container_read = _db_read.get_container_client("audit_logs")

templates_container = _db_write.get_container_client("templates")
evaluators_container = _db_write.get_container_client("evaluators")
audit_container = _db_write.get_container_client("audit_logs")

