package com.samsung.chefs.repository;

import com.samsung.chefs.model.Chef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChefRepository extends JpaRepository<Chef, String> {
    List<Chef> findByCuisine(String cuisine);
    List<Chef> findByMichelinStarsGreaterThanEqual(Integer stars);
}
