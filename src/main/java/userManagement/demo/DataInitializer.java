package userManagement.demo;

import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    // 1. Inject your actual User Repository (adjust name to match yours)
    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String @NonNull ... args){
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUserType("admin");
            admin.setPassword("admin123");
            admin.setEmail("admin@gmail.com");
            //admin.setStatus("APPROVED");
            //admin.setId();

            userRepository.save(admin);
            System.out.println("➔➔➔ Default Admin Account Created: admin / admin123");
        }
    }
}