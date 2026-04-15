package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.pidraft.entities.ReponseDonnee;
import tn.esprit.pidraft.dto.analytics.FailedQuestionStatDto;
import tn.esprit.pidraft.dto.analytics.WeakAreaStatDto;

import java.util.List;

public interface ReponseDonneeRepository extends JpaRepository<ReponseDonnee, Long> {

	@Query("""
			select new tn.esprit.pidraft.dto.analytics.FailedQuestionStatDto(
				q.id,
				q.contenu,
				qcm.titre,
				sum(case when r.estCorrect = false then 1L else 0L end),
				count(r),
				(sum(case when r.estCorrect = false then 1.0 else 0.0 end) * 100.0) / count(r)
			)
			from ReponseDonnee r
			join r.question q
			join q.qcm qcm
			group by q.id, q.contenu, qcm.titre
			order by (sum(case when r.estCorrect = false then 1.0 else 0.0 end) / count(r)) desc
			""")
	List<FailedQuestionStatDto> findMostFailedQuestions();

	@Query("""
			select new tn.esprit.pidraft.dto.analytics.WeakAreaStatDto(
				case
					when lower(q.contenu) like '%verb%' or lower(q.contenu) like '%tense%' then 'Verbs & Tenses'
					when lower(q.contenu) like '%article%' then 'Articles'
					when lower(q.contenu) like '%preposition%' then 'Prepositions'
					when lower(q.contenu) like '%pronoun%' then 'Pronouns'
					when lower(q.contenu) like '%vrai%' or lower(q.contenu) like '%false%' then 'True / False Logic'
					else 'General Grammar'
				end,
				count(r),
				(sum(case when r.estCorrect = true then 1.0 else 0.0 end) * 100.0) / count(r)
			)
			from ReponseDonnee r
			join r.question q
			group by case
				when lower(q.contenu) like '%verb%' or lower(q.contenu) like '%tense%' then 'Verbs & Tenses'
				when lower(q.contenu) like '%article%' then 'Articles'
				when lower(q.contenu) like '%preposition%' then 'Prepositions'
				when lower(q.contenu) like '%pronoun%' then 'Pronouns'
				when lower(q.contenu) like '%vrai%' or lower(q.contenu) like '%false%' then 'True / False Logic'
				else 'General Grammar'
			end
			order by (sum(case when r.estCorrect = true then 1.0 else 0.0 end) / count(r)) asc
			""")
	List<WeakAreaStatDto> findWeakGrammarAreas();
}
