package tn.esprit.ressources.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.ressources.Entites.Product;
import tn.esprit.ressources.Service.Interface.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductControlle {

    @Autowired
    private  ProductService productService;

        // CREATE
        @PostMapping(value = "/addProduct", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public Product addProduct(
                @RequestPart("product") Product product,
                @RequestPart("image") MultipartFile image
        ) {
            return productService.addProduct(product, image);
        }

    // UPDATE (image optionnelle)
    @PutMapping(value = "/updateProduct/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Product updateProduct(
            @PathVariable Long id,
            @RequestPart("product") Product product,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return productService.updateProduct(id, product, image);
    }


    @GetMapping("/getProduct/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productService.getProductById(id);
    }
    @GetMapping("/allProducts")
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }


    @DeleteMapping("/deleteProduct/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }
}
