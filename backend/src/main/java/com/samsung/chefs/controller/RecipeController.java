package com.samsung.chefs.controller;

import com.samsung.chefs.model.Recipe;
import com.samsung.chefs.service.RecipeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {
    
    @Autowired
    private RecipeService recipeService;
    
    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipeById(@PathVariable String id) {
        return recipeService.getRecipeById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/chef/{chefId}")
    public ResponseEntity<List<Recipe>> getRecipesByChef(@PathVariable String chefId) {
        return ResponseEntity.ok(recipeService.getRecipesByChef(chefId));
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Recipe>> getRecipesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(recipeService.getRecipesByCategory(category));
    }
    
    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<Recipe>> getRecipesByDifficulty(@PathVariable String difficulty) {
        return ResponseEntity.ok(recipeService.getRecipesByDifficulty(difficulty));
    }
    
    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<Recipe>> getRecipesByTag(@PathVariable String tag) {
        return ResponseEntity.ok(recipeService.getRecipesByTag(tag));
    }
    
    @GetMapping("/quick")
    public ResponseEntity<List<Recipe>> getQuickRecipes(@RequestParam(defaultValue = "30") Integer maxTime) {
        return ResponseEntity.ok(recipeService.getQuickRecipes(maxTime));
    }
    
    @PostMapping("/suggest")
    public ResponseEntity<List<Recipe>> suggestRecipes(@RequestBody Map<String, String> request) {
        String query = request.getOrDefault("query", "");
        return ResponseEntity.ok(recipeService.suggestRecipes(query));
    }
    
    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody Recipe recipe) {
        return ResponseEntity.ok(recipeService.createRecipe(recipe));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable String id, @RequestBody Recipe recipe) {
        return ResponseEntity.ok(recipeService.updateRecipe(id, recipe));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable String id) {
        recipeService.deleteRecipe(id);
        return ResponseEntity.ok().build();
    }
}
