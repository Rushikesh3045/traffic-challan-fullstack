package com.traffic.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfigurationSource;

import com.traffic.security.JwtFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Autowired
  JwtFilter jwtFilter;

  @Autowired
  CorsConfigurationSource corsConfigurationSource;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // Public APIs - auth endpoints and WebSocket handshake
            .requestMatchers(
                new AntPathRequestMatcher("/api/auth/login"),
                new AntPathRequestMatcher("/api/auth/register"),
                new AntPathRequestMatcher("/traffic-websocket/**"),
                new AntPathRequestMatcher("/traffic-websocket"))
            .permitAll()

            // Violations - use AntPathRequestMatcher to fix Spring Security 6 MVC matcher
            // issue
            .requestMatchers(
                new AntPathRequestMatcher("/api/violations", "POST"))
            .hasAnyRole("POLICE", "CITIZEN", "ADMIN")
            .requestMatchers(
                new AntPathRequestMatcher("/api/violations/*", "GET"),
                new AntPathRequestMatcher("/api/violations/**", "GET"))
            .hasAnyRole("POLICE", "CITIZEN", "ADMIN")

            // Other role-based APIs
            .requestMatchers(new AntPathRequestMatcher("/api/challans/**")).hasAnyRole("ADMIN", "CITIZEN", "POLICE")
            .requestMatchers(new AntPathRequestMatcher("/api/payments/**")).hasAnyRole("CITIZEN", "ADMIN", "POLICE")
            .requestMatchers(new AntPathRequestMatcher("/api/appeals/**")).hasAnyRole("CITIZEN", "ADMIN", "POLICE")
            .requestMatchers(new AntPathRequestMatcher("/api/admin/**")).hasRole("ADMIN")

            .anyRequest().authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(
      AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }
}
