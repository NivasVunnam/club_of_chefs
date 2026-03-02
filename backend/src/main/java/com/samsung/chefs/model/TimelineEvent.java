package com.samsung.chefs.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "timeline_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private Integer year;
    
    private String title;
    
    @Column(length = 1000)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id")
    private Chef chef;
}
