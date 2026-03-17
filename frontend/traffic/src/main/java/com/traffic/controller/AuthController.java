package com.traffic.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.traffic.entity.User;
import com.traffic.repository.UserRepository;
import com.traffic.security.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.DELETE, RequestMethod.OPTIONS })
public class AuthController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private JwtUtil jwtUtil;

  @Autowired
  private PasswordEncoder passwordEncoder;

  // REGISTER
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody User user) {
    try {
      System.out.println("Register request received: " + user);

      // Validate input fields
      if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
      }

      if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
      }

      if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
      }

      String username = user.getUsername().trim();
      String email = user.getEmail().trim();
      String password = user.getPassword().trim();

      // Check if username already exists
      if (userRepository.findByUsername(username).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", "Username already exists"));
      }

      // Check if email already exists
      if (userRepository.findByEmail(email).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", "Email already exists"));
      }

      // Set default role if not provided
      String role = "ROLE_CITIZEN";
      if (user.getRole() != null && !user.getRole().trim().isEmpty()) {
        role = user.getRole().trim().toUpperCase();
        if (!role.startsWith("ROLE_")) {
          role = "ROLE_" + role;
        }
      }

      // Enforce only one admin
      if ("ROLE_ADMIN".equals(role)) {
        long adminCount = userRepository.countByRole("ROLE_ADMIN");
        if (adminCount >= 1) {
          return ResponseEntity.status(HttpStatus.FORBIDDEN)
              .body(Map.of("message", "Administrator account already exists. Only one admin is allowed."));
        }
      }

      // Create new User object to avoid any persistent state issues or unwanted
      // fields
      User newUser = new User();
      newUser.setUsername(username);
      newUser.setEmail(email);
      newUser.setPassword(passwordEncoder.encode(password));
      newUser.setRole(role);

      if ("ROLE_CITIZEN".equals(role) && user.getVehicleNumber() != null) {
        newUser.setVehicleNumber(user.getVehicleNumber().trim().toUpperCase());
      }

      System.out.println("Saving user: " + newUser);
      User savedUser = userRepository.save(newUser);
      System.out.println("User saved with ID: " + savedUser.getId());

      // Don't return password in response
      savedUser.setPassword(null);

      return ResponseEntity.ok(Map.of(
          "message", "User registered successfully",
          "user", savedUser));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Registration failed: " + e.toString()));
    }
  }

  // LOGIN
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody User u) {
    try {
      System.out.println("Login request received for user: " + u.getUsername());

      // Validate input
      if (u.getUsername() == null || u.getUsername().trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
      }

      if (u.getPassword() == null || u.getPassword().trim().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
      }

      String username = u.getUsername().trim();
      Optional<User> userOptional = userRepository.findByUsername(username);

      if (userOptional.isEmpty()) {
        System.out.println("User not found: " + username);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Invalid username or password"));
      }

      User user = userOptional.get();

      if (!passwordEncoder.matches(u.getPassword(), user.getPassword())) {
        System.out.println("Password mismatch for user: " + username);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Invalid username or password"));
      }

      String token = jwtUtil.generateToken(user.getUsername());
      System.out.println("Login successful for user: " + username);

      return ResponseEntity.ok(
          Map.of(
              "token", token,
              "role", user.getRole(),
              "username", user.getUsername(),
              "vehicleNumber", user.getVehicleNumber() != null ? user.getVehicleNumber() : ""));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Login failed: " + e.toString()));
    }
  }
}
