package com.pharmadesk.backend.security;

import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;
import java.util.List;
import java.util.ArrayList;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    String name = role.getName().replace(" ", "_").toUpperCase();
                    if (!name.startsWith("ROLE_")) name = "ROLE_" + name;
                    return new SimpleGrantedAuthority(name);
                })
                .collect(Collectors.toList());

        // Fallback: if no roles in DB, give minimal access
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                authorities
        );
    }
}
