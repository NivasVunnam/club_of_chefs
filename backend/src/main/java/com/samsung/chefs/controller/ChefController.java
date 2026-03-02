package com.samsung.chefs.controller;

import com.samsung.chefs.model.Chef;
import com.samsung.chefs.service.ChefService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chefs")
@CrossOrigin(origins = "*")
public class ChefController {
    
    @Autowired
    private ChefService chefService;
    
    @GetMapping
    public ResponseEntity<List<Chef>> getAllChefs() {
        return ResponseEntity.ok(chefService.getAllChefs());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Chef> getChefById(@PathVariable String id) {
        return chefService.getChefById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/cuisine/{cuisine}")
    public ResponseEntity<List<Chef>> getChefsByCuisine(@PathVariable String cuisine) {
        return ResponseEntity.ok(chefService.getChefsByCuisine(cuisine));
    }
    
    @GetMapping("/michelin/{stars}")
    public ResponseEntity<List<Chef>> getChefsByMichelinStars(@PathVariable Integer stars) {
        return ResponseEntity.ok(chefService.getChefsByMichelinStars(stars));
    }
    
    @PostMapping
    public ResponseEntity<Chef> createChef(@RequestBody Chef chef) {
        return ResponseEntity.ok(chefService.createChef(chef));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Chef> updateChef(@PathVariable String id, @RequestBody Chef chef) {
        return ResponseEntity.ok(chefService.updateChef(id, chef));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChef(@PathVariable String id) {
        chefService.deleteChef(id);
        return ResponseEntity.ok().build();
    }
}
