package com.traffic.controller;

import com.traffic.entity.Challan;
import com.traffic.repository.ChallanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challans")
@CrossOrigin
public class ChallanController {

    @Autowired
    private ChallanRepository challanRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getChallan(@PathVariable("id") Long id) {

        Challan challan = challanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Challan not found"));

        return ResponseEntity.ok(challan);
    }
}
