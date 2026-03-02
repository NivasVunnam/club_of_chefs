package com.samsung.chefs.config;

import com.samsung.chefs.model.*;
import com.samsung.chefs.repository.ChefRepository;
import com.samsung.chefs.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private ChefRepository chefRepository;
    
    @Autowired
    private RecipeRepository recipeRepository;
    
    @Override
    public void run(String... args) {
        // Create chefs
        Chef michel = new Chef();
        michel.setName("Michel Troisgros");
        michel.setTitle("3-Michelin Star Chef");
        michel.setBio("Michel Troisgros is the celebrated chef of the iconic Restaurant Troisgros in Roanne, France. With three Michelin stars, he represents the pinnacle of French gastronomy.");
        michel.setImage("/chef-michel.jpg");
        michel.setMichelinStars(3);
        michel.setCuisine("French");
        michel.setRestaurant("Restaurant Troisgros");
        michel.setLocation("Roanne, France");
        
        List<TimelineEvent> michelTimeline = new ArrayList<>();
        michelTimeline.add(createTimelineEvent(1983, "Joined Family Restaurant", "Began working alongside his father and uncle", michel));
        michelTimeline.add(createTimelineEvent(1990, "First Michelin Star", "Earned his first star at Restaurant Troisgros", michel));
        michelTimeline.add(createTimelineEvent(1995, "Second Michelin Star", "Elevated to two-star status", michel));
        michelTimeline.add(createTimelineEvent(2006, "Third Michelin Star", "Achieved the highest culinary honor", michel));
        michel.setTimeline(michelTimeline);
        
        Chef daniel = new Chef();
        daniel.setName("Daniel Boulud");
        daniel.setTitle("Michelin Star Chef");
        daniel.setBio("Daniel Boulud is a French chef and restaurateur with restaurants in New York City, Boston, Washington D.C., and beyond.");
        daniel.setImage("/chef-michel.jpg");
        daniel.setMichelinStars(2);
        daniel.setCuisine("French-American");
        daniel.setRestaurant("Daniel");
        daniel.setLocation("New York, USA");
        
        List<TimelineEvent> danielTimeline = new ArrayList<>();
        danielTimeline.add(createTimelineEvent(1982, "Moved to New York", "Began his American culinary journey", daniel));
        danielTimeline.add(createTimelineEvent(1993, "Opened Daniel", "Launched his flagship restaurant", daniel));
        danielTimeline.add(createTimelineEvent(1998, "Three Michelin Stars", "Peak achievement at Daniel", daniel));
        daniel.setTimeline(danielTimeline);
        
        Chef yim = new Chef();
        yim.setName("Yim Jung-sik");
        yim.setTitle("Michelin Star Chef");
        yim.setBio("Yim Jung-sik is a pioneering Korean chef who brought Korean cuisine to the world stage.");
        yim.setImage("/chef-michel.jpg");
        yim.setMichelinStars(2);
        yim.setCuisine("Korean");
        yim.setRestaurant("Jungsik");
        yim.setLocation("Seoul, South Korea");
        
        List<TimelineEvent> yimTimeline = new ArrayList<>();
        yimTimeline.add(createTimelineEvent(2009, "Opened Jungsik Seoul", "Launched modern Korean fine dining", yim));
        yimTimeline.add(createTimelineEvent(2011, "Expanded to New York", "Brought Korean cuisine to Manhattan", yim));
        yimTimeline.add(createTimelineEvent(2013, "First Michelin Star", "New York location earned star", yim));
        yim.setTimeline(yimTimeline);
        
        chefRepository.saveAll(Arrays.asList(michel, daniel, yim));
        
        // Create recipes
        Recipe recipe1 = new Recipe();
        recipe1.setTitle("Garden Vegetable Terrine");
        recipe1.setImage("/recipe-1.jpg");
        recipe1.setChef(michel);
        recipe1.setCategory("Chef's Recipes");
        recipe1.setDifficulty(Recipe.Difficulty.Medium);
        recipe1.setTime(45);
        recipe1.setServings(4);
        recipe1.setSteps(Arrays.asList(
            "Prepare all vegetables by washing and cutting uniformly",
            "Blanch vegetables separately to maintain color and texture",
            "Layer vegetables in terrine mold with herbs",
            "Press and chill for at least 4 hours",
            "Slice and serve with herb oil"
        ));
        recipe1.setTags(Arrays.asList("Vegetarian", "Gluten-free"));
        recipe1.setAppliance("Samsung Chef Collection Oven");
        
        Recipe recipe2 = new Recipe();
        recipe2.setTitle("Handmade Tagliatelle");
        recipe2.setImage("/recipe-2.jpg");
        recipe2.setChef(michel);
        recipe2.setCategory("Chef's Recipes");
        recipe2.setDifficulty(Recipe.Difficulty.Hard);
        recipe2.setTime(90);
        recipe2.setServings(4);
        recipe2.setSteps(Arrays.asList(
            "Create a well in the flour and add eggs",
            "Knead until smooth and elastic",
            "Rest dough for 30 minutes",
            "Roll and cut into tagliatelle",
            "Cook in salted boiling water for 2-3 minutes"
        ));
        recipe2.setTags(Arrays.asList("Vegetarian"));
        recipe2.setAppliance("Samsung Induction Cooktop");
        
        Recipe recipe3 = new Recipe();
        recipe3.setTitle("Chocolate Sphere");
        recipe3.setImage("/recipe-3.jpg");
        recipe3.setChef(michel);
        recipe3.setCategory("Chef's Favorite Samsung");
        recipe3.setDifficulty(Recipe.Difficulty.Hard);
        recipe3.setTime(120);
        recipe3.setServings(6);
        recipe3.setSteps(Arrays.asList(
            "Temper chocolate for sphere molds",
            "Create chocolate spheres and let set",
            "Prepare ganache filling",
            "Assemble with berries inside",
            "Serve with warm chocolate sauce"
        ));
        recipe3.setTags(Arrays.asList("Vegetarian", "Gluten-free"));
        recipe3.setAppliance("Samsung Chef Collection Refrigerator");
        
        Recipe recipe4 = new Recipe();
        recipe4.setTitle("Mediterranean Seafood");
        recipe4.setImage("/recipe-4.jpg");
        recipe4.setChef(daniel);
        recipe4.setCategory("Stories");
        recipe4.setDifficulty(Recipe.Difficulty.Medium);
        recipe4.setTime(35);
        recipe4.setServings(2);
        recipe4.setSteps(Arrays.asList(
            "Clean and prepare all seafood",
            "Season with sea salt and olive oil",
            "Sear scallops until golden",
            "Poach fish in court bouillon",
            "Plate with herb butter sauce"
        ));
        recipe4.setTags(Arrays.asList("Gluten-free", "30min"));
        recipe4.setAppliance("Samsung Induction Cooktop");
        
        recipeRepository.saveAll(Arrays.asList(recipe1, recipe2, recipe3, recipe4));
        
        System.out.println("Sample data initialized successfully!");
    }
    
    private TimelineEvent createTimelineEvent(Integer year, String title, String description, Chef chef) {
        TimelineEvent event = new TimelineEvent();
        event.setYear(year);
        event.setTitle(title);
        event.setDescription(description);
        event.setChef(chef);
        return event;
    }
}
