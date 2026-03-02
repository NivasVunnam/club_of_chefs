package com.samsung.chefs.service;

import com.samsung.chefs.model.Recipe;
import com.samsung.chefs.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RecipeService {
    
    @Autowired
    private RecipeRepository recipeRepository;
    
    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll();
    }
    
    public Optional<Recipe> getRecipeById(String id) {
        return recipeRepository.findById(id);
    }
    
    public List<Recipe> getRecipesByChef(String chefId) {
        return recipeRepository.findByChefId(chefId);
    }
    
    public List<Recipe> getRecipesByCategory(String category) {
        return recipeRepository.findByCategory(category);
    }
    
    public List<Recipe> getRecipesByDifficulty(String difficulty) {
        return recipeRepository.findByDifficulty(Recipe.Difficulty.valueOf(difficulty));
    }
    
    public List<Recipe> getRecipesByTag(String tag) {
        return recipeRepository.findByTagsContaining(tag);
    }
    
    public List<Recipe> getQuickRecipes(Integer maxTime) {
        return recipeRepository.findByTimeLessThanEqual(maxTime);
    }
    
    public Recipe createRecipe(Recipe recipe) {
        return recipeRepository.save(recipe);
    }
    
    public Recipe updateRecipe(String id, Recipe recipeDetails) {
        Recipe recipe = recipeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Recipe not found"));
        
        recipe.setTitle(recipeDetails.getTitle());
        recipe.setImage(recipeDetails.getImage());
        recipe.setCategory(recipeDetails.getCategory());
        recipe.setDifficulty(recipeDetails.getDifficulty());
        recipe.setTime(recipeDetails.getTime());
        recipe.setServings(recipeDetails.getServings());
        recipe.setSteps(recipeDetails.getSteps());
        recipe.setTags(recipeDetails.getTags());
        recipe.setAppliance(recipeDetails.getAppliance());
        
        return recipeRepository.save(recipe);
    }
    
    public void deleteRecipe(String id) {
        recipeRepository.deleteById(id);
    }
    
    public List<Recipe> suggestRecipes(String query) {
        // Simple mock AI suggestion based on query
        List<Recipe> allRecipes = recipeRepository.findAll();
        
        if (query == null || query.isEmpty()) {
            return allRecipes;
        }
        
        String lowerQuery = query.toLowerCase();
        
        return allRecipes.stream()
            .filter(r -> 
                r.getTitle().toLowerCase().contains(lowerQuery) ||
                (r.getTags() != null && r.getTags().stream().anyMatch(t -> t.toLowerCase().contains(lowerQuery))) ||
                (r.getIngredients() != null && r.getIngredients().stream().anyMatch(i -> 
                    i.getName().toLowerCase().contains(lowerQuery)))
            )
            .toList();
    }
}
