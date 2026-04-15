package tn.esprit.ressources.Service.Interface;

import tn.esprit.ressources.Entites.Review;

import java.util.List;

public interface ReviewService {
    Review addReview(Review review);
    Review updateReview(Long id, Review review);
    void deleteReview(Long id);
    Review getReviewById(Long id);
    List<Review> getAllReviews();
    List<Review> getReviewsByResourceId(Long resourceId);
}
