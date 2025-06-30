# Product API Endpoints - Complete Examples

## 📋 **Overview**

Complete API documentation for product management in a TypeScript/Next.js project with MongoDB. Includes product CRUD, discovery, ratings, comments, publishing, and access endpoints.

**Total Endpoints: 15+**

## 📊 **Response Format**

All endpoints follow the standardized API response format:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "error": "..."
}
```

---

## 🛒 **Product Management**

### 1. List All Products

**`GET /api/products`**

```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10&category=design&sort=createdAt&order=desc"
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|----------------|---------|---------------------------------------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 10 |
| `category` | string | Filter by category | - |
| `is_free` | boolean | Filter by free/paid | - |
| `price_min` | number | Minimum price | - |
| `price_max` | number | Maximum price | - |
| `sort` | string | Sort field: createdAt, price, etc. | createdAt |
| `order` | string | Sort direction: asc, desc | desc |
| `tags` | string | Comma-separated tags | - |
| `creator_fid` | number | Filter by creator FID | - |
| `has_preview` | boolean | Filter by preview availability | - |
| `q` | string | Text search | - |

**Response:**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "price": 10,
      "category": "design",
      "images": ["url1", "url2"],
      ...
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

---

### 2. Create New Product

**`POST /api/products`** 🔒 _Protected_

```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "name": "Figma UI Kit",
    "description": "A modern UI kit for Figma.",
    "price": 15,
    "category": "design",
    "images": ["https://..."],
    "hasExternalLinks": false,
    "digitalFiles": [
      { "fileName": "kit.fig", "fileUrl": "file-123", "fileSize": 123456 }
    ]
  }'
```

---

### 3. Get Product by ID

**`GET /api/products/[id]`**

```bash
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID"
```

---

### 4. Update Product

**`PUT /api/products/[id]`** 🔒 _Protected (Creator only)_

```bash
curl -X PUT "http://localhost:3000/api/products/PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{ "name": "Updated Name", "price": 20 }'
```

---

### 5. Delete Product

**`DELETE /api/products/[id]`** 🔒 _Protected (Creator only)_

```bash
curl -X DELETE "http://localhost:3000/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer <your_access_token>"
```

---

## 🔍 **Product Lookup & Discovery**

### 6. Search Products

**`GET /api/products/search`**

```bash
curl -X GET "http://localhost:3000/api/products/search?q=figma&page=1&limit=5"
```

**Query Parameters:**
| Parameter | Type | Description |
|-------------------|---------|---------------------------------------------|
| `q` | string | Search query (required) |
| `category` | string | Filter by category |
| `is_free` | boolean | Filter by free/paid |
| `price_min` | number | Minimum price |
| `price_max` | number | Maximum price |
| `min_rating` | number | Minimum average rating |
| `sort` | string | Sort field: relevance, createdAt, price |
| `order` | string | Sort direction: asc, desc |
| `tags` | string | Comma-separated tags |
| `creator_fid` | number | Filter by creator FID |
| `has_preview` | boolean | Filter by preview availability |
| `has_external_links` | boolean | Filter by external links |
| `page` | number | Page number |
| `limit` | number | Items per page |

---

### 7. Get Product Categories

**`GET /api/products/categories`**

```bash
curl -X GET "http://localhost:3000/api/products/categories"
```

**Response:**

```json
{
  "success": true,
  "message": "Product categories retrieved successfully",
  "data": {
    "totalCategories": 5,
    "totalProducts": 100,
    "categories": [
      {
        "category": "design",
        "count": 40,
        "freeProducts": 10,
        "paidProducts": 30,
        "averagePrice": 12.5,
        "averageRating": 4.2,
        "percentage": 40
      }
    ]
  }
}
```

---

## 👤 **Creator Endpoints**

### 8. Get My Products

**`GET /api/products/my`** 🔒 _Protected_

```bash
curl -X GET "http://localhost:3000/api/products/my?page=1&limit=10&status=published" \
  -H "Authorization: Bearer <your_access_token>"
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-------------|---------|----------------------------|-----------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 10 |
| `status` | string | all, published, draft | all |
| `sort` | string | Sort field | createdAt |
| `order` | string | Sort direction: asc, desc | desc |

---

## 🔑 **Product Access**

### 9. Get Product Access (Download/Links)

**`GET /api/products/[id]/access`** 🔒 _Protected_

```bash
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID/access" \
  -H "Authorization: Bearer <your_access_token>"
```

**Response:**

```json
{
  "success": true,
  "message": "Access granted",
  "data": {
    "productId": "...",
    "productTitle": "...",
    "hasAccess": true,
    "isCreator": false,
    "hasPurchased": true,
    "purchaseDetails": { ... },
    "access": {
      "canDownload": true,
      "canView": true,
      "canEdit": false
    },
    "downloadUrls": [
      { "fileName": "kit.fig", "url": "/api/files/file-123", "fileSize": 123456 }
    ],
    "externalLinks": null
  }
}
```

---

## 🚀 **Product Publishing**

### 10. Publish/Unpublish Product

**`POST /api/products/[id]/publish`** 🔒 _Protected (Creator only)_

```bash
curl -X POST "http://localhost:3000/api/products/PRODUCT_ID/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{ "published": true }'
```

---

## ⭐ **Product Ratings**

### 11. Get Product Ratings

**`GET /api/products/[id]/ratings`**

```bash
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID/ratings"
```

**Response:**

```json
{
  "success": true,
  "message": "Product rating statistics retrieved successfully",
  "data": {
    "averageRating": 4.5,
    "totalRatings": 20,
    "ratingsBreakdown": { "1": 1, "2": 0, "3": 2, "4": 5, "5": 12 },
    "ratingsPercentages": { "1": 5, "2": 0, "3": 10, "4": 25, "5": 60 }
  }
}
```

---

### 12. Add/Update Product Rating

**`POST /api/products/[id]/ratings`** 🔒 _Protected_

```bash
curl -X POST "http://localhost:3000/api/products/PRODUCT_ID/ratings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{ "rating": 5 }'
```

---

## 💬 **Product Comments**

### 13. Get Product Comments

**`GET /api/products/[id]/comments?page=1&limit=10`**

```bash
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID/comments?page=1&limit=10"
```

---

### 14. Add Product Comment

**`POST /api/products/[id]/comments`** 🔒 _Protected_

```bash
curl -X POST "http://localhost:3000/api/products/PRODUCT_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{ "comment": "Great product!" }'
```

---

## ❌ **Common Error Responses**

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "name is required and must be a string between 1 and 200 characters"
}
```

### Not Found

```json
{
  "success": false,
  "message": "Product not found",
  "error": "NOT_FOUND"
}
```

### Unauthorized/Forbidden

```json
{
  "success": false,
  "message": "Authentication token is required",
  "error": "UNAUTHORIZED"
}
```

---

## 📝 **Notes**

- All protected endpoints require Privy authentication via Bearer token.
- Only the creator can update, delete, or publish/unpublish their products.
- Ratings and comments require the user to be authenticated and, in some cases, to have purchased the product.
