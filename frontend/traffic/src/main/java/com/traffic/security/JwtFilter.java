package com.traffic.security;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.filter.OncePerRequestFilter;
import com.traffic.service.CustomUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    JwtUtil jwtUtil;
    @Autowired
    CustomUserDetailsService service;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain)
            throws IOException, ServletException {

        try {
            String header = req.getHeader("Authorization");
            System.out
                    .println("[JwtFilter] Request: " + req.getMethod() + " " + req.getRequestURI() + " | Auth header: "
                            + (header != null ? header.substring(0, Math.min(30, header.length())) + "..." : "NULL"));

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                String username = jwtUtil.extractUsername(token);
                System.out.println("[JwtFilter] Extracted username: " + username);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails user = service.loadUserByUsername(username);
                    System.out.println("[JwtFilter] User authorities: " + user.getAuthorities());
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    System.out.println("[JwtFilter] Authentication set successfully");
                }
            }
        } catch (Exception e) {
            // Token is invalid/expired. Ignore and proceed as anonymous.
            System.err.println("[JwtFilter] Token processing failed: " + e.getMessage());
        }

        chain.doFilter(req, res);
    }
}
