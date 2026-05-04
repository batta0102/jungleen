package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.jungledraft.Entities.Comment;

import java.util.List;

@Repository
public interface CommentRep extends JpaRepository<Comment,Long>{

    List<Comment> findByClubMessageIdMessage(Long messageId);


}
