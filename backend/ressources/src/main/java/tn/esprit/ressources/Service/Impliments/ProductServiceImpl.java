package tn.esprit.ressources.Service.Impliments;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.ressources.Entites.Product;
import tn.esprit.ressources.Repository.ProductRepository;
import tn.esprit.ressources.Service.Interface.ProductService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
@Autowired
    private  ProductRepository productRepository;

    @Override
    public Product addProduct(Product product, MultipartFile image) {

        if (image != null && !image.isEmpty()) {
            String fileName = image.getOriginalFilename();
            product.setImage(fileName); // stocke juste le nom (simple)
        }

        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, Product product, MultipartFile image) {

        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setStock(product.getStock());
        existing.setCategory(product.getCategory());
        existing.setPrice(product.getPrice());

        // update image seulement si fournie
        if (image != null && !image.isEmpty()) {
            existing.setImage(image.getOriginalFilename());
        }

        return productRepository.save(existing);
    }


    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
