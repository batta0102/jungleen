package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.DTO.CreateCommentDTO;
import tn.esprit.jungledraft.Entities.ClubMessage;
import tn.esprit.jungledraft.Entities.Comment;
import tn.esprit.jungledraft.Repositories.ClubMessageRep;
import tn.esprit.jungledraft.Repositories.CommentRep;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRep commentRepository;
    private final ClubMessageRep clubMessageRep;

    public Comment create(Comment comment) {
        comment.setComment(comment.getComment().trim());
        comment.setDateCreation(new Date());
        comment.setLikes(0);
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByMessage(Long messageId) {
        // ✅ CORRECTION : Utilisez la bonne méthode du repository
        return commentRepository.findByClubMessageIdMessage(messageId);
    }

    public Comment createFromDTO(CreateCommentDTO dto) {
        Comment comment = new Comment();
        comment.setComment(dto.getComment());
        comment.setUserId(dto.getUserId());

        ClubMessage message = clubMessageRep.findById(dto.getMessageId())
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        comment.setClubMessage(message);

        comment.setDateCreation(new Date());
        comment.setLikes(0);

        return commentRepository.save(comment);
    }

    public List<Comment> getAll() {
        return commentRepository.findAll();
    }

    public Optional<Comment> getById(Long id) {
        return commentRepository.findById(id);
    }

    public List<Comment> getAllById(Long id){
        return commentRepository.findByClubMessageIdMessage(id);
    }

    public Comment likeComment(Long idComment){
        Comment comment = commentRepository.findById(idComment).orElseThrow();
        comment.setLikes(comment.getLikes()+1);
        return commentRepository.save(comment);
    }

    public Comment update(Comment comment) {
        Optional<Comment> existing = commentRepository.findById(comment.getCommentId());
        if (existing.isPresent()) {
            Comment toUpdate = existing.get();

            toUpdate.setComment(comment.getComment());
            toUpdate.setDateCreation(new Date());
            toUpdate.setUserId(comment.getUserId());
            toUpdate.setClubMessage(comment.getClubMessage());

            return commentRepository.save(toUpdate);
        } else {
            throw new RuntimeException("Comment not found with id " + comment.getCommentId());
        }
    }

    public void delete(Long id) {
        Optional<Comment> existing = commentRepository.findById(id);
        if (existing.isPresent()) {
            commentRepository.deleteById(id);
        } else {
            throw new RuntimeException("Comment not found with id " + id);
        }
    }
}