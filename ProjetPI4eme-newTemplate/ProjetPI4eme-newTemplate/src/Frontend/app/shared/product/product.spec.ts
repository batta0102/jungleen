import { Product } from './product';

describe('Product Interface', () => {
  let product: Product;

  beforeEach(() => {
    product = {
      idProduct: 1,
      name: 'Test Product',
      category: 'Electronics',
      description: 'A test product',
      price: 99.99,
      stock: 10
    };
  });

  it('should create a Product object', () => {
    expect(product).toBeTruthy();
  });
});
