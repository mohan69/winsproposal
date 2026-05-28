import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

type UploadUrlResult = {
  uploadUrl: string;
  cloud_storage_path: string;
  publicUrl?: string;
  uploadHeaders?: Record<string, string>;
};

function getAzureConfig() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim();

  if (!connectionString) throw new Error("AZURE_STORAGE_CONNECTION_STRING is required");
  if (!containerName) throw new Error("AZURE_STORAGE_CONTAINER_NAME is required");

  return { connectionString, containerName };
}

function parseConnectionString(connectionString: string) {
  const parts = Object.fromEntries(
    connectionString
      .split(";")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value)
      .map(([key, ...rest]) => [key, rest.join("=")])
  );

  const accountName = parts.AccountName;
  const accountKey = parts.AccountKey;
  if (!accountName || !accountKey) {
    throw new Error("Azure connection string must include AccountName and AccountKey");
  }

  return { accountName, accountKey };
}

function getBlobServiceClient() {
  const { connectionString } = getAzureConfig();
  return BlobServiceClient.fromConnectionString(connectionString);
}

function getSharedKeyCredential() {
  const { connectionString } = getAzureConfig();
  const { accountName, accountKey } = parseConnectionString(connectionString);
  return new StorageSharedKeyCredential(accountName, accountKey);
}

function sanitizeBlobSegment(value: string) {
  return value.replace(/[\\?#%]/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_");
}

function makeBlobName(fileName: string, isPublic: boolean) {
  const prefix = isPublic ? "public/uploads" : "uploads";
  const safeFileName = sanitizeBlobSegment(fileName || "document");
  return `${prefix}/${Date.now()}-${safeFileName}`;
}

function getContainerClient() {
  const { containerName } = getAzureConfig();
  return getBlobServiceClient().getContainerClient(containerName);
}

function createBlobSasUrl(blobName: string, contentType?: string) {
  const { containerName } = getAzureConfig();
  const credential = getSharedKeyCredential();
  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + 60 * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
      contentType,
    },
    credential
  ).toString();

  const blobClient = getContainerClient().getBlockBlobClient(blobName);
  return `${blobClient.url}?${sas}`;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<UploadUrlResult> {
  const cloud_storage_path = makeBlobName(fileName, isPublic);
  const blobClient = getContainerClient().getBlockBlobClient(cloud_storage_path);
  const uploadUrl = createBlobSasUrl(cloud_storage_path, contentType);

  return {
    uploadUrl,
    cloud_storage_path,
    publicUrl: isPublic ? blobClient.url : undefined,
    uploadHeaders: { "x-ms-blob-type": "BlockBlob" },
  };
}

export async function initiateMultipartUpload(fileName: string, isPublic: boolean = false) {
  const cloud_storage_path = makeBlobName(fileName, isPublic);
  return { uploadId: "azure-block-blob", cloud_storage_path };
}

export async function getPresignedUrlForPart(cloud_storage_path: string) {
  return createBlobSasUrl(cloud_storage_path);
}

export async function completeMultipartUpload() {
  return { ok: true };
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean) {
  const blobClient = getContainerClient().getBlockBlobClient(cloud_storage_path);
  if (isPublic) return blobClient.url;

  const { containerName } = getAzureConfig();
  const credential = getSharedKeyCredential();
  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: cloud_storage_path,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + 60 * 60 * 1000),
      protocol: SASProtocol.Https,
    },
    credential
  ).toString();

  return `${blobClient.url}?${sas}`;
}

export async function deleteFile(cloud_storage_path: string) {
  const blobClient = getContainerClient().getBlockBlobClient(cloud_storage_path);
  return blobClient.deleteIfExists();
}
