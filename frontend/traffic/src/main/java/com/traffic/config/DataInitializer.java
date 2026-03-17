package com.traffic.config;

import com.traffic.entity.User;
import com.traffic.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            com.traffic.repository.ViolationRepository violationRepository) {
        return args -> {
            // Create users
            createUserIfNotFound(userRepository, passwordEncoder, "admin", "admin123", "ROLE_ADMIN");
            createUserIfNotFound(userRepository, passwordEncoder, "police1", "police123", "ROLE_POLICE");
            createUserIfNotFound(userRepository, passwordEncoder, "citizen1", "citizen123", "ROLE_CITIZEN");
            createUserIfNotFound(userRepository, passwordEncoder, "citizen2", "citizen123", "ROLE_CITIZEN");
            createUserIfNotFound(userRepository, passwordEncoder, "citizen3", "citizen123", "ROLE_CITIZEN");

            // Create sample violations for testing
            createSampleViolations(violationRepository);
        };
    }

    private void createSampleViolations(com.traffic.repository.ViolationRepository violationRepository) {
        // Only create if database is empty
        if (violationRepository.count() == 0) {
            System.out.println("Creating sample violations for testing...");

            // Sample violation 1
            com.traffic.entity.Violation v1 = new com.traffic.entity.Violation();
            v1.setVehicleNumber("MH12AB1234");
            v1.setViolationType("Over Speeding");
            v1.setFineAmount(1000.0);
            v1.setLocation("Near Signal #12, MG Road");
            v1.setDescription("Speed: 85 km/h in 60 km/h zone");
            v1.setStatus("UNPAID");
            v1.setGpsLatitude("18.5204");
            v1.setGpsLongitude("73.8567");
            violationRepository.save(v1);

            // Sample violation 2
            com.traffic.entity.Violation v2 = new com.traffic.entity.Violation();
            v2.setVehicleNumber("MH12AB1234");
            v2.setViolationType("Signal Jump");
            v2.setFineAmount(500.0);
            v2.setLocation("Mumbai-Pune Highway");
            v2.setDescription("Crossed red signal at junction");
            v2.setStatus("UNPAID");
            v2.setGpsLatitude("19.0760");
            v2.setGpsLongitude("72.8777");
            violationRepository.save(v2);

            // Sample violation 3
            com.traffic.entity.Violation v3 = new com.traffic.entity.Violation();
            v3.setVehicleNumber("MH14XY5678");
            v3.setViolationType("No Helmet");
            v3.setFineAmount(300.0);
            v3.setLocation("College Road, Nashik");
            v3.setDescription("Riding without helmet");
            v3.setStatus("UNPAID");
            v3.setGpsLatitude("19.9975");
            v3.setGpsLongitude("73.7898");
            violationRepository.save(v3);

            // Sample violation 4 (already paid)
            com.traffic.entity.Violation v4 = new com.traffic.entity.Violation();
            v4.setVehicleNumber("MH20CD9876");
            v4.setViolationType("Wrong Parking");
            v4.setFineAmount(200.0);
            v4.setLocation("Mall Parking, Thane");
            v4.setDescription("Parked in no-parking zone");
            v4.setStatus("PAID");
            v4.setGpsLatitude("19.2183");
            v4.setGpsLongitude("72.9781");
            violationRepository.save(v4);

            System.out.println("✅ Created 4 sample violations for testing");
        }
    }

    private void createUserIfNotFound(UserRepository userRepository, PasswordEncoder passwordEncoder, String username,
            String password, String role) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setEmail(username + "@traffic.com"); // Set email based on username

            // Set Indian names based on username
            if ("admin".equals(username))
                user.setName("System Admin");
            else if ("police1".equals(username))
                user.setName("Inspector Rajesh Kumar");
            else if ("citizen1".equals(username))
                user.setName("Amit Sharma");
            else if ("citizen2".equals(username))
                user.setName("Priya Patel");
            else if ("citizen3".equals(username))
                user.setName("Rahul Verma");
            else
                user.setName(username);

            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            userRepository.save(user);
            System.out.println("User created: " + username);
        } else if (!user.getPassword().startsWith("$2a$")) {
            // Fix plain text passwords from manual SQL inserts or older versions
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user); // Updated to save the modified user
            System.out.println("Updated plain text password for user: " + username);
        }
    }
}
