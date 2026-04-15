package tn.esprit.ressources.Service.Interface;

import org.springframework.web.multipart.MultipartFile;
import tn.esprit.ressources.Entites.Product;

import java.util.List;

public interface ProductService {


    Product addProduct(Product product, MultipartFile image);
    Product updateProduct(Long id, Product product, MultipartFile image);

    Product getProductById(Long id);

    List<Product> getAllProducts();

    void deleteProduct(Long id);
}
