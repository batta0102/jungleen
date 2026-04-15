# Product Recommendation System - Implementation Guide

## Overview
This document describes the SMART Product Recommendation feature implemented in the Spring Boot microservice.

## Current Implementation Status

### ✅ Implemented Features
- **Personalized Recommendations** (`GET /api/recommendations/me`)
  - Based on user's order history
  - Identifies top 3 categories from past orders
  - Recommends products from those categories not yet ordered
  - Falls back to global trending products
  
- **Similar Products** (`GET /api/recommendations/product/{id}`)
  - Recommends products in the same category
  - Excludes the reference product itself
  - Sorted by popularity score

### 📊 Scoring Algorithm
Current formula: **score = ordersCount**

Target formula: **score = (avgRating × ratingCount) + ordersCount**

**Why this formula?**
- `avgRating`: Product quality indicator (1-5 stars)
- `ratingCount`: Confidence/reliability metric (more reviews = more reliable)
- `ordersCount`: Popularity indicator
- Combined: Balances quality, reliability, and popularity

### 🗄️ Database Schema Consideration
**Current State:**
- ✅ Product entity with orders
- ✅ Order entity with userId and product reference
- ⚠️ Review entity is linked to **Resource**, not Product

**Impact:**
Since Review doesn't currently link to Product, the system uses order-based scoring only. 
Review metrics (avgRating, ratingCount) are currently set to 0.

## API Endpoints

### 1. Personalized Recommendations
```http
GET /api/recommendations/me?limit=10
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `limit` (optional): Number of recommendations (1-50, default: 10)

**Response:**
```json
[
  {
    "id": 123,
    "title": "Spring Boot in Action",
    "category": "Programming",
    "avgRating": 0.0,
    "ratingCount": 0,
    "ordersCount": 45,
    "score": 45.0
  }
]
```

**Algorithm:**
1. Extract userId from JWT token (Keycloak sub claim)
2. Find user's top 3 categories by order frequency
3. Query products from those categories (excluding ordered ones)
4. Sort by score descending
5. Fill remaining slots with global trending products if needed

### 2. Similar Products
```http
GET /api/recommendations/product/{id}?limit=10
```

**Parameters:**
- `id` (path): Product ID to find similar products for
- `limit` (optional): Number of recommendations (1-50, default: 10)

**Response:** Same as above

**Algorithm:**
1. Get category of the reference product
2. Query other products in same category
3. Exclude the reference product
4. Sort by score descending

## Security
- Both endpoints require JWT authentication (OAuth2 Resource Server)
- User ID extracted from JWT token (sub claim)
- No permitAll - all requests must be authenticated
- Works with API Gateway routes (/api/...)

## Files Created

### Controllers
- `RecommendationController.java` - REST API endpoints

### Services
- `RecommendationService.java` - Interface
- `RecommendationServiceImpl.java` - Business logic implementation

### Repositories
- `ProductRepository.java` - Extended with custom JPQL queries
- `ProductRecommendationProjection.java` - Query projection interface

### DTOs
- `RecommendationProductResponse.java` - Response model

## Performance Optimizations

### Avoiding N+1 Queries
All queries use:
- `LEFT JOIN` for associations
- `GROUP BY` for aggregations
- Projections to fetch only needed data
- Single query per recommendation request

### Query Examples
```java
// Get user's ordered product IDs (1 query)
List<Long> orderedIds = productRepository.findOrderedProductIdsByUserId(userId);

// Get top categories (1 query with GROUP BY)
List<String> topCategories = productRepository.findTopCategoriesByUserId(userId, 3);

// Get recommendations with all metrics (1 query with joins and aggregations)
List<ProductRecommendationProjection> recommendations = 
    productRepository.findRecommendedProductsByCategories(categories, orderedIds, limit);
```

## Testing the Implementation

### Test Scenario 1: User with Order History
```bash
# User has ordered products in "Programming" and "DevOps" categories
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/recommendations/me?limit=5
```

**Expected:** Products from Programming and DevOps categories not yet ordered

### Test Scenario 2: New User (No Orders)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/recommendations/me?limit=5
```

**Expected:** Global trending products (most ordered across all users)

### Test Scenario 3: Similar Products
```bash
curl http://localhost:8080/api/recommendations/product/123?limit=5
```

**Expected:** Products in same category as product 123

## Future Enhancement: Adding Review Support

### Step 1: Update Review Entity
Add a product relationship to the Review entity:

```java
@Entity
public class Review {
    // ... existing fields ...
    
    @ManyToOne
    @JoinColumn(name = "product_id")  // Add this column
    private Product product;
    
    // Keep resource for backward compatibility if needed
    @ManyToOne
    private Resource resource;
}
```

### Step 2: Update Product Entity
Add the reverse relationship:

```java
@Entity
public class Product {
    // ... existing fields ...
    
    @OneToMany(mappedBy = "product")
    private List<Review> reviews;
}
```

### Step 3: Update Repository Queries
Replace the queries in ProductRepository with:

```java
@Query("SELECT p.idProduct as productId, " +
       "p.name as productName, " +
       "p.category as productCategory, " +
       "COALESCE(AVG(r.rating), 0.0) as avgRating, " +
       "COALESCE(COUNT(DISTINCT r.idReview), 0) as ratingCount, " +
       "COALESCE(COUNT(DISTINCT o.idOrder), 0) as ordersCount " +
       "FROM Product p " +
       "LEFT JOIN p.orders o " +
       "LEFT JOIN p.reviews r " +  // Changed from resource join
       "WHERE p.category IN :categories " +
       "AND p.idProduct NOT IN :excludedProductIds " +
       "GROUP BY p.idProduct, p.name, p.category " +
       "ORDER BY (COALESCE(AVG(r.rating), 0.0) * COALESCE(COUNT(DISTINCT r.idReview), 0) + COALESCE(COUNT(DISTINCT o.idOrder), 0)) DESC")
```

Apply similar changes to all three queries:
- `findRecommendedProductsByCategories`
- `findTrendingProducts`
- `findSimilarProductsByCategory`

### Step 4: No Service Changes Needed
The service layer already handles the complete scoring formula and will automatically use review data once available.

## Troubleshooting

### Issue: Empty Recommendations
**Cause:** No products in database or all products already ordered
**Solution:** Add more products or check product categories

### Issue: Authentication Error
**Cause:** Missing or invalid JWT token
**Solution:** Ensure valid JWT token with sub claim is provided

### Issue: Always Returns Same Products
**Cause:** Not enough order data or limited product variety
**Solution:** Create more orders or add products in different categories

## PFE Report - Key Points

### Innovation
- Smart recommendation system without requiring ML/AI
- Pure SQL-based scoring algorithm
- Balances multiple factors: quality, reliability, popularity

### Technical Implementation
- JPQL aggregation queries for performance
- Projection interfaces to avoid N+1 problems
- Keycloak JWT integration for user context
- RESTful API design

### Scalability
- Single query per request (no N+1)
- Database-level aggregations (efficient)
- Pagination support via limit parameter
- Stateless service (horizontally scalable)

### Business Value
- Personalized user experience
- Increased product discovery
- Data-driven recommendations
- No external dependencies (self-contained)

---

**Author:** PFE Team  
**Date:** March 2026  
**Version:** 1.0
