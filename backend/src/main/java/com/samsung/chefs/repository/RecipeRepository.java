package com.samsung.chefs.repository;

import com.samsung.chefs.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, String> {
    List<Recipe> findByChefId(String chefId);
    List<Recipe> findByCategory(String category);
    List<Recipe> findByDifficulty(Recipe.Difficulty difficulty);
    List<Recipe> findByTagsContaining(String tag);
    List<Recipe> findByTimeLessThanEqual(Integer time);
}
