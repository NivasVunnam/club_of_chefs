package com.samsung.chefs.service;

import com.samsung.chefs.model.Chef;
import com.samsung.chefs.repository.ChefRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChefService {
    
    @Autowired
    private ChefRepository chefRepository;
    
    public List<Chef> getAllChefs() {
        return chefRepository.findAll();
    }
    
    public Optional<Chef> getChefById(String id) {
        return chefRepository.findById(id);
    }
    
    public List<Chef> getChefsByCuisine(String cuisine) {
        return chefRepository.findByCuisine(cuisine);
    }
    
    public List<Chef> getChefsByMichelinStars(Integer minStars) {
        return chefRepository.findByMichelinStarsGreaterThanEqual(minStars);
    }
    
    public Chef createChef(Chef chef) {
        return chefRepository.save(chef);
    }
    
    public Chef updateChef(String id, Chef chefDetails) {
        Chef chef = chefRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Chef not found"));
        
        chef.setName(chefDetails.getName());
        chef.setTitle(chefDetails.getTitle());
        chef.setBio(chefDetails.getBio());
        chef.setImage(chefDetails.getImage());
        chef.setMichelinStars(chefDetails.getMichelinStars());
        chef.setCuisine(chefDetails.getCuisine());
        chef.setRestaurant(chefDetails.getRestaurant());
        chef.setLocation(chefDetails.getLocation());
        
        return chefRepository.save(chef);
    }
    
    public void deleteChef(String id) {
        chefRepository.deleteById(id);
    }
}
