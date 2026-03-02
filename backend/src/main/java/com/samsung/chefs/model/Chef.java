package com.samsung.chefs.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "chefs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chef {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    private String title;
    
    @Column(length = 2000)
    private String bio;
    
    private String image;
    
    private Integer michelinStars;
    
    private String cuisine;
    
    private String restaurant;
    
    private String location;
    
    @OneToMany(mappedBy = "chef", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Recipe> recipes;
    
    @OneToMany(mappedBy = "chef", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TimelineEvent> timeline;
}
