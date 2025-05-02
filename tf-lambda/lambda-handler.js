// Import required AWS SDK modules
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const AWSXRay = require("aws-xray-sdk");

// Configure environment variables
const REGION = process.env.AWS_REGION || "eu-west-1";
const BUCKET_NAME = process.env.BUCKET_NAME || "photo-gallery101-bk";

// Configure X-Ray for better trace visualization
AWSXRay.setContextMissingStrategy("LOG_ERROR");

// Define segment names for better trace visualization
const SEGMENT_NAMES = {
  GET_IMAGES: "ImageGallery-GetImages",
  UPLOAD_IMAGE: "ImageGallery-UploadImage",
  DELETE_IMAGE: "ImageGallery-DeleteImage",
  S3_LIST: "S3-ListObjects",
  S3_PUT: "S3-PutObject",
  S3_DELETE: "S3-DeleteObject",
};

// Create S3 client
const s3Client = new S3Client({ region: REGION });

// Capture AWS SDK clients with X-Ray
const capturedS3Client = AWSXRay.captureAWSv3Client(s3Client);

// Helper function to generate the simplified public URL
const getPublicUrl = (key) => {
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
    key
  )}`;
};

// List all images in the S3 bucket
const listImages = async () => {
  // Create a new segment for the GET operation
  const segment = AWSXRay.getSegment();
  const getSegment = segment.addNewSubsegment(SEGMENT_NAMES.GET_IMAGES);

  try {
    // Add detailed annotations for the GET operation
    getSegment.addAnnotation("operation_type", "GET");
    getSegment.addAnnotation("api_endpoint", "/images");
    getSegment.addAnnotation("bucket", BUCKET_NAME);
    getSegment.addMetadata("service", "image-gallery-api");

    // Create a subsegment specifically for the S3 operation
    const s3Subsegment = getSegment.addNewSubsegment(SEGMENT_NAMES.S3_LIST);
    s3Subsegment.addAnnotation("s3_operation", "ListObjectsV2");
    s3Subsegment.addAnnotation("bucket", BUCKET_NAME);

    try {
      // Execute the S3 list operation
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
      });

      const response = await capturedS3Client.send(command);
      s3Subsegment.close();

      if (!response.Contents) {
        getSegment.close();
        return [];
      }

      // Process the images
      const images = response.Contents.map((object) => {
        if (!object.Key) return null;

        // Try to extract the original title from metadata if available
        const keyParts = object.Key.split("-");
        // Handle the timestamp part which might contain the file extension
        let timestamp = keyParts.pop(); // Remove timestamp part
        let fileExtension = "";

        if (timestamp) {
          const parts = timestamp.split(".");
          if (parts.length > 1) {
            fileExtension = parts.pop();
            timestamp = parts.join(".");
          }
        }

        const originalTitle = keyParts.join("-");

        return {
          id: object.Key,
          url: getPublicUrl(object.Key),
          title: originalTitle || object.Key.split("/").pop() || "Untitled",
          timestamp:
            object.LastModified?.toISOString() || new Date().toISOString(),
        };
      }).filter((image) => image !== null);

      getSegment.addMetadata("image_count", images.length);
      getSegment.close();
      return images;
    } catch (error) {
      s3Subsegment.addError(error);
      s3Subsegment.close();
      throw error;
    }
  } catch (error) {
    getSegment.addError(error);
    getSegment.addMetadata("error_details", error.message);
    getSegment.close();
    console.error("Error listing images:", error);
    throw error;
  }
};

// Upload an image to the S3 bucket
const uploadImage = async (base64Data, contentType, title) => {
  // Create a new segment for the POST operation
  const segment = AWSXRay.getSegment();
  const postSegment = segment.addNewSubsegment(SEGMENT_NAMES.UPLOAD_IMAGE);

  try {
    // Add detailed annotations for the POST operation
    postSegment.addAnnotation("operation_type", "POST");
    postSegment.addAnnotation("api_endpoint", "/images");
    postSegment.addAnnotation("content_type", contentType);
    postSegment.addAnnotation("title", title);
    postSegment.addAnnotation("bucket", BUCKET_NAME);
    postSegment.addMetadata("service", "image-gallery-api");

    // Generate a unique key that preserves the original title
    const timestamp = new Date().toISOString();
    const fileExtension = contentType.split("/")[1] || "jpg";
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const key = `${safeTitle}-${timestamp}.${fileExtension}`;

    // Create a subsegment specifically for the S3 operation
    const s3Subsegment = postSegment.addNewSubsegment(SEGMENT_NAMES.S3_PUT);
    s3Subsegment.addAnnotation("s3_operation", "PutObject");
    s3Subsegment.addAnnotation("bucket", BUCKET_NAME);
    s3Subsegment.addAnnotation("key", key);

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");
      postSegment.addMetadata("file_size_bytes", buffer.length);

      // Add metadata to store the original title
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          "original-title": title,
          "upload-date": timestamp,
        },
      });

      await capturedS3Client.send(command);
      s3Subsegment.close();

      const result = {
        id: key,
        url: getPublicUrl(key),
        title: title, // Preserve the original title
        timestamp: timestamp,
      };

      postSegment.addMetadata("upload_result", {
        object_key: key,
        content_type: contentType,
        success: true,
      });

      postSegment.close();
      return result;
    } catch (error) {
      s3Subsegment.addError(error);
      s3Subsegment.close();
      throw error;
    }
  } catch (error) {
    postSegment.addError(error);
    postSegment.addMetadata("error_details", error.message);
    postSegment.close();
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete an image from the S3 bucket
const deleteImage = async (imageId) => {
  // Create a new segment for the DELETE operation
  const segment = AWSXRay.getSegment();
  const deleteSegment = segment.addNewSubsegment(SEGMENT_NAMES.DELETE_IMAGE);

  try {
    // Add detailed annotations for the DELETE operation
    deleteSegment.addAnnotation("operation_type", "DELETE");
    deleteSegment.addAnnotation("api_endpoint", "/images/{id}");
    deleteSegment.addAnnotation("image_id", imageId);
    deleteSegment.addAnnotation("bucket", BUCKET_NAME);
    deleteSegment.addMetadata("service", "image-gallery-api");

    // Create a subsegment specifically for the S3 operation
    const s3Subsegment = deleteSegment.addNewSubsegment(
      SEGMENT_NAMES.S3_DELETE
    );
    s3Subsegment.addAnnotation("s3_operation", "DeleteObject");
    s3Subsegment.addAnnotation("bucket", BUCKET_NAME);
    s3Subsegment.addAnnotation("key", imageId);

    try {
      // Ensure the key is properly decoded if it came from a URL
      const decodedKey = decodeURIComponent(imageId);

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: decodedKey,
      });

      await capturedS3Client.send(command);
      s3Subsegment.close();

      // Return success information
      const result = {
        success: true,
        id: imageId,
        message: "Image deleted successfully",
      };

      deleteSegment.addMetadata("delete_result", {
        object_key: imageId,
        success: true,
      });

      deleteSegment.close();
      return result;
    } catch (error) {
      s3Subsegment.addError(error);
      s3Subsegment.close();
      throw error;
    }
  } catch (error) {
    deleteSegment.addError(error);
    deleteSegment.addMetadata("error_details", error.message);
    deleteSegment.close();
    console.error("Error deleting image:", error);
    throw error;
  }
};

// Lambda handler function
exports.handler = async (event, context) => {
  // Set up X-Ray tracing for the Lambda function
  AWSXRay.capturePromise();
  AWSXRay.captureHTTPsGlobal(require("http"));
  AWSXRay.captureHTTPsGlobal(require("https"));

  console.log("Event received:", JSON.stringify(event, null, 2));

  // Set up CORS headers - ensure we only set these headers once
  // Extract the origin from the event headers
  let origin = "http://localhost:5173";
  if (event.headers) {
    if (event.headers.origin) {
      origin = event.headers.origin;
    } else if (event.headers.Origin) {
      origin = event.headers.Origin;
    }
  }

  // Create headers object with CORS configuration
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE",
    "Access-Control-Allow-Credentials": "true",
  };

  // Handle preflight requests for CORS
  if (
    event.requestContext?.http?.method === "OPTIONS" ||
    event.httpMethod === "OPTIONS"
  ) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  try {
    // Determine the HTTP method and path based on the event format
    // Lambda Function URL format is different from API Gateway format
    let httpMethod, path, body;

    if (event.requestContext?.http) {
      // Function URL format
      httpMethod = event.requestContext.http.method;
      path = event.rawPath || event.requestContext.http.path;
      if (event.body) {
        body = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, "base64").toString())
          : JSON.parse(event.body);
      }
    } else {
      // API Gateway format
      httpMethod = event.httpMethod;
      path = event.path;
      if (event.body) {
        body = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, "base64").toString())
          : JSON.parse(event.body);
      }
    }

    console.log(`Processing ${httpMethod} request to ${path}`);

    // Handle different API routes
    if (
      httpMethod === "GET" &&
      (path === "/images" || path === "/api/images")
    ) {
      // List all images
      console.log("Listing images from S3");
      const images = await listImages();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(images),
      };
    } else if (
      httpMethod === "POST" &&
      (path === "/images" || path === "/api/images")
    ) {
      // Upload a new image
      console.log("Processing image upload request");

      if (!body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing request body" }),
        };
      }

      // For direct base64 upload
      if (body.image && body.contentType && body.title) {
        console.log(`Uploading image with title: ${body.title}`);
        const result = await uploadImage(
          body.image,
          body.contentType,
          body.title
        );
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Missing required fields: image, contentType, title",
          }),
        };
      }
    } else if (
      httpMethod === "DELETE" &&
      (path.startsWith("/images/") || path.startsWith("/api/images/"))
    ) {
      // Delete an image
      const imageId = path.replace(/^\/(?:api\/)?images\//, "");
      console.log(`Deleting image with ID: ${imageId}`);
      const result = await deleteImage(imageId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    } else {
      // Route not found
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Not found" }),
      };
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
