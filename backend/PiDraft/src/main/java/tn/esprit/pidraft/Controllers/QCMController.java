package tn.esprit.pidraft.Controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.entities.TypeCible;
import tn.esprit.pidraft.Services.QCMService;
import tn.esprit.pidraft.Repositories.QCMRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/qcms")
public class QCMController {

    private final QCMService service;
    private final QCMRepository qcmRepository;

    public QCMController(QCMService service, QCMRepository qcmRepository) {
        this.service = service;
        this.qcmRepository = qcmRepository;
    }

    @GetMapping
    public List<QCM> getAllQCMs() {
        return service.getAllQCMs();
    }

    @GetMapping("/candidate")
    public List<QCM> getCandidateQCMs() {
        return qcmRepository.findByCible(TypeCible.CANDIDATE);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QCM> getQCMById(@PathVariable Long id) {
        return service.getQCMById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public QCM createQCM(@RequestBody QCM qcm) {
        return service.createQCM(qcm);
    }

    @PutMapping("/{id}")
    public QCM updateQCM(@PathVariable Long id, @RequestBody QCM qcm) {
        return service.updateQCM(id, qcm);
    }

    @DeleteMapping("/{id}")
    public void deleteQCM(@PathVariable Long id) {
        service.deleteQCM(id);
    }

    @GetMapping("/{id}/diagnostic")
    public ResponseEntity<Map<String, Object>> diagnosticQCM(@PathVariable Long id) {
        return service.getQCMById(id)
                .map(qcm -> {
                    Map<String, Object> diagnostic = new HashMap<>();
                    diagnostic.put("qcmId", qcm.getId());
                    diagnostic.put("qcmTitre", qcm.getTitre());
                    
                    List<Map<String, Object>> questionsDiag = qcm.getQuestions().stream()
                        .map(question -> {
                            Map<String, Object> qDiag = new HashMap<>();
                            qDiag.put("questionId", question.getId());
                            qDiag.put("questionContenu", question.getContenu());
                            
                            List<Map<String, Object>> choicesDiag = question.getChoix().stream()
                                .map(choice -> {
                                    Map<String, Object> cDiag = new HashMap<>();
                                    cDiag.put("choiceId", choice.getId());
                                    cDiag.put("contenu", choice.getContenu());
                                    cDiag.put("estCorrect", choice.getEstCorrect());
                                    return cDiag;
                                })
                                .toList();
                            
                            long correctChoicesCount = choicesDiag.stream()
                                .mapToLong(c -> (Boolean) c.get("estCorrect") == Boolean.TRUE ? 1L : 0L)
                                .sum();
                            
                            qDiag.put("choices", choicesDiag);
                            qDiag.put("correctChoicesCount", correctChoicesCount);
                            qDiag.put("hasCorrectChoices", correctChoicesCount > 0);
                            return qDiag;
                        })
                        .toList();
                    
                    diagnostic.put("questions", questionsDiag);
                    diagnostic.put("totalQuestions", questionsDiag.size());
                    diagnostic.put("questionsWithCorrectChoices", questionsDiag.stream()
                        .mapToLong(q -> (Boolean) q.get("hasCorrectChoices") == Boolean.TRUE ? 1L : 0L)
                        .sum());
                    
                    return ResponseEntity.ok(diagnostic);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/fix-scoring")
    public ResponseEntity<QCM> fixQCMScoring(@PathVariable Long id) {
        try {
            QCM fixedQCM = service.fixQCMScoring(id);
            return ResponseEntity.ok(fixedQCM);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
