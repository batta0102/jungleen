-- Ajout manuel de la colonne Sketchfab sur `classroom`
-- À exécuter si Hibernate (ddl-auto=update) ne l'a pas créée.
-- Base attendue : gestioncours (voir application.properties)

USE gestioncours;

-- Si la colonne existe déjà, MySQL renverra l'erreur 1060 (duplicate column) : ignorer dans ce cas.
ALTER TABLE classroom
    ADD COLUMN sketchfab_model_uid VARCHAR(64) NULL;
