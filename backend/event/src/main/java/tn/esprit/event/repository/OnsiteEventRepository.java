package tn.esprit.event.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.enums.EventStatus;

public interface OnsiteEventRepository extends JpaRepository<OnsiteEvent, Long> {

    void deleteByVenueId(Long venueId);

    @Query("""
        select (count(e) > 0)
        from OnsiteEvent e
        where e.venue.id = :venueId
                    and e.status = :activeStatus
          and e.startDate < :endDate
          and e.endDate > :startDate
          and (:excludeEventId is null or e.id <> :excludeEventId)
        """)
    boolean existsVenueOverlap(
        @Param("venueId") Long venueId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
                @Param("activeStatus") EventStatus activeStatus,
        @Param("excludeEventId") Long excludeEventId
    );

    @Query("""
        select e
        from OnsiteEvent e
        where e.venue.id = :venueId
                    and e.status = :activeStatus
          and e.startDate < :toDate
          and e.endDate > :fromDate
        order by e.startDate
        """)
    List<OnsiteEvent> findVenueBookingsInRange(
        @Param("venueId") Long venueId,
        @Param("fromDate") LocalDateTime fromDate,
                @Param("toDate") LocalDateTime toDate,
                @Param("activeStatus") EventStatus activeStatus
    );

        @Query("""
                select e
                from OnsiteEvent e
                where e.status = :activeStatus
                    and e.startDate < :toDate
                    and e.endDate > :fromDate
                order by e.startDate
                """)
        List<OnsiteEvent> findAllBookingsInRange(
                @Param("fromDate") LocalDateTime fromDate,
                @Param("toDate") LocalDateTime toDate,
                @Param("activeStatus") EventStatus activeStatus
        );
}
