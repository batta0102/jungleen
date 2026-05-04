package tn.esprit.jungledraft.Controller;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.DTO.CreateCommentDTO;
import tn.esprit.jungledraft.Entities.Comment;
import tn.esprit.jungledraft.Services.CommentService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;



    @GetMapping("/all/By-Message/{messageId}")
    public ResponseEntity<List<Comment>> getCommentsByMessage(@PathVariable Long messageId) {
        return ResponseEntity.ok(commentService.getCommentsByMessage(messageId));
    }

    @PostMapping
    public ResponseEntity<Comment> create(@RequestBody CreateCommentDTO dto) {
        return ResponseEntity.ok(commentService.createFromDTO(dto));
    }

    @GetMapping
    public ResponseEntity<List<Comment>> getAll() {
        List<Comment> comments = commentService.getAll();
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> getById(@PathVariable Long id) {
        Optional<Comment> comment = commentService.getById(id);
        return comment.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<Comment> update(@RequestBody Comment comment) {
        try {
            Comment updatedComment = commentService.update(comment);
            return ResponseEntity.ok(updatedComment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            commentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
