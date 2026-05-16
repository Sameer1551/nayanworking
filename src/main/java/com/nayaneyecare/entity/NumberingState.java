package com.nayaneyecare.entity;

import jakarta.persistence.*;

/**
 * Stores sequential counters (purchase, salesReturn, purchaseReturn) in MySQL.
 * Replaces the old data/numbering-state.json file.
 */
@Entity
@Table(name = "numbering_state")
public class NumberingState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "counter_key", unique = true, nullable = false, length = 100)
    private String counterKey;

    @Column(name = "counter_value", nullable = false)
    private Long counterValue;

    public NumberingState() {}

    public NumberingState(String counterKey, Long counterValue) {
        this.counterKey = counterKey;
        this.counterValue = counterValue;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCounterKey() { return counterKey; }
    public void setCounterKey(String counterKey) { this.counterKey = counterKey; }

    public Long getCounterValue() { return counterValue; }
    public void setCounterValue(Long counterValue) { this.counterValue = counterValue; }
}
