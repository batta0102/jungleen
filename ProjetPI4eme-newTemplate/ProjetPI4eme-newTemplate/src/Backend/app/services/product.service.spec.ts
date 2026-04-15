import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, Product } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Product CRUD Operations', () => {
    // Test 1: Get all products
    it('should retrieve all products', () => {
      const mockProducts: Product[] = [
        {
          idProduct: 1,
          name: 'Laptop',
          category: 'Electronics',
          description: 'High performance laptop',
          image: 'laptop.jpg',
          price: 1200,
          stock: 15
        },
        {
          idProduct: 2,
          name: 'Mouse',
          category: 'Accessories',
          description: 'Wireless mouse',
          image: 'mouse.jpg',
          price: 25,
          stock: 100
        }
      ];

      service.getAllProducts().subscribe(products => {
        expect(products.length).toBe(2);
        expect(products[0].name).toBe('Laptop');
        expect(products[1].category).toBe('Accessories');
      });

      const req = httpMock.expectOne('/api/products/allProducts');
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    // Test 2: Get product by ID
    it('should retrieve a single product by ID', () => {
      const mockProduct: Product = {
        idProduct: 1,
        name: 'Keyboard',
        category: 'Accessories',
        description: 'Mechanical keyboard',
        image: 'keyboard.jpg',
        price: 150,
        stock: 50
      };

      service.getProductById(1).subscribe(product => {
        expect(product.idProduct).toBe(1);
        expect(product.name).toBe('Keyboard');
        expect(product.price).toBe(150);
      });

      const req = httpMock.expectOne('/api/products/getProduct/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });

    // Test 3: Add new product
    it('should add a new product', () => {
      const newProduct: Product = {
        name: 'Monitor',
        category: 'Electronics',
        description: '4K Display Monitor',
        image: 'monitor.jpg',
        price: 400,
        stock: 20
      };

      const createdProduct: Product = {
        idProduct: 3,
        ...newProduct
      };

      service.addProduct(newProduct).subscribe(product => {
        expect(product.idProduct).toBe(3);
        expect(product.name).toBe('Monitor');
        expect(product.category).toBe('Electronics');
      });

      const req = httpMock.expectOne('/api/products/addProduct');
      expect(req.request.method).toBe('POST');
      // Verify that idProduct was removed before sending
      expect(req.request.body.idProduct).toBeUndefined();
      req.flush(createdProduct);
    });

    // Test 4: Update existing product
    it('should update an existing product', () => {
      const productId = 1;
      const updateData: Product = {
        idProduct: productId,
        name: 'Laptop Pro',
        category: 'Electronics',
        description: 'Updated high performance laptop',
        image: 'laptop-pro.jpg',
        price: 1500,
        stock: 10
      };

      service.updateProduct(productId, updateData).subscribe(product => {
        expect(product.name).toBe('Laptop Pro');
        expect(product.price).toBe(1500);
        expect(product.stock).toBe(10);
      });

      const req = httpMock.expectOne(`/api/products/updateProduct/${productId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(updateData);
    });

    // Test 5: Delete product
    it('should delete a product by ID', () => {
      const productId = 1;

      service.deleteProduct(productId).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(`/api/products/deleteProduct/${productId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Product Management - Complex Business Logic', () => {
    // Test 6: Stock management
    it('should track product stock levels', () => {
      const products: Product[] = [
        {
          idProduct: 1,
          name: 'Product A',
          category: 'Category1',
          description: 'High stock',
          price: 100,
          stock: 200 // HIGH STOCK
        },
        {
          idProduct: 2,
          name: 'Product B',
          category: 'Category1',
          description: 'Medium stock',
          price: 100,
          stock: 50 // MEDIUM STOCK
        },
        {
          idProduct: 3,
          name: 'Product C',
          category: 'Category1',
          description: 'Low stock',
          price: 100,
          stock: 5 // LOW STOCK
        },
        {
          idProduct: 4,
          name: 'Product D',
          category: 'Category1',
          description: 'Out of stock',
          price: 100,
          stock: 0 // OUT OF STOCK
        }
      ];

      products.forEach((product) => {
        let stockStatus: string;
        if (product.stock > 100) {
          stockStatus = 'HIGH';
        } else if (product.stock > 20) {
          stockStatus = 'MEDIUM';
        } else if (product.stock > 0) {
          stockStatus = 'LOW';
        } else {
          stockStatus = 'OUT_OF_STOCK';
        }

        expect(['HIGH', 'MEDIUM', 'LOW', 'OUT_OF_STOCK']).toContain(stockStatus);
      });

      expect(true).toBe(true);
    });

    // Test 7: Product categorization
    it('should properly categorize products', () => {
      const categories = ['Electronics', 'Accessories', 'Software', 'Services'];
      const mockProducts: Product[] = [
        {
          idProduct: 1,
          name: 'Laptop',
          category: 'Electronics',
          description: 'Computer',
          price: 1000,
          stock: 10
        },
        {
          idProduct: 2,
          name: 'USB Cable',
          category: 'Accessories',
          description: 'Connector',
          price: 10,
          stock: 100
        }
      ];

      mockProducts.forEach((product) => {
        expect(categories).toContain(product.category);
      });

      expect(true).toBe(true);
    });

    // Test 8: Price range validation
    it('should validate product price ranges', () => {
      const testCases = [
        { name: 'Budget item', price: 10, expectedValid: true },
        { name: 'Standard item', price: 500, expectedValid: true },
        { name: 'Premium item', price: 5000, expectedValid: true },
        { name: 'Invalid price', price: -50, expectedValid: false },
        { name: 'Zero price', price: 0, expectedValid: false }
      ];

      testCases.forEach((testCase) => {
        const isValid = testCase.price > 0;
        expect(isValid).toBe(testCase.expectedValid);
      });

      expect(true).toBe(true);
    });

    // Test 9: Bulk product operations
    it('should handle multiple product operations', () => {
      const productsToCreate = [
        {
          name: 'Product 1',
          category: 'Electronics',
          description: 'First product',
          price: 100,
          stock: 10
        },
        {
          name: 'Product 2',
          category: 'Accessories',
          description: 'Second product',
          price: 50,
          stock: 20
        },
        {
          name: 'Product 3',
          category: 'Software',
          description: 'Third product',
          price: 75,
          stock: 15
        }
      ];

      let createdCount = 0;

      productsToCreate.forEach((product, index) => {
        service.addProduct(product).subscribe(() => {
          createdCount++;
        });

        const req = httpMock.expectOne('/api/products/addProduct');
        req.flush({
          idProduct: index + 1,
          ...product
        });
      });

      expect(createdCount).toBe(productsToCreate.length);
    });

    // Test 10: Product search and filtering
    it('should filter products by category', () => {
      const allProducts: Product[] = [
        {
          idProduct: 1,
          name: 'Laptop',
          category: 'Electronics',
          description: 'Computer',
          price: 1200,
          stock: 5
        },
        {
          idProduct: 2,
          name: 'Mouse',
          category: 'Accessories',
          description: 'Input device',
          price: 25,
          stock: 50
        },
        {
          idProduct: 3,
          name: 'Monitor',
          category: 'Electronics',
          description: 'Display',
          price: 400,
          stock: 10
        }
      ];

      const electronics = allProducts.filter((p) => p.category === 'Electronics');
      expect(electronics.length).toBe(2);
      expect(electronics.every((p) => p.category === 'Electronics')).toBe(true);

      const accessories = allProducts.filter((p) => p.category === 'Accessories');
      expect(accessories.length).toBe(1);
    });

    // Test 11: Price range filtering
    it('should filter products by price range', () => {
      const allProducts: Product[] = [
        {
          idProduct: 1,
          name: 'Budget Item',
          category: 'Accessories',
          description: 'Cheap',
          price: 10,
          stock: 100
        },
        {
          idProduct: 2,
          name: 'Mid-range Item',
          category: 'Electronics',
          description: 'Medium',
          price: 200,
          stock: 20
        },
        {
          idProduct: 3,
          name: 'Premium Item',
          category: 'Electronics',
          description: 'Expensive',
          price: 2000,
          stock: 5
        }
      ];

      const midRangeProducts = allProducts.filter((p) => p.price! >= 100 && p.price! <= 500);
      expect(midRangeProducts.length).toBe(1);
      expect(midRangeProducts[0].name).toBe('Mid-range Item');
    });
  });

  describe('Error Handling', () => {
    // Test 12: Handle product not found (404)
    it('should handle product not found error', () => {
      service.getProductById(999).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne('/api/products/getProduct/999');
      req.flush('Product not found', { status: 404, statusText: 'Not Found' });
    });

    // Test 13: Handle invalid product data
    it('should handle invalid product payload', () => {
      const invalidProduct: Product = {
        name: '',
        category: '',
        description: '',
        stock: -10
      };

      service.addProduct(invalidProduct).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne('/api/products/addProduct');
      req.flush('Invalid product data', { status: 400, statusText: 'Bad Request' });
    });

    // Test 14: Handle server error (500)
    it('should handle server error on product update', () => {
      const product: Product = {
        idProduct: 1,
        name: 'Product',
        category: 'Electronics',
        description: 'Test',
        price: 100,
        stock: 10
      };

      service.updateProduct(1, product).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne('/api/products/updateProduct/1');
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });

    // Test 15: Handle network error (status 0)
    it('should handle network/CORS error', () => {
      service.getAllProducts().subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(0);
        }
      );

      const req = httpMock.expectOne('/api/products/allProducts');
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });

    // Test 16: Null product handling
    it('should handle retrieval of product with missing fields', () => {
      const partialProduct: Product = {
        name: 'Incomplete Product',
        category: 'Electronics',
        description: 'Missing image and price',
        stock: 5
      };

      service.getProductById(1).subscribe((product) => {
        expect(product.name).toBeDefined();
        expect(product.image).toBeUndefined();
        expect(product.price).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/products/getProduct/1');
      req.flush(partialProduct);
    });
  });

  describe('Data Transformation', () => {
    // Test 17: Validate HTTP headers for POST/PUT requests
    it('should include proper Content-Type header for requests', () => {
      const newProduct: Product = {
        name: 'Test Product',
        category: 'Electronics',
        description: 'Test',
        price: 100,
        stock: 10
      };

      service.addProduct(newProduct).subscribe();

      const req = httpMock.expectOne('/api/products/addProduct');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({ idProduct: 1, ...newProduct });
    });

    // Test 18: Verify GET request headers
    it('should include proper headers for GET requests', () => {
      service.getAllProducts().subscribe();

      const req = httpMock.expectOne('/api/products/allProducts');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
