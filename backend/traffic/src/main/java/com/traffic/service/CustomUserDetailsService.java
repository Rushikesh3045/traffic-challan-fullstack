package com.traffic.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import com.traffic.entity.User;
import com.traffic.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  @Autowired
  private UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String username)
      throws UsernameNotFoundException {

    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    String role = user.getRole();
    if (!role.startsWith("ROLE_")) {
      role = "ROLE_" + role;
    }
    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

    return new org.springframework.security.core.userdetails.User(
        user.getUsername().toString(),
        user.getPassword().toString(),
        authorities);
  }
}
