package tn.esprit.jungle.gestioncours.entites;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.HashMap;
import java.util.Map;

@Converter
public class RiskConfigMapConverter implements AttributeConverter<Map<Long, Double>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<Long, Double> attribute) {
        Map<Long, Double> value = attribute == null ? new HashMap<>() : attribute;
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de serialiser sessionOverrides", e);
        }
    }

    @Override
    public Map<Long, Double> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new HashMap<>();
        }
        try {
            return MAPPER.readValue(dbData, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de deserialiser sessionOverrides", e);
        }
    }
}
