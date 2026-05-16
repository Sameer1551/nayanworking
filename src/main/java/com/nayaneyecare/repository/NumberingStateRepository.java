package com.nayaneyecare.repository;

import com.nayaneyecare.entity.NumberingState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NumberingStateRepository extends JpaRepository<NumberingState, Long> {

    Optional<NumberingState> findByCounterKey(String counterKey);

    /**
     * Atomically increment the counter and return the NEW value.
     * Uses a SELECT FOR UPDATE pattern via a custom query.
     */
    @Query("SELECT n FROM NumberingState n WHERE n.counterKey = :key")
    Optional<NumberingState> findByCounterKeyForUpdate(@Param("key") String key);
}
