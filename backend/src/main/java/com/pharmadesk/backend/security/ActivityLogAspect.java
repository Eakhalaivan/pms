package com.pharmadesk.backend.security;

import com.pharmadesk.backend.model.ActivityLog;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.ActivityLogRepository;
import com.pharmadesk.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class ActivityLogAspect {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogAspect(ActivityLogRepository activityLogRepository, UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) && " +
              "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping))")
    public void controllerModificationMethods() {}

    @AfterReturning(pointcut = "controllerModificationMethods()", returning = "result")
    public void logActivity(JoinPoint joinPoint, Object result) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            if (username == null || username.equals("anonymousUser")) return;

            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null) return;

            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String method = request.getMethod();
            String path = request.getRequestURI();
            String ipAddress = request.getRemoteAddr();

            String action = method;
            String module = extractModule(path);
            String description = String.format("%s request to %s", method, path);

            ActivityLog log = new ActivityLog(user, action, description, module, ipAddress);
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Log the error but don't break the application flow
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    private String extractModule(String path) {
        if (path.contains("/sales")) return "Pharmacy Sales";
        if (path.contains("/returns")) return "Medicine Returns";
        if (path.contains("/purchase-orders")) return "Purchase Orders";
        if (path.contains("/stocks")) return "Stock Management";
        if (path.contains("/medicines")) return "Medicine Master";
        return "General";
    }
}
