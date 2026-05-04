package tn.esprit.jungledraft.Repositories;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.jungledraft.Entities.Club;

import java.util.List;


@Repository
public interface ClubRep extends JpaRepository<Club,Long>{

    List<Club> findAllByClubOwner(String clubOwner);
    
}
