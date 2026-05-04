package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.jungledraft.Entities.ClubMembership;

import java.util.List;

@Repository
public interface ClubMembershipRep extends JpaRepository<ClubMembership,Long>{

    List<ClubMembership> findAllByClubIdClub(Long clubIdClub);

}
