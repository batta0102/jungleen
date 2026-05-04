package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.pidraft.entities.Resultat;
import tn.esprit.pidraft.dto.analytics.ProgressPointDto;
import tn.esprit.pidraft.dto.analytics.TopicAverageDto;

import java.util.List;

public interface ResultatRepository extends JpaRepository<Resultat, Long> {

	@Query("""
			select new tn.esprit.pidraft.dto.analytics.ProgressPointDto(
				function('date_format', r.datePublicationResultat, '%Y-%m-%d'),
				avg(r.pourcentage),
				count(r)
			)
			from Resultat r
			group by function('date_format', r.datePublicationResultat, '%Y-%m-%d')
			order by function('date_format', r.datePublicationResultat, '%Y-%m-%d')
			""")
	List<ProgressPointDto> findProgressOverTime();

	@Query("""
			select new tn.esprit.pidraft.dto.analytics.TopicAverageDto(
				coalesce(qcm.titre, 'Unknown Topic'),
				avg(r.pourcentage),
				count(r)
			)
			from Resultat r
			left join r.session session
			left join session.qcm qcm
			group by qcm.titre
			order by avg(r.pourcentage) desc
			""")
	List<TopicAverageDto> findAverageScoreByTopic();
}