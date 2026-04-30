package com.pharmadesk.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origin}")
    private String allowedOrigin;

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
                .requestMatchers("/actuator/**").permitAll()

                // Admin-only endpoints
                .requestMatchers("/api/auth/users", "/api/auth/users/**").hasAuthority("ROLE_SYSTEM_ADMIN")
                .requestMatchers("/api/auth/roles", "/api/auth/roles/**").hasAuthority("ROLE_SYSTEM_ADMIN")

                // Pharmacy endpoints
                .requestMatchers("/api/pharmacy/medicines", "/api/pharmacy/medicines/**").hasAnyAuthority(
                    "ROLE_SYSTEM_ADMIN", "ROLE_SUPERVISOR",
                    "ROLE_SENIOR_MEDICAL_STAFF", "ROLE_MEDICAL_STAFF",
                    "ROLE_PHARMACY_STAFF", "ROLE_STOREKEEPER",
                    "ROLE_BILLING_STAFF"
                )
                .requestMatchers("/api/pharmacy/stocks", "/api/pharmacy/stocks/**").hasAnyAuthority(
                    "ROLE_SYSTEM_ADMIN", "ROLE_SUPERVISOR",
                    "ROLE_PHARMACY_STAFF", "ROLE_STOREKEEPER",
                    "ROLE_SENIOR_MEDICAL_STAFF"
                )
                .requestMatchers("/api/pharmacy/sales", "/api/pharmacy/sales/**").hasAnyAuthority(
                    "ROLE_SYSTEM_ADMIN", "ROLE_SUPERVISOR",
                    "ROLE_BILLING_STAFF", "ROLE_PHARMACY_STAFF"
                )
                .requestMatchers("/api/pharmacy/returns", "/api/pharmacy/returns/**").hasAnyAuthority(
                    "ROLE_SYSTEM_ADMIN", "ROLE_SUPERVISOR",
                    "ROLE_BILLING_STAFF", "ROLE_PHARMACY_STAFF",
                    "ROLE_MEDICAL_STAFF", "ROLE_SENIOR_MEDICAL_STAFF"
                )
                .requestMatchers("/api/pharmacy/dashboard", "/api/pharmacy/dashboard/**").authenticated()
                
                // Other pharmacy sub-paths (advances, prescriptions, credit-bills, etc.)
                .requestMatchers("/api/pharmacy/**").authenticated()

                // All other /api/** endpoints
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
